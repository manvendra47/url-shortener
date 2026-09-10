import { Router } from 'express';
import { pool } from '../db/init.js';

const router = Router();

router.get('/:code', async (req, res) => {
  const result = await pool.query('SELECT * FROM links WHERE short_code = $1', [req.params.code]);
  const link = result.rows[0];

  if (!link) {
    return res.status(404).json({ error: 'Short link not found' });
  }
  if (!link.is_active) {
    return res.status(410).json({ error: 'This link has been disabled by its owner' });
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return res.status(410).json({ error: 'This link has expired' });
  }
  if (link.max_clicks !== null && link.click_count >= link.max_clicks) {
    return res.status(410).json({ error: 'This link has reached its click limit' });
  }

  // Password-protected or preview-gated links don't redirect straight away —
  // they're routed to the frontend's interstitial page, which calls the
  // public metadata/confirm endpoints below and only redirects (and only
  // then counts the click) once the visitor has confirmed or entered the
  // correct password.
  if (link.link_password_hash || link.require_preview) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(302, `${frontendUrl}/preview/${link.short_code}`);
  }

  await pool.query('UPDATE links SET click_count = click_count + 1 WHERE id = $1', [link.id]);
  await pool.query(
    'INSERT INTO clicks (link_id, referrer, user_agent) VALUES ($1, $2, $3)',
    [link.id, req.get('referrer') || null, req.get('user-agent') || null]
  );

  res.redirect(302, link.original_url);
});

export default router;
