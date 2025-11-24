import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate A4 PDF with order tickets
 * Designed to fit 12 tickets per A4 page (4x3 grid) for easy cutting
 * Each ticket is approximately 52mm x 99mm
 * Supports Japanese characters (Kanji, Hiragana, and Katakana)
 *
 * @param {Object} data - Order data
 * @param {string} data.reservationCode - Reservation code
 * @param {Object} data.order - Order details
 * @returns {Promise<Buffer>} PDF buffer
 */
export function generateOrderTicketPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const { reservationCode, order } = data;

      // Create A4 PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
      });

      // Register Japanese font
      const fontPath = join(__dirname, '../fonts/NotoSansJP-Regular.ttf');
      doc.registerFont('NotoSans', fontPath);

      // Buffer to store PDF data
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // A4 dimensions: 595.28 x 841.89 points
      // 12 tickets in 4x3 grid
      const ticketWidth = 595.28 / 4; // 148.82pt (~52mm)
      const ticketHeight = 841.89 / 3; // 280.63pt (~99mm)

      // Draw 12 tickets in 4x3 grid (4 columns, 3 rows)
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          const x = col * ticketWidth;
          const y = row * ticketHeight;
          drawTicket(doc, x, y, ticketWidth, ticketHeight, {
            reservationCode,
            order,
          });
        }
      }

      // Draw cut lines (dashed)
      doc.save().strokeColor('#cccccc').dash(5, { space: 5 });

      // Vertical cut lines (4 columns)
      for (let i = 1; i < 4; i++) {
        doc
          .moveTo(ticketWidth * i, 0)
          .lineTo(ticketWidth * i, 841.89)
          .stroke();
      }

      // Horizontal cut lines (3 rows)
      for (let i = 1; i < 3; i++) {
        doc
          .moveTo(0, ticketHeight * i)
          .lineTo(595.28, ticketHeight * i)
          .stroke();
      }

      doc.restore();
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw a checkbox
 */
function drawCheckbox(doc, x, y, size = 6) {
  doc.save().strokeColor('#2c2c2c').lineWidth(0.5).rect(x, y, size, size).stroke().restore();
}

/**
 * Helper to draw bold text (simulate with slightly offset text)
 */
function drawBoldText(doc, text, x, y, options = {}) {
  doc.text(text, x, y, options);
  doc.text(text, x + 0.3, y, options); // Slight offset for bold effect
}

/**
 * Draw a single order ticket
 */
function drawTicket(doc, x, y, width, height, data) {
  const { reservationCode, order } = data;
  const margin = 7;
  const contentWidth = width - margin * 2;
  let currentY = y + margin;

  // Set default font
  doc.font('NotoSans');

  // Format date
  const deliveryDate = new Date(order.deliveryDateTime);
  const formattedDate = deliveryDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Cake names
  const getCakeName = (type) => {
    const names = {
      merveilleux: 'Merveilleux',
      incroyable: 'Incroyable',
      plate: 'Plate',
    };
    return names[type] || type;
  };

  // Payment status
  const getPaymentStatus = (status) => {
    const map = {
      completed: '✓ PAID',
      pending: '⚠ PENDING',
      failed: '✗ FAILED',
    };
    return map[status] || status;
  };

  const paymentStatus = order.paymentStatus || 'completed';

  // ===== HEADER =====
  doc.fontSize(8).fillColor('#2c2c2c');
  drawBoldText(doc, 'ORDER', x + margin, currentY, { width: contentWidth, align: 'center' });
  currentY += 12;

  // ===== RESERVATION CODE BOX =====
  const boxHeight = 26;
  const boxY = currentY;

  // Draw box background
  doc.rect(x + margin, boxY, contentWidth, boxHeight).fillAndStroke('#F0D891', '#2c2c2c');

  // Draw reservation code (bold)
  doc.fillColor('#2c2c2c').fontSize(10);
  const codeY = boxY + 5;
  drawBoldText(doc, reservationCode, x + margin, codeY, { width: contentWidth, align: 'center' });

  currentY += boxHeight + 2;

  // ===== PICKUP =====
  doc.fillColor('#2c2c2c').fontSize(5.5);
  drawBoldText(doc, 'PICKUP:', x + margin, currentY);
  currentY += 7;

  doc.fontSize(5).fillColor('#2c2c2c');
  doc.fontSize(6.5).text(formattedDate, x + margin, currentY, { width: contentWidth });
  currentY += 11;

  // ===== CUSTOMER =====
  doc.fontSize(5.5);
  drawBoldText(doc, 'CUSTOMER:', x + margin, currentY);
  currentY += 8;

  doc.fontSize(6.5).fillColor('#2c2c2c');
  doc.fontSize(6.5).text(`${order.familyNameKanji} ${order.nameKanji}`, x + margin, currentY, { width: contentWidth });
  currentY += 7.5;

  doc.fontSize(6);
  doc.text(`${order.familyNameKatakana} ${order.nameKatakana}`, x + margin, currentY, { width: contentWidth });
  currentY += 9;

  // ===== PHONE =====
  doc.fontSize(5.5);
  drawBoldText(doc, 'PHONE:', x + margin, currentY);
  doc.fontSize(6.5).text(` ${order.phoneNumber}`);
  currentY += 20;

  // ===== PAYMENT STATUS =====
  const statusColor = paymentStatus === 'completed' ? '#28a745' : paymentStatus === 'pending' ? '#ffc107' : '#dc3545';
  doc.fontSize(5.5).fillColor(statusColor);
  drawBoldText(doc, getPaymentStatus(paymentStatus), x + margin, currentY);
  currentY += 13;

  // ===== ITEMS =====
  doc.fontSize(5.5).fillColor('#2c2c2c');
  drawBoldText(doc, 'ITEMS:', x + margin, currentY);
  currentY += 11;

  // Separator line
  doc
    .moveTo(x + margin, currentY)
    .lineTo(x + margin + contentWidth, currentY)
    .stroke();
  currentY += 7;

  // ===== ORDER ITEMS =====
  const checkboxSize = 6;
  const checkboxMargin = 3.5;

  order.cartItems.forEach((item) => {
    const itemY = currentY;

    // Draw checkbox aligned with text
    drawCheckbox(doc, x + margin, itemY + 2, checkboxSize);

    // Item name (bold effect)
    doc.fontSize(5.5).fillColor('#2c2c2c');
    const itemText = `${item.quantity} x ${getCakeName(item.cakeType)}`;
    drawBoldText(doc, itemText, x + margin + checkboxSize + checkboxMargin, currentY, {
      width: contentWidth - checkboxSize - checkboxMargin,
    });
    currentY += 7;

    // Details
    const details = [];
    if (item.cakeSize) details.push(`${item.cakeSize}p`);
    if (item.serviceType === 'takein') details.push('Dine-in');
    else if (item.serviceType === 'takeout') details.push('Takeout');

    if (details.length > 0) {
      doc.fontSize(5.5).fillColor('#666666');
      doc.text(`  ${details.join(' • ')}`, x + margin + checkboxSize + checkboxMargin, currentY, {
        width: contentWidth - checkboxSize - checkboxMargin,
      });
      currentY += 7;
    }

    // Message
    if (item.cakeText) {
      doc.fontSize(5.5).fillColor('#666666');
      doc.text(`  Message: "${item.cakeText}"`, x + margin + checkboxSize + checkboxMargin, currentY, {
        width: contentWidth - checkboxSize - checkboxMargin,
      });
      currentY += 7;
    }

    currentY += 4.5;
  });

  // ===== FOOTER =====$
  currentY += 4.5;
  doc.fontSize(6).fillColor('#999999');
  doc.text(new Date().toLocaleDateString('en-US'), x + margin, currentY, {
    width: contentWidth,
    align: 'center',
  });
}
