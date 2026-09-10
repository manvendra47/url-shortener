import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    title: 'One code, tracked forever',
    body: 'Every short link comes back with a running click count — no separate analytics tool required.',
  },
  {
    title: 'Set it to expire',
    body: 'Cap a link by date or by click count. Once it is spent, it stops working automatically.',
  },
  {
    title: 'A ticket for every link',
    body: 'Scan a generated QR code straight from your dashboard, download it, and print it anywhere.',
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">snipl.link</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Hand out the short claim ticket. Keep the long URL to yourself.
        </h1>
        <p className="mt-5 text-lg text-ink-soft">
          Snipl turns unwieldy links into short, trackable ones — with click limits, expiry dates,
          and a QR code for every single link you make.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to={user ? '/dashboard' : '/register'}
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-accent"
          >
            {user ? 'Go to dashboard' : 'Start shortening — it’s free'}
          </Link>
          {!user && (
            <Link
              to="/login"
              className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition hover:border-ink"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-line bg-white p-6">
            <h3 className="font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-ink-soft">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
