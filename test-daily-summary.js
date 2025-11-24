/**
 * Test script for daily summary email with 3 mock orders
 * Run with: node test-daily-summary.js
 */

import { config } from 'dotenv';
import { Resend } from 'resend';
import { generateDailySummaryEmail } from './api/templates/daily-summary-email.js';
import { generateDailyTicketsPDF } from './api/utils/generate-daily-tickets-pdf.js';

// Load environment variables
config();

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'romain.delhoute+amf@gmail.com';

async function testDailySummary() {
  try {
    console.log('🧪 Testing daily summary email with 3 mock orders...\n');

    // Get today's date in JST timezone
    const jstDate = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })
    );

    // Create 3 mock orders for today
    const orders = [
      {
        id: 'mock-order-1',
        reservation_code: 'AB123',
        customer_name_kanji: '山田 太郎',
        customer_name_katakana: 'ヤマダ タロウ',
        phone_number: '090-1234-5678',
        delivery_date_time: new Date(jstDate.setHours(10, 0, 0, 0)).toISOString(),
        payment_status: 'completed',
        total_amount: 4500,
        cart_items: [
          {
            cakeType: 'merveilleux',
            cakeSize: 4,
            quantity: 1,
            serviceType: 'takeout',
            cakeText: 'お誕生日おめでとう！',
          },
        ],
      },
      {
        id: 'mock-order-2',
        reservation_code: 'CD456',
        customer_name_kanji: '佐藤 花子',
        customer_name_katakana: 'サトウ ハナコ',
        phone_number: '080-9876-5432',
        delivery_date_time: new Date(jstDate.setHours(14, 30, 0, 0)).toISOString(),
        payment_status: 'completed',
        total_amount: 6800,
        cart_items: [
          {
            cakeType: 'incroyable',
            cakeSize: 6,
            quantity: 1,
            serviceType: 'takein',
            cakeText: 'Happy Birthday!',
          },
          {
            cakeType: 'plate',
            quantity: 2,
            serviceType: 'takein',
          },
        ],
      },
      {
        id: 'mock-order-3',
        reservation_code: 'EF789',
        customer_name_kanji: '鈴木 一郎',
        customer_name_katakana: 'スズキ イチロウ',
        phone_number: '070-5555-1234',
        delivery_date_time: new Date(jstDate.setHours(16, 45, 0, 0)).toISOString(),
        payment_status: 'completed',
        total_amount: 5200,
        cart_items: [
          {
            cakeType: 'merveilleux',
            cakeSize: 8,
            quantity: 1,
            serviceType: 'takeout',
            cakeText: 'おめでとう！',
          },
        ],
      },
    ];

    console.log(`✅ Created ${orders.length} mock orders for today\n`);

    orders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        code: order.reservation_code,
        customer: order.customer_name_kanji,
        time: new Date(order.delivery_date_time).toLocaleTimeString('ja-JP'),
        amount: `¥${order.total_amount.toLocaleString()}`,
      });
    })

    // Generate email HTML
    const emailHtml = generateDailySummaryEmail(orders || [], jstDate);

    // Generate one PDF with all order tickets
    console.log('\n📄 Generating daily tickets PDF...');
    const attachments = [];
    try {
      const pdfBuffer = await generateDailyTicketsPDF(orders);
      const dateStr = jstDate.toISOString().split('T')[0];
      attachments.push({
        filename: `daily-tickets-${dateStr}.pdf`,
        content: pdfBuffer,
      });
      console.log(`✅ Generated daily tickets PDF with ${orders.length} orders`);
    } catch (pdfError) {
      console.error(`❌ Failed to generate daily tickets PDF:`, pdfError);
    }

    // Email subject with date
    const dateStr = jstDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const subject = `📅 本日のご予約一覧 (${dateStr}) - ${orders?.length || 0}件 [TEST]`;

    console.log('\n📧 Sending email...');
    console.log('Subject:', subject);
    console.log('To:', ADMIN_EMAIL);
    console.log(`Attachments: ${attachments.length} PDF (with ${orders.length} order tickets)`);

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [ADMIN_EMAIL],
      subject: subject,
      html: emailHtml,
      attachments: attachments,
    });

    if (emailError) {
      console.error('\n❌ Failed to send email:', emailError);
      return;
    }

    console.log('\n✅ Email sent successfully!');
    console.log('Email ID:', emailData.id);
    console.log('\n✨ Test completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Run the test
testDailySummary();
