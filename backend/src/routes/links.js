import { Router } from 'express';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { pool } from '../db/init.js';
import { requireAuth } from '../middleware/auth.js';
import { generateUniqueShortCode, isValidCustomCode } from '../utils/shortCode.js';

const router = Router();
router.use(requireAuth);

function computeStatus(link) {
  if (!link.is_active) return 'disabled';
  if (link.expires_at && new Date(link.expires_at) < new Date()) return 'expired';
  if (link.max_clicks !== null && link.click_count >= link.max_clicks) return 'limit_reached';
  return 'active';
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').replace(/\/+$/, '');
}

function serializeLink(link, baseUrl) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return {
    id: link.id,
    shortCode: link.short_code,
    shortUrl: `${normalizedBaseUrl}/${link.short_code}`,
    originalUrl: link.original_url,
    title: link.title,
    clickCount: link.click_count,
    maxClicks: link.max_clicks,
    expiresAt: link.expires_at,
    isActive: Boolean(link.is_active),
    hasPassword: Boolean(link.link_password_hash),
    requirePreview: Boolean(link.require_preview),
    status: computeStatus(link),
    createdAt: link.created_at,
  };
}

// Create a new short link
router.post('/', async (req, res) => {
  const { originalUrl, customCode, title, expiresAt, maxClicks, password, requirePreview } =
    req.body || {};

  if (!originalUrl || !validator.isURL(originalUrl, { require_protocol: true })) {
    return res.status(400).json({ error: 'A valid URL including http(s):// is required' });
  }

  let shortCode;
  if (customCode) {
    if (!isValidCustomCode(customCode)) {
      return res.status(400).json({
        error: 'Custom code must be 3-20 characters: letters, numbers, - or _',
      });
    }
    const existing = await pool.query('SELECT 1 FROM links WHERE short_code = $1', [customCode]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'That custom code is already taken' });
    }
    shortCode = customCode;
  } else {
    shortCode = await generateUniqueShortCode();
  }

  let expiresAtIso = null;
  if (expiresAt) {
    const d = new Date(expiresAt);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ error: 'expiresAt must be a valid date' });
    }
    if (d.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'expiresAt must be in the future' });
    }
    expiresAtIso = d.toISOString();
  }

  let maxClicksVal = null;
  if (maxClicks !== undefined && maxClicks !== null && maxClicks !== '') {
    const n = Number(maxClicks);
    if (!Number.isInteger(n) || n <= 0) {
      return res.status(400).json({ error: 'maxClicks must be a positive integer' });
    }
    maxClicksVal = n;
  }

  let passwordHash = null;
  if (password !== undefined && password !== null && password !== '') {
    if (typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Link password must be at least 4 characters' });
    }
    passwordHash = bcrypt.hashSync(password, 10);
  }

  const insertResult = await pool.query(
    `INSERT INTO links
      (user_id, short_code, original_url, title, max_clicks, expires_at, link_password_hash, require_preview)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
    [req.user.id, shortCode, originalUrl, title || null, maxClicksVal, expiresAtIso, passwordHash, requirePreview ? true : false]
  );
  const link = insertResult.rows[0];
  res.status(201).json({ link: serializeLink(link, process.env.BASE_URL) });
});

// List all of the current user's links
router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM links WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  const links = result.rows;
  res.json({
    links: links.map((l) => serializeLink(l, process.env.BASE_URL)),
    summary: {
      totalLinks: links.length,
      totalClicks: links.reduce((sum, l) => sum + Number(l.click_count), 0),
    },
  });
});

// Get a single link with recent click activity
router.get('/:id', async (req, res) => {
  const linkResult = await pool.query('SELECT * FROM links WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  const link = linkResult.rows[0];
  if (!link) return res.status(404).json({ error: 'Link not found' });

  const recentClickResult = await pool.query(
    'SELECT clicked_at, referrer, user_agent FROM clicks WHERE link_id = $1 ORDER BY clicked_at DESC LIMIT 20',
    [link.id]
  );
  res.json({ link: serializeLink(link, process.env.BASE_URL), recentClicks: recentClickResult.rows });
});

// Get a QR code (PNG data URL) for a link
router.get('/:id/qr', async (req, res) => {
  const linkResult = await pool.query('SELECT * FROM links WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  const link = linkResult.rows[0];
  if (!link) return res.status(404).json({ error: 'Link not found' });
  const shortUrl = `${normalizeBaseUrl(process.env.BASE_URL)}/${link.short_code}`;
  try {
    const dataUrl = await QRCode.toDataURL(shortUrl, {
      width: 320,
      margin: 1,
      color: { dark: '#111111', light: '#00000000' },
    });
    res.json({ qrCode: dataUrl, shortUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Update a link: enable/disable, toggle the preview interstitial, set/change/remove its password
router.patch('/:id', async (req, res) => {
  const { isActive, requirePreview, password, removePassword } = req.body || {};
  const linkResult = await pool.query('SELECT * FROM links WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  const link = linkResult.rows[0];
  if (!link) return res.status(404).json({ error: 'Link not found' });

  const nextIsActive = typeof isActive === 'boolean' ? isActive : Boolean(link.is_active);
  const nextRequirePreview =
    typeof requirePreview === 'boolean' ? requirePreview : Boolean(link.require_preview);

  let nextPasswordHash = link.link_password_hash;
  if (removePassword) {
    nextPasswordHash = null;
  } else if (password !== undefined && password !== null && password !== '') {
    if (typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Link password must be at least 4 characters' });
    }
    nextPasswordHash = bcrypt.hashSync(password, 10);
  }

  const updateResult = await pool.query(
    `UPDATE links
      SET is_active = $1, require_preview = $2, link_password_hash = $3
      WHERE id = $4 AND user_id = $5
      RETURNING *`,
    [nextIsActive, nextRequirePreview, nextPasswordHash, req.params.id, req.user.id]
  );
  const updated = updateResult.rows[0];
  res.json({ link: serializeLink(updated, process.env.BASE_URL) });
});

// Delete a link
router.delete('/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM links WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Link not found' });
  res.status(204).send();
});

export default router;
