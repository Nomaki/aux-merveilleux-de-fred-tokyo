import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { generateDailyTicketsPDF } from './utils/generate-daily-tickets-pdf.js';

// Simple in-memory rate limiting
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(time => now - time < WINDOW_MS);
  loginAttempts.set(ip, recentAttempts);
  return recentAttempts.length >= MAX_ATTEMPTS;
}

function recordAttempt(ip) {
  const attempts = loginAttempts.get(ip) || [];
  attempts.push(Date.now());
  loginAttempts.set(ip, attempts);
}

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

// Login handler
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);

  if (isRateLimited(clientIP)) {
    return res.status(429).json({
      error: 'Trop de tentatives. Réessayez dans une minute.'
    });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis' });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD not configured');
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    recordAttempt(clientIP);

    if (password === adminPassword) {
      const timestamp = Date.now().toString();
      const tokenData = `${adminPassword}:${timestamp}:${process.env.ADMIN_PASSWORD}`;
      const token = crypto.createHash('sha256').update(tokenData).digest('hex');

      return res.status(200).json({
        success: true,
        token,
        message: 'Connexion réussie'
      });
    }

    return res.status(401).json({
      error: 'Mot de passe incorrect'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Orders handler
async function handleOrders(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { month, date } = req.query;

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

    if (month) {
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

// Tax rates in Japan (must match create-payment-intent.js)
const TAX_RATES = {
  takeout: 0.08,
  takein: 0.10,
};

// Monthly tax report handler
async function handleReport(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: 'Paramètre month requis (format: YYYY-MM)' });
    }

    const supabase = createServerSupabaseClient();

    const startOfMonth = `${month}-01T00:00:00.000Z`;
    const [year, monthNum] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endOfMonth = `${month}-${lastDay}T23:59:59.999Z`;

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_status', 'completed')
      .gte('delivery_date_time', startOfMonth)
      .lte('delivery_date_time', endOfMonth)
      .order('delivery_date_time', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Erreur base de données' });
    }

    // Calculate tax breakdown for each order
    let totalTakeoutSubtotal = 0;
    let totalTakeoutTax = 0;
    let totalTakeoutGross = 0;
    let takeoutItemCount = 0;

    let totalTakeinSubtotal = 0;
    let totalTakeinTax = 0;
    let totalTakeinGross = 0;
    let takeinItemCount = 0;

    orders.forEach(order => {
      const cartItems = order.cart_items || [];

      cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;

        // Birthday plate is always takeout (8%)
        if (item.cakeType === 'plate' || item.serviceType === 'takeout') {
          const tax = Math.round(itemTotal * TAX_RATES.takeout / (1 + TAX_RATES.takeout));
          const subtotal = itemTotal - tax;

          totalTakeoutSubtotal += subtotal;
          totalTakeoutTax += tax;
          totalTakeoutGross += itemTotal;
          takeoutItemCount += item.quantity;
        } else {
          const tax = Math.round(itemTotal * TAX_RATES.takein / (1 + TAX_RATES.takein));
          const subtotal = itemTotal - tax;

          totalTakeinSubtotal += subtotal;
          totalTakeinTax += tax;
          totalTakeinGross += itemTotal;
          takeinItemCount += item.quantity;
        }
      });
    });

    const report = {
      month,
      orderCount: orders.length,
      takeout: {
        rate: '8%',
        itemCount: takeoutItemCount,
        subtotal: totalTakeoutSubtotal,
        tax: totalTakeoutTax,
        total: totalTakeoutGross,
      },
      takein: {
        rate: '10%',
        itemCount: takeinItemCount,
        subtotal: totalTakeinSubtotal,
        tax: totalTakeinTax,
        total: totalTakeinGross,
      },
      totals: {
        itemCount: takeoutItemCount + takeinItemCount,
        subtotal: totalTakeoutSubtotal + totalTakeinSubtotal,
        tax: totalTakeoutTax + totalTakeinTax,
        total: totalTakeoutGross + totalTakeinGross,
      },
    };

    return res.status(200).json({ report });

  } catch (error) {
    console.error('Admin report error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PDF handler
async function handlePdf(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const pdfBuffer = await generateDailyTicketsPDF(orders);

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

// Main handler - routes based on action parameter
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  switch (action) {
    case 'login':
      return handleLogin(req, res);
    case 'orders':
      return handleOrders(req, res);
    case 'pdf':
      return handlePdf(req, res);
    case 'report':
      return handleReport(req, res);
    default:
      return res.status(400).json({ error: 'Action invalide' });
  }
}
