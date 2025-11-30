/**
 * Generate HTML email template for order confirmation
 * @param {Object} data - Confirmation data
 * @param {string} data.reservationCode - Reservation code
 * @param {Object} data.order - Order details
 * @param {string} data.order.nameKanji - Customer name in Kanji
 * @param {string} data.order.familyNameKanji - Customer family name in Kanji
 * @param {string} data.order.email - Customer email
 * @param {Date} data.order.deliveryDateTime - Delivery date and time
 * @param {Array} data.order.cartItems - Cart items
 * @param {string} data.language - Language (ja or en)
 * @returns {string} HTML email content
 */
export function generateConfirmationEmail(data) {
  const { reservationCode, order, language = 'ja' } = data;
  const isJapanese = language === 'ja';

  // Calculate total
  const total = order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Format date with JST timezone
  const deliveryDate = new Date(order.deliveryDateTime);
  const formattedDate = deliveryDate.toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  });

  // Cake type names
  const getCakeName = (type) => {
    const names = {
      merveilleux: 'Le Merveilleux',
      incroyable: "L'incroyable",
      plate: 'Birthday Plate',
    };
    return names[type] || type;
  };

  const title = isJapanese
    ? 'ご予約ありがとうございます'
    : 'Thank You for Your Reservation';

  const greeting = isJapanese
    ? `${order.familyNameKanji} ${order.nameKanji} 様`
    : `Dear ${order.familyNameKanji} ${order.nameKanji}`;

  const intro = isJapanese
    ? 'バースデーケーキのご予約を承りました。以下、ご予約内容の詳細です。'
    : 'Your birthday cake reservation has been confirmed. Please find the details below.';

  return `
<!DOCTYPE html>
<html lang="${isJapanese ? 'ja' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #F0D891 0%, #f4e5b8 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #2c2c2c; font-size: 28px; font-weight: 600;">
                🎂 ${title}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333; line-height: 1.6;">
                ${greeting}
              </p>
              <p style="margin: 0 0 30px; font-size: 14px; color: #666; line-height: 1.6;">
                ${intro}
              </p>

              <!-- Reservation Code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #f8f9fa; border-radius: 8px; border: 2px solid #F0D891;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">
                      ${isJapanese ? '予約番号' : 'Reservation Code'}
                    </p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #2c2c2c; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                      ${reservationCode}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Order Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding-bottom: 15px; border-bottom: 2px solid #F0D891;">
                    <h2 style="margin: 0; font-size: 18px; color: #2c2c2c;">
                      ${isJapanese ? 'ご注文内容' : 'Order Details'}
                    </h2>
                  </td>
                </tr>
              </table>

              <!-- Cart Items -->
              ${order.cartItems.map(item => `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px; background-color: #fafafa; border-radius: 6px; border-left: 4px solid #F0D891;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #2c2c2c;">
                      ${getCakeName(item.cakeType)}
                    </p>
                    ${item.cakeSize ? `<p style="margin: 0 0 4px; font-size: 13px; color: #666;">${isJapanese ? 'サイズ' : 'Size'}: ${item.cakeSize} ${isJapanese ? '人分' : 'persons'}</p>` : ''}
                    ${item.serviceType ? `<p style="margin: 0 0 4px; font-size: 13px; color: #666;">${isJapanese ? 'サービス' : 'Service'}: ${item.serviceType}</p>` : ''}
                    ${item.cakeText ? `<p style="margin: 0 0 8px; font-size: 13px; color: #666;">${isJapanese ? 'メッセージ' : 'Message'}: "${item.cakeText}"</p>` : ''}
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #F0D891;">
                      ¥${item.price.toLocaleString()} × ${item.quantity} = ¥${(item.price * item.quantity).toLocaleString()}
                    </p>
                  </td>
                </tr>
              </table>
              `).join('')}

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; border-top: 2px solid #e0e0e0; padding-top: 15px;">
                <tr>
                  <td style="text-align: right; padding: 10px 0;">
                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #2c2c2c;">
                      ${isJapanese ? '合計' : 'Total'}: <span style="color: #F0D891;">¥${total.toLocaleString()}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Delivery Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #f8f9fa; border-radius: 6px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                      <strong style="color: #2c2c2c;">${isJapanese ? '受取日時' : 'Pickup Date & Time'}:</strong><br>
                      ${formattedDate}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #666;">
                      <strong style="color: #2c2c2c;">${isJapanese ? 'お名前' : 'Name'}:</strong><br>
                      ${order.familyNameKanji} ${order.nameKanji}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Important Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background-color: #fff9e6; border-radius: 6px; border: 1px solid #ffd700;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; font-size: 13px; color: #856404; line-height: 1.6;">
                      ⚠️ ${isJapanese
                        ? 'ご予約番号は大切に保管してください。店頭でのお受け取りの際に必要となります。'
                        : 'Please keep this reservation code safe. You will need it when picking up your order at the store.'}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Contact Info -->
              <p style="margin: 20px 0 0; font-size: 13px; color: #999; line-height: 1.6; text-align: center;">
                ${isJapanese
                  ? 'ご不明な点がございましたら、予約番号をお控えの上お問い合わせください。'
                  : 'If you have any questions, please contact us with your reservation code.'}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #2c2c2c; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #F0D891; font-weight: 600;">
                Aux Merveilleux de Fred Tokyo
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                ${isJapanese
                  ? 'いつもご利用いただきありがとうございます'
                  : 'Thank you for choosing us'}
              </p>
            </td>
          </tr>
        </table>

        <!-- Bottom spacing -->
        <table width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #999;">
                ${isJapanese
                  ? 'このメールは自動送信されています。返信はできません。'
                  : 'This is an automated email. Please do not reply.'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
