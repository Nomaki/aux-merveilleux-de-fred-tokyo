import { createClient } from '@supabase/supabase-js';

function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { month, date } = req.query;

    // If specific date is provided, return detailed orders for that day
    if (date) {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('delivery_date_time', startOfDay)
        .lte('delivery_date_time', endOfDay)
        .order('delivery_date_time', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      return res.status(200).json({ orders });
    }

    // If month is provided, return aggregated counts per day
    if (month) {
      // month format: YYYY-MM
      const startOfMonth = `${month}-01T00:00:00.000Z`;
      const [year, monthNum] = month.split('-').map(Number);
      const lastDay = new Date(year, monthNum, 0).getDate();
      const endOfMonth = `${month}-${lastDay}T23:59:59.999Z`;

      const { data: orders, error } = await supabase
        .from('orders')
        .select('delivery_date_time, payment_status')
        .gte('delivery_date_time', startOfMonth)
        .lte('delivery_date_time', endOfMonth);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      // Aggregate by day
      const dayCounts = {};
      orders.forEach(order => {
        const day = order.delivery_date_time.split('T')[0];
        if (!dayCounts[day]) {
          dayCounts[day] = { total: 0, paid: 0, pending: 0 };
        }
        dayCounts[day].total++;
        if (order.payment_status === 'completed') {
          dayCounts[day].paid++;
        } else {
          dayCounts[day].pending++;
        }
      });

      return res.status(200).json({ dayCounts });
    }

    return res.status(400).json({ error: 'Paramètre month ou date requis' });

  } catch (error) {
    console.error('Admin orders error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
