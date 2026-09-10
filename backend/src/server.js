import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { initializeDatabase } from './db/init.js';
import authRoutes from './routes/auth.js';
import linkRoutes from './routes/links.js';
import redirectRoutes from './routes/redirect.js';
import publicLinkRoutes from './routes/public.js';

const app = express();

// Render sits in front of the app and forwards client IP headers.
// Without this, express-rate-limit cannot safely interpret X-Forwarded-For.
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(morgan('dev'));


const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
// Tighter limit on the public confirm/password-check endpoint specifically,
// to slow down brute-forcing a link's password.
const publicLinkLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40 });

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/links', apiLimiter, linkRoutes);
app.use('/api/public/links', publicLinkLimiter, publicLinkRoutes);

// Public short-link redirect, mounted at root so links look like BASE_URL/abc123
app.use('/', redirectRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`URL shortener API listening on http://localhost:${PORT}`);
  });
}

startServer();
