import crypto from 'crypto';

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

  // Clean old attempts
  const recentAttempts = attempts.filter(time => now - time < WINDOW_MS);
  loginAttempts.set(ip, recentAttempts);

  return recentAttempts.length >= MAX_ATTEMPTS;
}

function recordAttempt(ip) {
  const attempts = loginAttempts.get(ip) || [];
  attempts.push(Date.now());
  loginAttempts.set(ip, attempts);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);

  // Rate limiting
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

    // Record attempt before checking password
    recordAttempt(clientIP);

    if (password === adminPassword) {
      // Generate a simple token (hash of password + timestamp + secret)
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
