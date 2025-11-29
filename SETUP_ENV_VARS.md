# Setup Environment Variables in Vercel

## Required Environment Variables

You need to add these to Vercel Production:

```bash
# 1. Stripe
STRIPE_SECRET_KEY=sk_test_...          # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...        # Get from Stripe Webhooks page

# 2. Resend (Email)
RESEND_API_KEY=re_...                  # Get from Resend Dashboard
RESEND_FROM_EMAIL=your@domain.com      # Your verified sender email

# 3. Supabase
SUPABASE_URL=https://xxx.supabase.co   # Get from Supabase Dashboard
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...    # IMPORTANT: Use SERVICE ROLE key, not anon!
```

## Quick Setup via CLI

Run these commands (you'll be prompted for values):

```bash
# Stripe
vercel env add STRIPE_SECRET_KEY
# When prompted, select: Production

vercel env add STRIPE_WEBHOOK_SECRET
# When prompted, select: Production

# Resend
vercel env add RESEND_API_KEY
# When prompted, select: Production

vercel env add RESEND_FROM_EMAIL
# When prompted, select: Production

# Supabase
vercel env add SUPABASE_URL
# When prompted, select: Production

vercel env add SUPABASE_SERVICE_ROLE_KEY
# When prompted, select: Production
```

## Or via Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add each variable:
   - Name: (variable name from above)
   - Value: (paste the value)
   - Environment: Check **Production**
6. Click Save

## After Adding Variables

Redeploy:
```bash
git commit --allow-empty -m "Trigger redeploy with env vars"
git push
```

Or in Vercel Dashboard:
- Go to Deployments
- Click "..." on latest → Redeploy

## Test After Deployment

```bash
curl -X POST https://birthday-reservation-fred.vercel.app/api/webhook \
  -d '{"type":"test"}' \
  -H "Content-Type: application/json"
```

Should return: `{"received":true}`
