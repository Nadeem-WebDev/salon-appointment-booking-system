import { invoiceTheme as T } from './invoiceTheme.js';

/**
 * Transactional email styling. Shares the invoice's tokens, for the same
 * reason: mail clients strip backdrop-filter and many render on a white
 * ground, so the dark UI surfaces are translated rather than copied.
 * Inline styles only — <style> blocks are unreliable across clients.
 */
const C = T.color;

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Full email shell: header band, body, footer. */
export function emailLayout({ title, intro, body = '', footerNote = '' }) {
  return `
  <div style="background-color:#f4f1ec;padding:28px 12px;font-family:${FONT};">
    <div style="max-width:600px;margin:0 auto;background-color:${C.surface};border:1px solid ${C.rule};border-radius:14px;overflow:hidden;">

      <div style="background-color:${C.ink};padding:26px 28px;">
        <p style="margin:0;color:${C.accent};font-size:11px;letter-spacing:2.4px;text-transform:uppercase;">
          ${T.business.name}
        </p>
        <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:600;line-height:1.25;">
          ${title}
        </h1>
      </div>

      <div style="height:3px;background-color:${C.accent};"></div>

      <div style="padding:26px 28px;color:${C.ink};font-size:15px;line-height:1.6;">
        ${intro}
        ${body}
      </div>

      <div style="padding:18px 28px;border-top:1px solid ${C.rule};background-color:#faf8f4;">
        <p style="margin:0;color:${C.inkMuted};font-size:12px;line-height:1.5;">
          ${footerNote || `${T.business.addressLines.join(' · ')}`}
        </p>
        <p style="margin:6px 0 0;color:${C.inkMuted};font-size:12px;">${T.business.email}</p>
      </div>

    </div>
  </div>`;
}

/** Bordered detail panel — appointment summary, etc. */
export function detailPanel(rows) {
  const items = rows
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:5px 0;color:${C.inkSoft};font-size:14px;">${k}</td>
        <td style="padding:5px 0;text-align:right;color:${C.ink};font-size:14px;font-weight:600;">${v}</td>
      </tr>`
    )
    .join('');
  return `
  <table role="presentation" style="width:100%;margin:18px 0;border-collapse:collapse;background-color:#faf8f4;border:1px solid ${C.rule};border-left:3px solid ${C.accent};border-radius:8px;">
    <tbody><tr><td style="padding:14px 16px;">
      <table role="presentation" style="width:100%;border-collapse:collapse;">${items}</table>
    </td></tr></tbody>
  </table>`;
}

/** Champagne callout, used for the loyalty reward. */
export function rewardBanner({ heading, subline, value }) {
  return `
  <table role="presentation" style="width:100%;margin:20px 0;border-collapse:collapse;background-color:${C.accentSoft};border:1px solid ${C.accent};border-radius:8px;">
    <tbody><tr>
      <td style="padding:16px 18px;">
        <p style="margin:0;color:${C.ink};font-size:15px;font-weight:600;">${heading}</p>
        <p style="margin:4px 0 0;color:${C.inkSoft};font-size:12px;">${subline}</p>
      </td>
      <td style="padding:16px 18px;text-align:right;white-space:nowrap;">
        <span style="color:${C.accent};font-size:16px;font-weight:700;">${value}</span>
      </td>
    </tr></tbody>
  </table>`;
}

/** Large centred code, for the OTP mail. */
export function codeBlock(code) {
  return `
  <div style="margin:22px 0;padding:18px;text-align:center;background-color:${C.accentSoft};border:1px solid ${C.accent};border-radius:10px;">
    <span style="font-size:30px;letter-spacing:7px;font-weight:700;color:${C.ink};">${code}</span>
  </div>`;
}

export const emailColor = C;
