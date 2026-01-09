/**
 * Send tomorrow's reservations summary email to a specific address
 * Run with: node send-tomorrow-summary.js
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateDailySummaryEmail } from './api/templates/daily-summary-email.js';
import { generateDailyTicketsPDF } from './api/utils/generate-daily-tickets-pdf.js';

// Load environment variables
config();

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Send to this address instead of admin
const TEST_EMAIL = 'romain.delhoute@gmail.com';

async function sendTomorrowSummary() {
  try {
    console.log('📧 Sending tomorrow\'s reservations summary...\n');

    // Get today's date in JST timezone
    const jstDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));

    // Get tomorrow's date
    const tomorrowDate = new Date(jstDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    // Set time to start of tomorrow (00:00:00)
    const startOfDay = new Date(tomorrowDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Set time to end of tomorrow (23:59:59)
    const endOfDay = new Date(tomorrowDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('📅 Fetching orders for tomorrow:', {
      date: tomorrowDate.toISOString().split('T')[0],
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
    });

    // Query Supabase for orders with delivery_date_time on tomorrow
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('delivery_date_time', startOfDay.toISOString())
      .lte('delivery_date_time', endOfDay.toISOString())
      .eq('payment_status', 'completed')
      .order('delivery_date_time', { ascending: true });

    if (error) {
      console.error('❌ Supabase query error:', error);
      return;
    }

    console.log(`\n✅ Found ${orders?.length || 0} orders for tomorrow\n`);

    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`Order ${index + 1}:`, {
          code: order.reservation_code,
          customer: order.customer_name_kanji,
          time: new Date(order.delivery_date_time).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' }),
          amount: `¥${order.total_amount?.toLocaleString() || 0}`,
        });
      });
    }

    // Generate email HTML
    const emailHtml = generateDailySummaryEmail(orders || [], tomorrowDate);

    // Generate one PDF with all order tickets
    const attachments = [];
    if (orders && orders.length > 0) {
      console.log('\n📄 Generating daily tickets PDF...');
      try {
        const pdfBuffer = await generateDailyTicketsPDF(orders);
        const dateStr = tomorrowDate.toISOString().split('T')[0];
        attachments.push({
          filename: `daily-tickets-${dateStr}.pdf`,
          content: pdfBuffer,
        });
        console.log(`✅ Generated daily tickets PDF with ${orders.length} orders`);
      } catch (pdfError) {
        console.error(`❌ Failed to generate daily tickets PDF:`, pdfError);
      }
    }

    // Email subject with date
    const dateStr = tomorrowDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const subject = `📅 Tomorrow's Reservations (${dateStr}) - ${orders?.length || 0} orders`;

    console.log('\n📧 Sending email...');
    console.log('Subject:', subject);
    console.log('To:', TEST_EMAIL);

    // Send email via Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'order@auxmerveilleux.jp';
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `Aux Merveilleux de Fred Tokyo <${fromEmail}>`,
      replyTo: 'tokyo@auxmerveilleux.com',
      to: [TEST_EMAIL],
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
    console.log('\n✨ Done!\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Run
sendTomorrowSummary();
