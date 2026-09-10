import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/init.js';

const router = Router();

const getLinkByCode = db.prepare('SELECT * FROM links WHERE short_code = ?');
const incrementClick = db.prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ?');
const insertClick = db.prepare(
  'INSERT INTO clicks (link_id, referrer, user_agent) VALUES (?, ?, ?)'
);

function computeStatus(link) {
  if (!link.is_active) return 'disabled';
  if (link.expires_at && new Date(link.expires_at) < new Date()) return 'expired';
  if (link.max_clicks !== null && link.click_count >= link.max_clicks) return 'limit_reached';
  return 'active';
}

const STATUS_MESSAGES = {
  disabled: 'This link has been disabled by its owner.',
  expired: 'This link has expired.',
  limit_reached: 'This link has reached its click limit.',
};

// Metadata for the interstitial/password page. Never exposes the
// destination URL when the link is password-protected — the whole point of
// the password is that the destination stays hidden until it's entered.
router.get('/:code', (req, res) => {
  const link = getLinkByCode.get(req.params.code);
  if (!link) return res.status(404).json({ error: 'Short link not found' });

  const status = computeStatus(link);
  if (status !== 'active') {
    return res.status(410).json({ error: STATUS_MESSAGES[status], status });
  }

  const hasPassword = !!link.link_password_hash;

  res.json({
    shortCode: link.short_code,
    title: link.title,
    hasPassword,
    requirePreview: !!link.require_preview,
    originalUrl: hasPassword ? null : link.original_url,
  });
});

// Confirms a visit: verifies the password when the link requires one, then
// counts the click and hands back the destination URL. The click is only
// ever counted here (or in the direct-redirect path for unprotected links),
// never just from loading the preview page — so refreshing the preview
// doesn't inflate the click count.
router.post('/:code/confirm', (req, res) => {
  const link = getLinkByCode.get(req.params.code);
  if (!link) return res.status(404).json({ error: 'Short link not found' });

  const status = computeStatus(link);
  if (status !== 'active') {
    return res.status(410).json({ error: STATUS_MESSAGES[status], status });
  }

  if (link.link_password_hash) {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: 'A password is required for this link' });
    }
    if (!bcrypt.compareSync(password, link.link_password_hash)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
  }

  incrementClick.run(link.id);
  insertClick.run(link.id, req.get('referrer') || null, req.get('user-agent') || null);

  res.json({ originalUrl: link.original_url });
});

export default router;
