import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate A4 PDF with all daily order tickets
 * Designed to fit 12 tickets per A4 page (4x3 grid) for easy cutting
 * Each ticket is approximately 52mm x 99mm
 * Each order gets ONE ticket in the grid
 * Supports Japanese characters (Kanji, Hiragana, and Katakana)
 *
 * @param {Array} orders - Array of order objects
 * @returns {Promise<Buffer>} PDF buffer
 */
export function generateDailyTicketsPDF(orders) {
  return new Promise((resolve, reject) => {
    try {
      if (!orders || orders.length === 0) {
        reject(new Error('No orders provided'));
        return;
      }

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

      // Draw each order as one ticket in the grid
      let ticketIndex = 0;
      let pageIndex = 0;

      orders.forEach((order) => {
        // If we've filled 12 tickets (4x3 grid), start a new page
        if (ticketIndex > 0 && ticketIndex % 12 === 0) {
          doc.addPage();
          pageIndex++;
          ticketIndex = 0;
        }

        // Calculate position in grid (row, col)
        const row = Math.floor(ticketIndex / 4);
        const col = ticketIndex % 4;
        const x = col * ticketWidth;
        const y = row * ticketHeight;

        // Draw ticket for this order
        drawTicket(doc, x, y, ticketWidth, ticketHeight, {
          reservationCode: order.reservation_code,
          order: {
            deliveryDateTime: order.delivery_date_time,
            familyNameKanji: order.customer_name_kanji.split(' ')[0] || '',
            nameKanji: order.customer_name_kanji.split(' ')[1] || order.customer_name_kanji,
            familyNameKatakana: order.customer_name_katakana.split(' ')[0] || '',
            nameKatakana: order.customer_name_katakana.split(' ')[1] || order.customer_name_katakana,
            phoneNumber: order.phone_number,
            paymentStatus: order.payment_status,
            cartItems: order.cart_items,
            candleCount: order.candle_count,
            visitorCount: order.visitor_count,
          },
        });

        ticketIndex++;
      });

      // Draw cut lines for all pages (dashed)
      const totalPages = Math.ceil(orders.length / 12);
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          doc.switchToPage(page);
        }

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
      }

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
  doc.save().strokeColor('#080808').lineWidth(0.5).rect(x, y, size, size).stroke().restore();
}

/**
 * Helper to draw bold text (simulate with multiple offset layers)
 */
function drawBoldText(doc, text, x, y, options = {}) {
  doc.text(text, x, y, options);
  doc.text(text, x + 0.4, y, options);
  doc.text(text, x + 0.2, y - 0.1, options);
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

  // Format date in Japan timezone
  const deliveryDate = new Date(order.deliveryDateTime);
  const formattedDate = deliveryDate.toLocaleDateString('en-US', {
    timeZone: 'Asia/Tokyo',
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
  doc.fontSize(8).fillColor('#080808');
  drawBoldText(doc, 'ORDER', x + margin, currentY, { width: contentWidth, align: 'center' });
  currentY += 12;

  // ===== RESERVATION CODE BOX =====
  const boxHeight = 26;
  const boxY = currentY;

  // Draw box background
  doc.rect(x + margin, boxY, contentWidth, boxHeight).fillAndStroke('#F0D891', '#080808');

  // Draw reservation code (bold)
  doc.fillColor('#080808').fontSize(12);
  const codeY = boxY + 3;
  drawBoldText(doc, reservationCode, x + margin, codeY, { width: contentWidth, align: 'center' });

  currentY += boxHeight + 2;

  // ===== PICKUP =====
  doc.fillColor('#080808').fontSize(8);
  drawBoldText(doc, 'PICKUP:', x + margin, currentY);
  currentY += 10;

  doc.fontSize(11).fillColor('#080808');
  drawBoldText(doc, formattedDate, x + margin, currentY, { width: contentWidth });
  currentY += 16;

  // ===== CUSTOMER =====
  doc.fontSize(8).fillColor('#080808');
  drawBoldText(doc, 'CUSTOMER:', x + margin, currentY);
  currentY += 10;

  doc.fontSize(11).fillColor('#080808');
  drawBoldText(doc, `${order.familyNameKanji} ${order.nameKanji}`, x + margin, currentY, { width: contentWidth });
  currentY += 15;

  doc.fontSize(11).fillColor('#080808');
  drawBoldText(doc, `${order.familyNameKatakana} ${order.nameKatakana}`, x + margin, currentY, { width: contentWidth });
  currentY += 16;

  // ===== PHONE =====
  doc.fontSize(10).fillColor('#080808');
  drawBoldText(doc, `PHONE:   ${order.phoneNumber}`, x + margin, currentY, { width: contentWidth });
  currentY += 16;

  // ===== CANDLES & VISITORS (on same line if both exist) =====
  if (order.candleCount || order.visitorCount) {
    doc.fontSize(10).fillColor('#080808');
    if (order.candleCount && order.visitorCount) {
      // Both on same line
      drawBoldText(doc, `CANDLES:  ${order.candleCount}    VISITORS:  ${order.visitorCount}`, x + margin, currentY);
    } else if (order.candleCount) {
      drawBoldText(doc, `CANDLES:  ${order.candleCount}`, x + margin, currentY);
    } else {
      drawBoldText(doc, `VISITORS:  ${order.visitorCount}`, x + margin, currentY);
    }
    currentY += 16;
  }

  // ===== PAYMENT STATUS =====
  // const statusColor = paymentStatus === 'completed' ? '#28a745' : paymentStatus === 'pending' ? '#ffc107' : '#dc3545';
  // doc.fontSize(10).fillColor(statusColor);
  // drawBoldText(doc, getPaymentStatus(paymentStatus), x + margin, currentY);
  // currentY += 14;

  // ===== ITEMS =====
  currentY += 2;
  doc.fontSize(10).fillColor('#080808');
  drawBoldText(doc, 'ITEMS:', x + margin, currentY);
  currentY += 14;

  // Separator line
  doc
    .moveTo(x + margin, currentY)
    .lineTo(x + margin + contentWidth, currentY)
    .stroke();
  currentY += 6;

  // ===== ORDER ITEMS =====
  const checkboxSize = 8;
  const checkboxMargin = 5;

  order.cartItems.forEach((item) => {
    const itemY = currentY;

    // Draw checkbox aligned with text
    drawCheckbox(doc, x + margin, itemY + 5, checkboxSize);

    // Item name (bold effect)
    doc.fontSize(11).fillColor('#080808');
    const itemText = `${item.quantity} x ${getCakeName(item.cakeType)}`;
    drawBoldText(doc, itemText, x + margin + checkboxSize + checkboxMargin, currentY, {
      width: contentWidth - checkboxSize - checkboxMargin,
    });
    currentY += 16;

    // Details
    const details = [];
    if (item.cakeSize) details.push(`${item.cakeSize}p`);
    if (item.serviceType === 'takein') details.push('Dine-in');
    else if (item.serviceType === 'takeout') details.push('Takeout');

    if (details.length > 0) {
      doc.fontSize(10).fillColor('#080808');
      drawBoldText(doc, `  ${details.join(' • ')}`, x + margin + checkboxSize, currentY, {
        width: contentWidth - checkboxSize,
      });
      currentY += 14;
    }

    // Message
    if (item.cakeText) {
      doc.fontSize(10).fillColor('#080808');
      drawBoldText(doc, `  Msg: "${item.cakeText}"`, x + margin + checkboxSize, currentY, {
        width: contentWidth - checkboxSize,
      });
      currentY += 14;
    }

    currentY += 3;
  });
}
