/**
 * Test script for daily summary email
 * Run with: node test-daily-summary.js
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateDailySummaryEmail } from './api/templates/daily-summary-email.js';

// Load environment variables
config();

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'romain.delhoute+amf@gmail.com';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDailySummary() {
  try {
    console.log('🧪 Testing daily summary email...\n');

    // Get today's date in JST timezone
    const jstDate = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })
    );

    // Set time to start of day (00:00:00)
    const startOfDay = new Date(jstDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Set time to end of day (23:59:59)
    const endOfDay = new Date(jstDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('📅 Fetching orders for:', {
      date: jstDate.toISOString().split('T')[0],
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
    });

    // Query Supabase for orders
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

    console.log(`\n✅ Found ${orders?.length || 0} orders for today\n`);

    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`Order ${index + 1}:`, {
          code: order.reservation_code,
          customer: order.customer_name_kanji,
          time: new Date(order.delivery_date_time).toLocaleTimeString('ja-JP'),
          amount: `¥${order.total_amount.toLocaleString()}`,
        });
      });
    }

    // Generate email HTML
    const emailHtml = generateDailySummaryEmail(orders || [], jstDate);

    // Email subject with date
    const dateStr = jstDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const subject = `📅 本日のご予約一覧 (${dateStr}) - ${orders?.length || 0}件`;

    console.log('\n📧 Sending email...');
    console.log('Subject:', subject);
    console.log('To:', ADMIN_EMAIL);

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [ADMIN_EMAIL],
      subject: subject,
      html: emailHtml,
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
