import { createClient } from '@supabase/supabase-js';
import { generateDailyTicketsPDF } from './utils/generate-daily-tickets-pdf.js';

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
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Paramètre date requis' });
    }

    const supabase = createServerSupabaseClient();

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

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: 'Aucune commande pour cette date' });
    }

    // Generate PDF
    const pdfBuffer = await generateDailyTicketsPDF(orders);

    // Format filename with date
    const formattedDate = date.replace(/-/g, '');
    const filename = `commandes-${formattedDate}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('Admin day PDF error:', error);
    return res.status(500).json({ error: 'Erreur génération PDF' });
  }
}
