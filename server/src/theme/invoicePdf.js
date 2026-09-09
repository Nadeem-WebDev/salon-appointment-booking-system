import { invoiceTheme as T, contentWidth } from './invoiceTheme.js';

const M = T.page.margin;
const RIGHT = M + contentWidth;
const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

/** Horizontal rule. */
function rule(doc, y, { strong = false } = {}) {
  doc.moveTo(M, y).lineTo(RIGHT, y)
    .lineWidth(strong ? 1 : 0.5)
    .strokeColor(strong ? T.color.ruleStrong : T.color.rule)
    .stroke();
}

/** Small uppercase label. */
function label(doc, text, x, y, width) {
  doc.font(T.font.bold).fontSize(T.size.micro).fillColor(T.color.inkMuted)
    .text(String(text).toUpperCase(), x, y, { width, characterSpacing: 0.8 });
}

/**
 * Draw the whole invoice onto an existing PDFDocument.
 * Content flows top-down and wraps, so long names and many services stay on the page.
 */
export function renderInvoice(doc, data) {
  const lineItems = Array.isArray(data.lineItems) && data.lineItems.length
    ? data.lineItems
    : [{ description: data.serviceName, stylist: data.staffName, amount: data.totalAmount }];

  /* ---------------- Header ---------------- */
  doc.font(T.font.bold).fontSize(T.size.hero).fillColor(T.color.ink)
    .text(T.business.name, M, M, { width: contentWidth * 0.6 });

  doc.font(T.font.body).fontSize(T.size.small).fillColor(T.color.inkMuted)
    .text(T.business.addressLines.join('\n'), M, doc.y + 4, { width: contentWidth * 0.6, lineGap: 2 });

  // Invoice meta, right aligned
  const metaX = M + contentWidth * 0.6;
  const metaW = contentWidth * 0.4;
  doc.font(T.font.bold).fontSize(T.size.title).fillColor(T.color.accent)
    .text('INVOICE', metaX, M + 4, { width: metaW, align: 'right' });
  doc.font(T.font.body).fontSize(T.size.small).fillColor(T.color.inkSoft)
    .text(`No. INV-${data.bookingId}`, metaX, doc.y + 3, { width: metaW, align: 'right' })
    .text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      metaX, doc.y + 2, { width: metaW, align: 'right' });

  // Champagne rule under the header — the brand's signature detail
  const headerBottom = Math.max(doc.y, M + 70) + 14;
  doc.moveTo(M, headerBottom).lineTo(RIGHT, headerBottom)
    .lineWidth(2).strokeColor(T.color.accent).stroke();

  /* ---------------- Bill to / appointment ---------------- */
  let y = headerBottom + 22;
  const colW = contentWidth / 2 - 12;

  label(doc, 'Billed to', M, y, colW);
  label(doc, 'Appointment', M + contentWidth / 2, y, colW);
  y += 14;

  doc.font(T.font.bold).fontSize(T.size.body).fillColor(T.color.ink)
    .text(data.customerName || '—', M, y, { width: colW });
  const leftAfterName = doc.y;

  doc.font(T.font.body).fontSize(T.size.small).fillColor(T.color.inkSoft);
  if (data.email) doc.text(data.email, M, doc.y + 2, { width: colW });
  if (data.clientPhone) doc.text(data.clientPhone, M, doc.y + 2, { width: colW });
  const leftBottom = doc.y;

  doc.font(T.font.bold).fontSize(T.size.body).fillColor(T.color.ink)
    .text(data.appointmentDate || '—', M + contentWidth / 2, y, { width: colW });
  doc.font(T.font.body).fontSize(T.size.small).fillColor(T.color.inkSoft)
    .text(`Stylist: ${data.staffName || '—'}`, M + contentWidth / 2, doc.y + 2, { width: colW });
  const rightBottom = doc.y;

  y = Math.max(leftBottom, rightBottom, leftAfterName) + 26;

  /* ---------------- Service table ---------------- */
  const COL_DESC = M;
  const COL_STYLIST = M + contentWidth * 0.48;
  const COL_AMOUNT = M + contentWidth * 0.76;
  const AMOUNT_W = contentWidth * 0.24;
  const STYLIST_W = contentWidth * 0.26;
  const DESC_W = contentWidth * 0.46;

  label(doc, 'Description', COL_DESC, y, DESC_W);
  label(doc, 'Stylist', COL_STYLIST, y, STYLIST_W);
  doc.font(T.font.bold).fontSize(T.size.micro).fillColor(T.color.inkMuted)
    .text('AMOUNT', COL_AMOUNT, y, { width: AMOUNT_W, align: 'right', characterSpacing: 0.8 });

  y += 14;
  rule(doc, y, { strong: true });
  y += 10;

  for (const item of lineItems) {
    // Break to a new page before a row would run off the bottom
    if (y > T.page.height - 200) {
      doc.addPage();
      y = M;
    }

    const startY = y;
    doc.font(T.font.body).fontSize(T.size.body).fillColor(T.color.ink)
      .text(item.description || '—', COL_DESC, y, { width: DESC_W });
    const descBottom = doc.y;

    doc.fillColor(T.color.inkSoft)
      .text(item.stylist || '—', COL_STYLIST, startY, { width: STYLIST_W });
    const stylistBottom = doc.y;

    doc.fillColor(T.color.ink)
      .text(money(item.amount), COL_AMOUNT, startY, { width: AMOUNT_W, align: 'right' });

    y = Math.max(descBottom, stylistBottom, doc.y) + 10;
    rule(doc, y - 4);
  }

  /* ---------------- Totals ---------------- */
  y += 12;
  const totalsX = M + contentWidth * 0.5;
  const totalsLabelW = contentWidth * 0.26;
  const totalsValueW = contentWidth * 0.24;

  const totalsRow = (text, value, { bold = false, tone } = {}) => {
    doc.font(bold ? T.font.bold : T.font.body).fontSize(T.size.small)
      .fillColor(tone || T.color.inkSoft)
      .text(text, totalsX, y, { width: totalsLabelW });
    doc.font(bold ? T.font.bold : T.font.body)
      .fillColor(tone || T.color.ink)
      .text(value, totalsX + totalsLabelW, y, { width: totalsValueW, align: 'right' });
    y += 16;
  };

  totalsRow('Subtotal', money(data.totalAmount));
  if (Number(data.discountAmount) > 0) {
    totalsRow('Supercoin discount', `- ${money(data.discountAmount)}`, { tone: T.color.accent });
  }
  if (Number(data.paidAmount) > 0) totalsRow('Paid online', money(data.paidAmount));
  totalsRow('Paid at counter', money(data.dueAmount));

  // Balance band
  y += 6;
  const bandH = 30;
  doc.rect(totalsX, y, contentWidth * 0.5, bandH).fill(T.color.accentSoft);
  doc.rect(totalsX, y, 2.5, bandH).fill(T.color.accent);
  doc.font(T.font.bold).fontSize(T.size.body).fillColor(T.color.ink)
    .text('BALANCE DUE', totalsX + 12, y + 10, { width: totalsLabelW });
  doc.text(money(0), totalsX + totalsLabelW, y + 10, { width: totalsValueW - 12, align: 'right' });
  y += bandH + 22;

  /* ---------------- Rewards ---------------- */
  if (Number(data.earnedCoins) > 0) {
    if (y > T.page.height - 150) { doc.addPage(); y = M; }
    const rewardH = 40;
    doc.rect(M, y, contentWidth, rewardH).fill(T.color.accentSoft);
    doc.rect(M, y, 2.5, rewardH).fill(T.color.accent);

    doc.font(T.font.bold).fontSize(T.size.small).fillColor(T.color.ink)
      .text(`You earned ${data.earnedCoins} Supercoins`, M + 12, y + 10, { width: contentWidth * 0.55 });
    doc.font(T.font.body).fontSize(T.size.micro).fillColor(T.color.inkSoft)
      .text('Reach 1,000 coins for a flat discount on a future visit.',
        M + 12, y + 23, { width: contentWidth * 0.55 });

    doc.font(T.font.bold).fontSize(T.size.body).fillColor(T.color.accent)
      .text(`${data.totalCoinsBalance} coins`, M + contentWidth * 0.62, y + 15,
        { width: contentWidth * 0.36 - 12, align: 'right' });
    y += rewardH + 20;
  }

  /* ---------------- Footer ---------------- */
  const footerY = Math.max(y, T.page.height - M - 46);
  rule(doc, footerY);
  doc.font(T.font.body).fontSize(T.size.micro).fillColor(T.color.inkMuted)
    .text(`Thank you for visiting ${T.business.name}.`, M, footerY + 10, { width: contentWidth * 0.6 })
    .text(T.business.email, M, doc.y + 2, { width: contentWidth * 0.6 });
  doc.font(T.font.oblique).fontSize(T.size.micro).fillColor(T.color.inkMuted)
    .text('This is a computer-generated receipt.',
      M + contentWidth * 0.6, footerY + 10, { width: contentWidth * 0.4, align: 'right' });
}
