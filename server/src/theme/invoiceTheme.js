/**
 * Invoice brand tokens — the PDF counterpart of client/src/theme/tokens.css.
 *
 * A PDF is printed on white paper, so the dark UI surfaces are deliberately NOT
 * reproduced: glass, blur and dark fills would waste ink and hurt legibility.
 * What carries across is the *brand* — the champagne accent, the ink colour,
 * the typographic hierarchy and the spacing rhythm.
 *
 * Change these values to re-brand the invoice.
 */
export const invoiceTheme = {
  color: {
    ink: '#1b1720',          // primary text — matches the light theme's --text-primary
    inkSoft: '#5c554f',      // secondary text
    inkMuted: '#8c847d',     // labels, footnotes
    accent: '#9c7b34',       // champagne, darkened for contrast on white
    accentSoft: '#f3ede1',   // tinted fill for banded rows
    rule: '#ddd6ca',         // hairlines
    ruleStrong: '#b9ad99',
    surface: '#ffffff',
    success: '#1f7a4d',
    danger: '#b23b2b',
  },

  font: {
    body: 'Helvetica',
    bold: 'Helvetica-Bold',
    oblique: 'Helvetica-Oblique',
  },

  size: {
    hero: 26,
    title: 15,
    body: 10,
    small: 9,
    micro: 8,
  },

  page: {
    margin: 48,
    width: 595.28,   // A4 at 72dpi
    height: 841.89,
  },

  business: {
    name: 'SalonBooker Studio',
    addressLines: ['Shashtri Nager', 'Goregaon West, Mumbai', 'Maharashtra, India'],
    email: 'hello@salonbooker.studio',
  },
};

/** Usable content width between the page margins. */
export const contentWidth = invoiceTheme.page.width - invoiceTheme.page.margin * 2;
