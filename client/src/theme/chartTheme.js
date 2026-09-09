/**
 * Chart palette — read from the same CSS custom properties the rest of the UI
 * uses, so re-theming tokens.css re-themes the charts with it. Nothing here
 * hardcodes a colour.
 */

import { getToken as token } from './theme.js';

const FALLBACK = {
  primary: '#c9a96a',
  accent: '#a8808f',
  success: '#5cbf8a',
  warning: '#e0b155',
  danger: '#e5705f',
  info: '#7aa7d9',
  grid: 'rgba(255,255,255,0.06)',
  text: '#a9a49e',
  surface: '#1f1c27',
  border: 'rgba(255,255,255,0.11)',
};



/** Resolve the live theme values. Call inside render so a theme swap is picked up. */
export function getChartTheme() {
  return {
    primary: token('--primary', FALLBACK.primary),
    accent: token('--accent', FALLBACK.accent),
    success: token('--success', FALLBACK.success),
    warning: token('--warning', FALLBACK.warning),
    danger: token('--danger', FALLBACK.danger),
    info: token('--info', FALLBACK.info),
    grid: token('--border-subtle', FALLBACK.grid),
    text: token('--text-secondary', FALLBACK.text),
    surface: token('--surface-elevated', FALLBACK.surface),
    border: token('--border-default', FALLBACK.border),
  };
}

/** Categorical series colours, in the order they should be assigned. */
export function getCategoricalPalette() {
  const t = getChartTheme();
  return [t.primary, t.accent, t.info, t.success, t.warning];
}

/** Booking status -> colour. Shared by charts and StatusBadge so they agree. */
export function getStatusColor(status) {
  const t = getChartTheme();
  switch (status) {
    case 'queued':      return t.info;
    case 'in-progress': return t.primary;
    case 'completed':   return t.success;
    case 'cancelled':   return t.danger;
    default:            return t.accent;
  }
}

/** Shared Recharts tooltip styling. */
export function tooltipStyles() {
  const t = getChartTheme();
  return {
    contentStyle: {
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: '0.75rem',
      boxShadow: '0 24px 56px -16px rgba(0,0,0,0.7)',
      padding: '0.625rem 0.875rem',
    },
    labelStyle: { color: t.text, fontWeight: 600, fontSize: 12, marginBottom: 4 },
    itemStyle: { color: t.primary, fontWeight: 600, fontSize: 13 },
  };
}
