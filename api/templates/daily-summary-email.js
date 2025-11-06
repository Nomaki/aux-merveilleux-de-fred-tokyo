/**
 * Generates the daily summary email template for admin
 * Lists all orders scheduled for delivery today
 */
export function generateDailySummaryEmail(orders, date) {
  const orderCount = orders.length;
  const formattedDate = new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // Calculate total revenue for the day
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  // Group orders by delivery time for better organization
  const ordersByTime = orders.sort((a, b) => {
    const timeA = new Date(a.delivery_date_time).getTime();
    const timeB = new Date(b.delivery_date_time).getTime();
    return timeA - timeB;
  });

  const orderRows = ordersByTime
    .map((order) => {
      const deliveryTime = new Date(order.delivery_date_time).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Format cart items
      const itemsList = order.cart_items
        .map((item) => {
          const itemDetails = [
            `<strong>${getCakeDisplayName(item.cakeType)}</strong>`,
            item.cakeSize ? `サイズ: ${item.cakeSize}人分` : '',
            item.serviceType ? `${item.serviceType === 'takein' ? '店内' : '持ち帰り'}` : '',
            item.cakeText ? `メッセージ: "${item.cakeText}"` : '',
            `数量: ${item.quantity}個`,
          ]
            .filter(Boolean)
            .join(' / ');

          return `<li>${itemDetails}</li>`;
        })
        .join('');

      return `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 12px; font-weight: bold; color: #2196F3;">${deliveryTime}</td>
          <td style="padding: 12px;">
            <strong>${order.customer_name_kanji}</strong><br/>
            <small style="color: #666;">${order.customer_name_katakana}</small>
          </td>
          <td style="padding: 12px;">
            <ul style="margin: 0; padding-left: 20px;">
              ${itemsList}
            </ul>
          </td>
          <td style="padding: 12px;">${order.phone_number}</td>
          <td style="padding: 12px; text-align: center;">
            <span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${order.reservation_code}
            </span>
          </td>
          <td style="padding: 12px; text-align: right; font-weight: bold;">
            ¥${(order.total_amount || 0).toLocaleString()}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>本日のご予約一覧</title>
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2196F3;">
          <h1 style="color: #2196F3; margin: 0; font-size: 28px;">📅 本日のご予約一覧</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 18px;">${formattedDate}</p>
        </div>

        <!-- Summary Stats -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; margin-bottom: 30px; color: white;">
          <div style="display: flex; justify-content: space-around; text-align: center;">
            <div>
              <div style="font-size: 32px; font-weight: bold;">${orderCount}</div>
              <div style="font-size: 14px; opacity: 0.9;">件のご予約</div>
            </div>
            <div style="border-left: 2px solid rgba(255,255,255,0.3); height: 50px;"></div>
            <div>
              <div style="font-size: 32px; font-weight: bold;">¥${totalRevenue.toLocaleString()}</div>
              <div style="font-size: 14px; opacity: 0.9;">本日の売上合計</div>
            </div>
          </div>
        </div>

        ${
          orderCount === 0
            ? `
          <div style="text-align: center; padding: 40px; background: #f9f9f9; border-radius: 8px;">
            <p style="font-size: 18px; color: #666; margin: 0;">本日のご予約はありません。</p>
          </div>
        `
            : `
          <!-- Orders Table -->
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: white;">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #666; border-bottom: 2px solid #ddd;">お渡し時間</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #666; border-bottom: 2px solid #ddd;">お客様名</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #666; border-bottom: 2px solid #ddd;">ご注文内容</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #666; border-bottom: 2px solid #ddd;">電話番号</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #666; border-bottom: 2px solid #ddd;">予約番号</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #666; border-bottom: 2px solid #ddd;">金額</th>
                </tr>
              </thead>
              <tbody>
                ${orderRows}
              </tbody>
            </table>
          </div>
        `
        }

        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">このメールは自動送信されています。</p>
          <p style="margin: 5px 0 0 0;">Birthday Cake Reservation System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to get display name for cake types
function getCakeDisplayName(cakeType) {
  switch (cakeType) {
    case 'merveilleux':
      return 'Le Merveilleux';
    case 'incroyable':
      return "L'incroyable";
    case 'plate':
      return 'Birthday Plate';
    default:
      return cakeType;
  }
}
