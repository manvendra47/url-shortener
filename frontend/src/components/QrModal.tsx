import { useEffect, useState } from 'react';
import { fetchQrCode } from '../api/links';
import type { Link } from '../types';

export default function QrModal({ link, onClose }: { link: Link; onClose: () => void }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchQrCode(link.id)
      .then(({ qrCode }) => {
        if (!cancelled) setQrCode(qrCode);
      })
      .catch(() => {
        if (!cancelled) setError('Could not generate QR code');
      });
    return () => {
      cancelled = true;
    };
  }, [link.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Scan to open</h3>
            <p className="mt-0.5 font-mono text-xs text-ink-soft">{link.shortUrl}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-ink-soft hover:bg-paper-dim hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 flex justify-center rounded-xl border border-line bg-paper p-6">
          {error && <p className="text-sm text-brick">{error}</p>}
          {!error && !qrCode && (
            <p className="font-mono text-sm text-ink-soft">generating…</p>
          )}
          {qrCode && <img src={qrCode} alt={`QR code for ${link.shortUrl}`} className="h-48 w-48" />}
        </div>

        {qrCode && (
          <a
            href={qrCode}
            download={`snipl-${link.shortCode}.png`}
            className="mt-5 block rounded-full bg-ink px-5 py-2.5 text-center text-sm font-medium text-paper transition hover:bg-accent"
          >
            Download PNG
          </a>
        )}
      </div>
    </div>
  );
}
