import { useState } from 'react';
import type { Link } from '../types';
import StatusBadge from './StatusBadge';
import QrModal from './QrModal';
import { deleteLink, toggleLinkActive, updateLinkProtection } from '../api/links';
import { apiErrorMessage } from '../api/client';

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function LinkTicket({
  link,
  onChange,
}: {
  link: Link;
  onChange: (link: Link | null) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [protectionError, setProtectionError] = useState<string | null>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleToggle() {
    setIsBusy(true);
    try {
      const updated = await toggleLinkActive(link.id, !link.isActive);
      onChange(updated);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this link permanently? This cannot be undone.')) return;
    setIsBusy(true);
    try {
      await deleteLink(link.id);
      onChange(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleTogglePreview() {
    setIsBusy(true);
    setProtectionError(null);
    try {
      const updated = await updateLinkProtection(link.id, {
        requirePreview: !link.requirePreview,
      });
      onChange(updated);
    } catch (err) {
      setProtectionError(apiErrorMessage(err, 'Could not update this link'));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRemovePassword() {
    setIsBusy(true);
    setProtectionError(null);
    try {
      const updated = await updateLinkProtection(link.id, { removePassword: true });
      onChange(updated);
    } catch (err) {
      setProtectionError(apiErrorMessage(err, 'Could not remove the password'));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSetPassword() {
    if (newPassword.length < 4) {
      setProtectionError('Password must be at least 4 characters');
      return;
    }
    setIsBusy(true);
    setProtectionError(null);
    try {
      const updated = await updateLinkProtection(link.id, { password: newPassword });
      onChange(updated);
      setNewPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setProtectionError(apiErrorMessage(err, 'Could not set a password'));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <div className="ticket flex flex-col sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-2 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={link.status} />
            {link.hasPassword && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                🔒 Password
              </span>
            )}
            {link.requirePreview && (
              <span className="inline-flex items-center gap-1 rounded-full bg-paper-dim px-2.5 py-1 text-xs font-medium text-ink-soft">
                👁 Preview page
              </span>
            )}
            {link.title && <span className="truncate text-sm text-ink-soft">{link.title}</span>}
          </div>
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-lg font-medium tracking-tight text-ink hover:text-accent"
          >
            {link.shortUrl.replace(/^https?:\/\//, '')}
          </a>
          <p className="truncate text-sm text-ink-soft" title={link.originalUrl}>
            → {link.originalUrl}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            {link.expiresAt && <span>Expires {formatDate(link.expiresAt)}</span>}
            {link.maxClicks !== null && (
              <span>
                Click limit {link.clickCount}/{link.maxClicks}
              </span>
            )}
            <span>Created {formatDate(link.createdAt)}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              onClick={handleTogglePreview}
              disabled={isBusy}
              className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-ink hover:text-ink disabled:opacity-50"
            >
              {link.requirePreview ? 'Turn off preview page' : 'Turn on preview page'}
            </button>
            {link.hasPassword ? (
              <button
                onClick={handleRemovePassword}
                disabled={isBusy}
                className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-ink hover:text-ink disabled:opacity-50"
              >
                Remove password
              </button>
            ) : showPasswordForm ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-32 rounded-full border border-line px-2.5 py-1 text-xs text-ink outline-none focus:border-accent"
                />
                <button
                  onClick={handleSetPassword}
                  disabled={isBusy}
                  className="rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-paper transition hover:bg-accent disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setNewPassword('');
                    setProtectionError(null);
                  }}
                  className="text-xs text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPasswordForm(true)}
                disabled={isBusy}
                className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-ink hover:text-ink disabled:opacity-50"
              >
                Add password
              </button>
            )}
          </div>
          {protectionError && <p className="text-xs text-brick">{protectionError}</p>}
        </div>

        <div className="ticket-perforation flex items-center justify-between gap-4 px-6 py-5 sm:w-56 sm:flex-col sm:items-stretch sm:justify-center sm:gap-3">
          <div className="text-left sm:text-center">
            <p className="font-display text-3xl font-semibold leading-none">{link.clickCount}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-ink-soft">
              click{link.clickCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex gap-2 sm:flex-col">
            <button
              onClick={handleCopy}
              className="flex-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-ink"
            >
              {copied ? 'Copied ✓' : 'Copy link'}
            </button>
            <button
              onClick={() => setShowQr(true)}
              className="flex-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-ink"
            >
              QR code
            </button>
          </div>
          <div className="flex gap-2 sm:flex-col">
            <button
              onClick={handleToggle}
              disabled={isBusy}
              className="flex-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-ink hover:text-ink disabled:opacity-50"
            >
              {link.isActive ? 'Disable' : 'Enable'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isBusy}
              className="flex-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-brick transition hover:border-brick disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {showQr && <QrModal link={link} onClose={() => setShowQr(false)} />}
    </>
  );
}
