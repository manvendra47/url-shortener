import { useEffect, useState } from 'react';
import { fetchLinks } from '../api/links';
import type { Link, LinksSummary } from '../types';
import CreateLinkForm from '../components/CreateLinkForm';
import LinkTicket from '../components/LinkTicket';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [summary, setSummary] = useState<LinksSummary>({ totalLinks: 0, totalClicks: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();

    const intervalId = window.setInterval(() => {
      void load();
    }, 25000);

    const handleFocus = () => {
      void load();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  async function load() {
    setIsLoading(true);
    try {
      const { links, summary } = await fetchLinks();
      setLinks(links);
      setSummary(summary);
      setError(null);
    } catch {
      setError('Could not load your links. Try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreated(link: Link) {
    setLinks((prev) => [link, ...prev]);
    setSummary((s) => ({ totalLinks: s.totalLinks + 1, totalClicks: s.totalClicks }));
  }

  function handleChange(id: number, updated: Link | null) {
    setLinks((prev) => {
      if (updated === null) return prev.filter((l) => l.id !== id);
      return prev.map((l) => (l.id === id ? updated : l));
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your links'}
        </h1>
        <p className="text-sm text-ink-soft">
          {summary.totalLinks} link{summary.totalLinks === 1 ? '' : 's'} · {summary.totalClicks} total
          click{summary.totalClicks === 1 ? '' : 's'}
        </p>
      </div>

      <div className="mt-6">
        <CreateLinkForm onCreated={handleCreated} />
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {isLoading && <p className="font-mono text-sm text-ink-soft">loading your links…</p>}
        {error && <p className="rounded-lg bg-brick-soft px-4 py-3 text-sm text-brick">{error}</p>}

        {!isLoading && !error && links.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
            <p className="font-display text-lg text-ink">No links yet</p>
            <p className="mt-1 text-sm text-ink-soft">
              Paste a long URL above and hand out a short one instead.
            </p>
          </div>
        )}

        {links.map((link) => (
          <LinkTicket
            key={link.id}
            link={link}
            onChange={(updated) => handleChange(link.id, updated)}
          />
        ))}
      </div>
    </div>
  );
}
