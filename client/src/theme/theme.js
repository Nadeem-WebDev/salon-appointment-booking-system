/**
 * Runtime access to the design tokens defined in tokens.css.
 * Use this anywhere a JS value is required — third-party SDKs, canvas, charts —
 * so those places stay in sync with the stylesheet instead of drifting.
 */

/** Read a single CSS custom property off <html>. */
export function getToken(name, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return value ? value.trim() : fallback;
}

/** Switch the active theme. Any value with a [data-theme] block in tokens.css. */
export function setTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'luxury-dark';
}

/** Brand colours for third-party widgets that only accept a hex string. */
export const brand = {
  get primary() {
    return getToken('--primary', '#c9a96a');
  },
  get surface() {
    return getToken('--surface', '#17151d');
  },
  get text() {
    return getToken('--text-primary', '#f4f2ee');
  },
};
