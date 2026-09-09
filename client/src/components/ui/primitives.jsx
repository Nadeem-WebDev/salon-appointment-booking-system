import React from 'react';
import { X, Loader2, Inbox } from 'lucide-react';
import { cx } from './cx.js';


/* ==========================================================================
   BUTTON
   ========================================================================== */
const BUTTON_VARIANTS = {
  primary:
    'bg-primary text-primary-contrast hover:bg-primary-hover active:bg-primary-active shadow-sm hover:shadow-[var(--shadow-glow)] border border-transparent',
  secondary:
    'glass text-content hover:border-strong hover:bg-surface-elevated',
  ghost:
    'bg-transparent text-content-secondary hover:text-content hover:bg-surface-elevated border border-transparent',
  outline:
    'bg-transparent text-content border border-line hover:border-strong hover:bg-surface-elevated',
  danger:
    'bg-danger-soft text-danger border border-danger/30 hover:bg-danger hover:text-white',
};

const BUTTON_SIZES = {
  sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-11 px-5 text-sm gap-2 rounded-md',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-lg',
};

export function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...rest
}) {
  return (
    <Tag
      className={cx(
        'inline-flex items-center justify-center font-semibold tracking-[-0.01em] no-underline',
        'transition-all duration-[var(--transition-fast)] cursor-pointer',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-inherit',
        BUTTON_SIZES[size],
        BUTTON_VARIANTS[variant],
        className
      )}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </Tag>
  );
}

export function IconButton({ label, variant = 'ghost', size = 'md', className, children, ...rest }) {
  const box = size === 'sm' ? 'h-8 w-8 rounded-md' : 'h-10 w-10 rounded-md';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex items-center justify-center shrink-0 cursor-pointer',
        'transition-all duration-[var(--transition-fast)]',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        box,
        BUTTON_VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ==========================================================================
   SURFACES
   ========================================================================== */
export function Card({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        'bg-surface border border-subtle rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function GlassCard({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag
      className={cx('glass glass-edge rounded-[var(--radius-lg)]', className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function SectionHeader({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 mb-5', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="mt-0.5 grid place-items-center h-9 w-9 shrink-0 rounded-[var(--radius-sm)] bg-primary-soft text-primary border border-primary/20">
            <Icon size={17} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-display text-xl text-content m-0 leading-tight truncate">{title}</h3>
          {description && (
            <p className="text-[13px] text-content-secondary mt-1 m-0">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, description, action, className }) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-4 mb-6', className)}>
      <div className="min-w-0">
        <h1 className="font-display text-[1.75rem] md:text-[2rem] text-content m-0 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-content-secondary mt-1.5 m-0">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ==========================================================================
   BADGES
   ========================================================================== */
const TONES = {
  neutral: 'bg-surface-elevated text-content-secondary border-line',
  primary: 'bg-primary-soft text-primary border-primary/25',
  accent:  'bg-accent-soft text-accent border-accent/25',
  success: 'bg-success-soft text-success border-success/25',
  warning: 'bg-warning-soft text-warning border-warning/25',
  danger:  'bg-danger-soft text-danger border-danger/25',
  info:    'bg-info-soft text-info border-info/25',
};

export function Badge({ tone = 'neutral', plain = false, className, children, ...rest }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)]',
        'text-[11px] font-semibold border whitespace-nowrap',
        plain ? 'normal-case' : 'uppercase tracking-[0.06em]',
        TONES[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/** Status is carried by a label AND a dot shape, never colour alone. */
const STATUS_TONE = {
  queued: 'info',
  'in-progress': 'primary',
  completed: 'success',
  cancelled: 'danger',
};

export function StatusBadge({ status, className }) {
  const tone = STATUS_TONE[status] || 'neutral';
  const label = String(status || 'unknown').replace('-', ' ');
  return (
    <Badge tone={tone} className={className}>
      <span
        className={cx(
          'h-1.5 w-1.5 rounded-full shrink-0',
          status === 'cancelled' ? 'bg-danger' : 'bg-current'
        )}
        aria-hidden="true"
      />
      {label}
    </Badge>
  );
}

/* ==========================================================================
   FORMS
   ========================================================================== */
const FIELD_BASE =
  'w-full bg-surface-sunken text-content border border-line rounded-[var(--radius-md)] ' +
  'px-3.5 text-sm transition-all duration-[var(--transition-fast)] ' +
  'placeholder:text-content-muted ' +
  'hover:border-strong ' +
  'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-soft focus:bg-surface ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export function Field({ label, htmlFor, error, hint, required, className, children }) {
  return (
    <div className={cx('flex flex-col min-w-0', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-[11px] font-semibold uppercase tracking-[0.07em] text-content-secondary mb-1.5"
        >
          {label}
          {required && <span className="text-primary ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[12px] text-danger mt-1.5 m-0 font-medium">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-content-muted mt-1.5 m-0">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef(function Input({ invalid, className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(FIELD_BASE, 'h-11', invalid && 'border-danger focus:border-danger focus:ring-danger-soft', className)}
      {...rest}
    />
  );
});

export const Select = React.forwardRef(function Select({ invalid, className, children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(
        FIELD_BASE,
        'h-11 cursor-pointer appearance-none bg-no-repeat pr-9',
        "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%23a9a49e' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' d='M1 1.5 6 6.5 11 1.5'/%3E%3C/svg%3E\")]",
        'bg-[position:right_0.875rem_center]',
        invalid && 'border-danger focus:border-danger focus:ring-danger-soft',
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
});

export const Textarea = React.forwardRef(function Textarea({ invalid, className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(FIELD_BASE, 'py-2.5 min-h-24 resize-y', invalid && 'border-danger', className)}
      {...rest}
    />
  );
});

export function Checkbox({ label, description, className, id, ...rest }) {
  return (
    <label
      htmlFor={id}
      className={cx('flex items-start gap-3 cursor-pointer select-none group', className)}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-[var(--primary)] cursor-pointer"
        {...rest}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-content leading-snug">{label}</span>
        {description && (
          <span className="block text-[12px] text-content-secondary mt-0.5">{description}</span>
        )}
      </span>
    </label>
  );
}

/** Card-style radio, for choices that deserve visual weight. */
export function RadioCard({ checked, label, description, className, id, ...rest }) {
  return (
    <label
      htmlFor={id}
      className={cx(
        'flex-1 flex items-start gap-3 p-4 rounded-[var(--radius-md)] border cursor-pointer',
        'transition-all duration-[var(--transition-fast)]',
        checked
          ? 'border-primary bg-primary-soft shadow-[var(--shadow-glow)]'
          : 'border-line bg-surface-sunken hover:border-strong',
        className
      )}
    >
      <input
        id={id}
        type="radio"
        checked={checked}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)] cursor-pointer"
        {...rest}
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-content">{label}</span>
        {description && (
          <span className="block text-[13px] text-content-secondary mt-1">{description}</span>
        )}
      </span>
    </label>
  );
}

/* ==========================================================================
   FEEDBACK
   ========================================================================== */
export function Alert({ tone = 'info', className, children }) {
  const bar = {
    success: 'border-l-success bg-success-soft text-content',
    danger: 'border-l-danger bg-danger-soft text-content',
    warning: 'border-l-warning bg-warning-soft text-content',
    info: 'border-l-info bg-info-soft text-content',
  }[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx(
        'border border-subtle border-l-[3px] rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium animate-slideIn',
        bar,
        className
      )}
    >
      {children}
    </div>
  );
}

/** Fixed toast. `message` is {text, type}; renders nothing when text is empty. */
export function Toast({ message, onDismiss }) {
  if (!message?.text) return null;
  const tone = message.type === 'error' ? 'danger' : message.type === 'warning' ? 'warning' : 'success';
  const accent = { danger: 'text-danger', warning: 'text-warning', success: 'text-success' }[tone];
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[min(92vw,26rem)] animate-toastIn"
    >
      <div className="glass-strong glass-edge rounded-[var(--radius-md)] px-4 py-3 flex items-start gap-3">
        <span className={cx('mt-1.5 h-2 w-2 rounded-full shrink-0', accent.replace('text-', 'bg-'))} />
        <p className="flex-1 m-0 text-sm text-content font-medium leading-snug">{message.text}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="text-content-muted hover:text-content bg-transparent border-none cursor-pointer p-0.5 shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center text-center gap-3 py-14 px-6',
        'border border-dashed border-line rounded-[var(--radius-lg)] bg-surface-sunken/40',
        className
      )}
    >
      <span className="grid place-items-center h-12 w-12 rounded-full bg-surface-elevated text-content-muted border border-subtle">
        <Icon size={20} aria-hidden="true" />
      </span>
      <p className="m-0 text-[15px] font-semibold text-content">{title}</p>
      {description && (
        <p className="m-0 text-[13px] text-content-secondary max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}

export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx('flex flex-col items-center justify-center gap-3 py-14 text-content-secondary', className)}
    >
      <Loader2 size={22} className="animate-spin text-primary" aria-hidden="true" />
      <span className="text-[13px] font-medium">{label}</span>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx('skeleton', className)} aria-hidden="true" />;
}

/* ==========================================================================
   DATA DISPLAY
   ========================================================================== */
export function StatCard({ icon: Icon, label, value, trend, tone = 'primary', className }) {
  const toneRing = {
    primary: 'text-primary bg-primary-soft border-primary/20',
    success: 'text-success bg-success-soft border-success/20',
    danger: 'text-danger bg-danger-soft border-danger/20',
    accent: 'text-accent bg-accent-soft border-accent/20',
    info: 'text-info bg-info-soft border-info/20',
  }[tone];

  return (
    <GlassCard
      className={cx(
        'relative p-5 overflow-hidden transition-transform duration-[var(--transition-normal)] hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-content-secondary">
          {label}
        </p>
        {Icon && (
          <span className={cx('grid place-items-center h-8 w-8 rounded-[var(--radius-sm)] border shrink-0', toneRing)}>
            <Icon size={15} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="m-0 mt-3 text-[1.875rem] font-semibold leading-none text-content tabular-nums tracking-[-0.02em]">
        {value}
      </p>
      {trend && <p className="m-0 mt-2 text-[12px] text-content-muted">{trend}</p>}
    </GlassCard>
  );
}

export function Pagination({ page, totalPages, onPrev, onNext, className }) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Pagination"
      className={cx(
        'flex flex-col sm:flex-row items-center justify-between gap-3',
        'bg-surface border border-subtle rounded-[var(--radius-lg)] p-3',
        className
      )}
    >
      <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1} className="w-full sm:w-auto">
        ← Previous
      </Button>
      <span className="text-[13px] text-content-secondary font-medium tabular-nums">
        Page <span className="text-content font-semibold">{page}</span> of {totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages} className="w-full sm:w-auto">
        Next →
      </Button>
    </nav>
  );
}

/* ==========================================================================
   TABLE — a styled shell; pages supply their own rows
   ========================================================================== */
export function Table({ columns, children, className, minWidth = '60rem' }) {
  return (
    <div className={cx('bg-surface border border-subtle rounded-[var(--radius-lg)] overflow-hidden', className)}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse" style={{ minWidth }}>
          <thead>
            <tr className="bg-surface-sunken">
              {columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-content-secondary border-b border-subtle whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export const Td = ({ className, children, ...rest }) => (
  <td className={cx('px-4 py-3.5 text-sm text-content align-middle', className)} {...rest}>
    {children}
  </td>
);

export const Tr = ({ className, children, ...rest }) => (
  <tr
    className={cx('transition-colors duration-[var(--transition-fast)] hover:bg-surface-elevated', className)}
    {...rest}
  >
    {children}
  </tr>
);
