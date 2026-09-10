import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-paper">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path
                d="M11 21L21 11M14 9h9v9M18 23H9v-9"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Snipl</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-ink-soft sm:inline">{user.email}</span>
            <button
              onClick={logout}
              className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-ink hover:text-paper"
            >
              Sign out
            </button>
          </div>
        ) : (
          <nav className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper transition hover:bg-accent"
            >
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
