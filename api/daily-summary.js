import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateDailySummaryEmail } from './templates/daily-summary-email.js';
import { generateDailyTicketsPDF } from './utils/generate-daily-tickets-pdf.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'romain.delhoute+amf@gmail.com';

// Validate Supabase environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Daily summary endpoint
 * Fetches all orders for today (JST timezone) and sends summary email to admin
 * Triggered by Vercel cron job at midnight JST
 */
export default async function handler(req, res) {
  try {
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

    // Query Supabase for orders with delivery_date_time on today
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('delivery_date_time', startOfDay.toISOString())
      .lte('delivery_date_time', endOfDay.toISOString())
      .eq('payment_status', 'completed')
      .order('delivery_date_time', { ascending: true });

    if (error) {
      console.error('❌ Supabase query error:', error);
      return res.status(500).json({
        error: 'Failed to fetch orders',
        message: error.message,
      });
    }

    console.log(`✅ Found ${orders?.length || 0} orders for today`);

    // Generate email HTML
    const emailHtml = generateDailySummaryEmail(orders || [], jstDate);

    // Generate one PDF with all order tickets
    const attachments = [];
    if (orders && orders.length > 0) {
      console.log('📄 Generating daily tickets PDF...');
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
    }

    // Email subject with date
    const dateStr = jstDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const subject = `📅 本日のご予約一覧 (${dateStr}) - ${orders?.length || 0}件`;

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [ADMIN_EMAIL],
      subject: subject,
      html: emailHtml,
      attachments: attachments,
    });

    if (emailError) {
      console.error('❌ Failed to send daily summary email:', emailError);
      return res.status(500).json({
        error: 'Failed to send email',
        message: emailError.message,
      });
    }

    console.log('✅ Daily summary email sent successfully:', emailData.id);

    return res.status(200).json({
      success: true,
      message: 'Daily summary email sent',
      orderCount: orders?.length || 0,
      emailId: emailData.id,
      date: jstDate.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('❌ Error in daily summary handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
