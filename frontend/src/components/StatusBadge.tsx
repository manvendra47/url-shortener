import type { LinkStatus } from '../types';

const STYLES: Record<LinkStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-mint-soft text-mint' },
  disabled: { label: 'Disabled', className: 'bg-paper-dim text-ink-soft' },
  expired: { label: 'Expired', className: 'bg-brick-soft text-brick' },
  limit_reached: { label: 'Limit reached', className: 'bg-amber-soft text-amber' },
};

export default function StatusBadge({ status }: { status: LinkStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {style.label}
    </span>
  );
}
