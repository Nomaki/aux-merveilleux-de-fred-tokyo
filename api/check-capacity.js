import { createClient } from '@supabase/supabase-js';

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

const DAILY_ORDER_LIMIT = 30;

/**
 * Check order capacity for a specific date
 * GET /api/check-capacity?date=2025-01-15
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Missing date parameter',
        message: 'Please provide a date in YYYY-MM-DD format',
      });
    }

    // Parse the date and create start/end of day in JST timezone
    const targetDate = new Date(date);

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Please provide a date in YYYY-MM-DD format',
      });
    }

    // Set to start of day (00:00:00) in JST
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Set to end of day (23:59:59) in JST
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('🔍 Checking capacity for:', {
      date,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
    });

    // Query Supabase for orders on this date
    const { data, error, count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: false })
      .gte('delivery_date_time', startOfDay.toISOString())
      .lte('delivery_date_time', endOfDay.toISOString())
      .eq('payment_status', 'completed');

    if (error) {
      console.error('❌ Supabase query error:', error);
      return res.status(500).json({
        error: 'Failed to check capacity',
        message: error.message,
      });
    }

    const orderCount = count || 0;
    const available = orderCount < DAILY_ORDER_LIMIT;
    const remaining = Math.max(0, DAILY_ORDER_LIMIT - orderCount);

    console.log(`✅ Capacity check: ${orderCount}/${DAILY_ORDER_LIMIT} orders`);

    return res.status(200).json({
      available,
      count: orderCount,
      limit: DAILY_ORDER_LIMIT,
      remaining,
      date,
    });
  } catch (error) {
    console.error('❌ Error in check-capacity handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
