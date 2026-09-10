import { useState } from 'react';
import type { FormEvent } from 'react';
import { createLink } from '../api/links';
import { apiErrorMessage } from '../api/client';
import type { Link } from '../types';

export default function CreateLinkForm({ onCreated }: { onCreated: (link: Link) => void }) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxClicks, setMaxClicks] = useState('');
  const [password, setPassword] = useState('');
  const [requirePreview, setRequirePreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const link = await createLink({
        originalUrl,
        customCode: customCode || undefined,
        title: title || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        maxClicks: maxClicks ? Number(maxClicks) : undefined,
        password: password || undefined,
        requirePreview: requirePreview || undefined,
      });
      onCreated(link);
      setOriginalUrl('');
      setCustomCode('');
      setTitle('');
      setExpiresAt('');
      setMaxClicks('');
      setPassword('');
      setRequirePreview(false);
      setShowAdvanced(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create link'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          required
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          placeholder="https://your-long-url.com/goes-here"
          className="flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-ink outline-none transition focus:border-accent"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="whitespace-nowrap rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-ink disabled:opacity-60"
        >
          {isSubmitting ? 'Shortening…' : 'Shorten it'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="mt-3 text-xs font-medium text-ink-soft hover:text-accent"
      >
        {showAdvanced ? 'Hide options' : 'Custom code, title, or expiry ▾'}
      </button>

      {showAdvanced && (
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
            Custom code (optional)
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="my-link"
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
            Title (optional)
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Campaign name"
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
            Expires at (optional)
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
            Max clicks (optional)
            <input
              type="number"
              min={1}
              value={maxClicks}
              onChange={(e) => setMaxClicks(e.target.value)}
              placeholder="e.g. 100"
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
            Link password (optional)
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 4 characters"
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-xs font-medium text-ink-soft sm:col-span-1">
            <input
              type="checkbox"
              checked={requirePreview}
              onChange={(e) => setRequirePreview(e.target.checked)}
              className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
            />
            Show a "you're about to visit…" preview page before redirecting
          </label>
        </div>
      )}

      {error && <p className="mt-3 rounded-lg bg-brick-soft px-3.5 py-2.5 text-sm text-brick">{error}</p>}
    </form>
  );
}
