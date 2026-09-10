import { Router } from 'express';
import { db } from '../db/init.js';

const router = Router();

const getLinkByCode = db.prepare('SELECT * FROM links WHERE short_code = ?');
const incrementClick = db.prepare('UPDATE links SET click_count = click_count + 1 WHERE id = ?');
const insertClick = db.prepare(
  'INSERT INTO clicks (link_id, referrer, user_agent) VALUES (?, ?, ?)'
);

router.get('/:code', (req, res) => {
  const link = getLinkByCode.get(req.params.code);

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

  incrementClick.run(link.id);
  insertClick.run(link.id, req.get('referrer') || null, req.get('user-agent') || null);

  res.redirect(302, link.original_url);
});

export default router;
