import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { confirmPublicLink, fetchPublicLinkMeta } from '../api/publicLinks';
import { apiErrorMessage } from '../api/client';
import type { PublicLinkMeta } from '../types';

const COUNTDOWN_SECONDS = 5;

type ViewState = 'loading' | 'password' | 'preview' | 'error';

export default function PreviewPage() {
  const { code } = useParams<{ code: string }>();
  const [view, setView] = useState<ViewState>('loading');
  const [meta, setMeta] = useState<PublicLinkMeta | null>(null);
  const [errorMessage, setErrorMessage] = useState('Something went wrong');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    fetchPublicLinkMeta(code)
      .then((data) => {
        if (cancelled) return;
        setMeta(data);
        setView(data.hasPassword ? 'password' : 'preview');
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(apiErrorMessage(err, 'This link could not be found'));
        setView('error');
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (view !== 'preview') return;
    if (secondsLeft <= 0) {
      goNow();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, secondsLeft]);

  async function goNow() {
    if (!code || navigatedRef.current) return;
    navigatedRef.current = true;
    try {
      const { originalUrl } = await confirmPublicLink(code);
      window.location.href = originalUrl;
    } catch (err) {
      navigatedRef.current = false;
      setErrorMessage(apiErrorMessage(err, 'Could not continue to this link'));
      setView('error');
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code) return;
    setPasswordError(null);
    setIsVerifying(true);
    try {
      const { originalUrl } = await confirmPublicLink(code, password);
      window.location.href = originalUrl;
    } catch (err) {
      setPasswordError(apiErrorMessage(err, 'Incorrect password'));
    } finally {
      setIsVerifying(false);
    }
  }

  const domain = meta?.originalUrl ? safeHostname(meta.originalUrl) : null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-89px)] max-w-md flex-col justify-center px-6 py-16">
      {view === 'loading' && (
        <p className="text-center font-mono text-sm text-ink-soft">checking link…</p>
      )}

      {view === 'error' && (
        <div className="rounded-2xl border border-line bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brick-soft text-brick">
            ✕
          </div>
          <h1 className="mt-4 font-display text-xl font-semibold">This link isn't available</h1>
          <p className="mt-2 text-sm text-ink-soft">{errorMessage}</p>
          <RouterLink
            to="/"
            className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent"
          >
            Go to Snipl
          </RouterLink>
        </div>
      )}

      {view === 'password' && (
        <div className="rounded-2xl border border-line bg-white p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            🔒
          </div>
          <h1 className="mt-4 text-center font-display text-xl font-semibold">
            This link is password protected
          </h1>
          <p className="mt-2 text-center text-sm text-ink-soft">
            Enter the password the link owner gave you to continue.
          </p>

          <form onSubmit={handlePasswordSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Link password"
              className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-ink outline-none transition focus:border-accent"
            />
            {passwordError && (
              <p className="rounded-lg bg-brick-soft px-3.5 py-2.5 text-sm text-brick">
                {passwordError}
              </p>
            )}
            <button
              type="submit"
              disabled={isVerifying}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
            >
              {isVerifying ? 'Checking…' : 'Continue'}
            </button>
          </form>
        </div>
      )}

      {view === 'preview' && meta && (
        <div className="rounded-2xl border border-line bg-white p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            You're about to visit
          </p>
          <h1 className="mt-3 break-words font-display text-xl font-semibold text-ink">
            {domain}
          </h1>
          <p className="mt-2 break-all text-sm text-ink-soft">{meta.originalUrl}</p>

          <div className="mt-6 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent font-display text-2xl font-semibold text-accent">
              {secondsLeft}
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-soft">Continuing automatically…</p>

          <div className="mt-6 flex gap-3">
            <RouterLink
              to="/"
              className="flex-1 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink"
            >
              Cancel
            </RouterLink>
            <button
              onClick={goNow}
              className="flex-1 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent"
            >
              Continue now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
