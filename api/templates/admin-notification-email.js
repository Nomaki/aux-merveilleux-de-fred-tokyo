/**
 * Generate HTML email template for admin notification
 * @param {Object} data - Order data
 * @param {string} data.reservationCode - Reservation code
 * @param {Object} data.order - Order details
 * @returns {string} HTML email content
 */
export function generateAdminNotificationEmail(data) {
  const { reservationCode, order } = data;

  // Calculate total
  const total = order.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Format date
  const deliveryDate = new Date(order.deliveryDateTime);
  const formattedDateJA = deliveryDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedDateEN = deliveryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order - 新しいご予約</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🔔 新しいご予約 / New Order
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">

              <!-- Alert Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; font-size: 14px; color: #856404; font-weight: 600;">
                      ⚠️ 新しいご予約が入りました / A new order has been placed
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Reservation Code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #f8f9fa; border-radius: 8px; border: 2px solid #667eea;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">
                      予約番号 / Reservation Code
                    </p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #2c2c2c; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                      ${reservationCode}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Customer Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding-bottom: 15px; border-bottom: 2px solid #667eea;">
                    <h2 style="margin: 0; font-size: 18px; color: #2c2c2c;">
                      お客様情報 / Customer Information
                    </h2>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #fafafa; border-radius: 6px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; font-size: 14px;">
                      <strong style="color: #2c2c2c;">お名前 / Name:</strong><br>
                      ${order.familyNameKanji} ${order.nameKanji}
                    </p>
                    <p style="margin: 0 0 10px; font-size: 14px;">
                      <strong style="color: #2c2c2c;">フリガナ / Furigana:</strong><br>
                      ${order.familyNameKatakana} ${order.nameKatakana}
                    </p>
                    <p style="margin: 0 0 10px; font-size: 14px;">
                      <strong style="color: #2c2c2c;">電話番号 / Phone:</strong><br>
                      <a href="tel:${order.phoneNumber}" style="color: #667eea; text-decoration: none;">${order.phoneNumber}</a>
                    </p>
                    <p style="margin: 0; font-size: 14px;">
                      <strong style="color: #2c2c2c;">メールアドレス / Email:</strong><br>
                      <a href="mailto:${order.email}" style="color: #667eea; text-decoration: none;">${order.email}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Pickup Date -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #e3f2fd; border-radius: 6px; border-left: 4px solid #2196f3;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 5px; font-size: 14px; font-weight: 600; color: #1976d2;">
                      受取日時 / Pickup Date & Time:
                    </p>
                    <p style="margin: 0; font-size: 16px; color: #2c2c2c;">
                      📅 ${formattedDateJA}<br>
                      📅 ${formattedDateEN}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Order Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 15px; border-bottom: 2px solid #667eea;">
                    <h2 style="margin: 0; font-size: 18px; color: #2c2c2c;">
                      ご注文内容 / Order Details
                    </h2>
                  </td>
                </tr>
              </table>

              <!-- Cart Items -->
              ${order.cartItems.map(item => `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px; background-color: #fafafa; border-radius: 6px; border-left: 4px solid #667eea;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #2c2c2c;">
                      ${getCakeName(item.cakeType)}
                    </p>
                    ${item.cakeSize ? `<p style="margin: 0 0 4px; font-size: 13px; color: #666;">サイズ / Size: ${item.cakeSize} 人分 / persons</p>` : ''}
                    ${item.serviceType ? `<p style="margin: 0 0 4px; font-size: 13px; color: #666;">サービス / Service: ${item.serviceType}</p>` : ''}
                    ${item.cakeText ? `<p style="margin: 0 0 8px; font-size: 13px; color: #666;">メッセージ / Message: "${item.cakeText}"</p>` : ''}
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #667eea;">
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
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: #2c2c2c;">
                      合計 / Total: <span style="color: #667eea;">¥${total.toLocaleString()}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Payment Status -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background-color: #d4edda; border-radius: 6px; border-left: 4px solid #28a745;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; font-size: 14px; color: #155724; font-weight: 600;">
                      ✅ 決済完了 / Payment Completed
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #2c2c2c; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #667eea; font-weight: 600;">
                Aux Merveilleux de Fred Tokyo - Admin Notification
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                管理者通知メール / Admin notification email
              </p>
            </td>
          </tr>
        </table>

        <!-- Bottom spacing -->
        <table width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #999;">
                このメールは自動送信されています / This is an automated email
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
