# Vercel Environment Variables Setup

This guide ensures all required environment variables are properly configured in Vercel.

## Required Environment Variables

### Stripe Configuration

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Supabase Configuration (CRITICAL)

```
SUPABASE_URL=https://rruzygmejpetutiotmjj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://rruzygmejpetutiotmjj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANT**:

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are for server-side API routes
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are for client-side (frontend) - must have `VITE_` prefix!

### Resend Email Configuration

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=order@auxmerveilleux.jp
```

## How to Set Environment Variables in Vercel

### Via Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the sidebar
4. Add each variable with the correct value
5. Select the appropriate environments (Production, Preview, Development)

### Via Vercel CLI

```bash
# Set a variable for all environments
vercel env add SUPABASE_URL

# Set a variable for production only
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Pull environment variables to local
vercel env pull .env.local
```

## Verification Steps

### 1. Check Vercel Logs

After deployment, check the logs for:

- ✅ No "Missing Supabase environment variables" errors
- ✅ Successful Supabase connections
- ✅ Successful order insertions from webhook

### 2. Test Webhook Endpoint

```bash
curl -X GET https://your-app.vercel.app/api/check-capacity?date=2025-01-15
```

Expected response:

```json
{
  "available": true,
  "count": 0,
  "limit": 30,
  "remaining": 30,
  "date": "2025-01-15"
}
```

### 3. Check Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Check "Recent events" for successful delivery
4. Look for 200 status codes (not 500 errors)

### 4. Verify Supabase Connection

Check Vercel function logs after a test payment for:

```
🔍 Attempting to insert order: { reservation_code: '...', ... }
✅ Order saved to Supabase: [...]
```

If you see errors:

```
❌ Failed to save order to Supabase: { code: '...', message: '...' }
```

## Common Issues and Solutions

### Issue: "Missing Supabase environment variables"

**Solution**: Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in Vercel (without `VITE_` prefix for API routes)

### Issue: "new row violates row-level security policy"

**Solution**:

1. Check that you're using `SUPABASE_SERVICE_ROLE_KEY` (not the anon key)
2. Verify RLS policies in Supabase allow service_role to insert:

```sql
CREATE POLICY "Service role has full access" ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Issue: Frontend can't connect to Supabase

**Solution**: Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set with the `VITE_` prefix

### Issue: Orders not appearing in Supabase after payment

**Solution**:

1. Check Stripe webhook is configured correctly
2. Check Vercel function logs for errors
3. Verify Supabase credentials are correct
4. Test webhook manually using Stripe CLI

## Testing Checklist

- [ ] All environment variables set in Vercel
- [ ] `VITE_` prefixed variables for frontend
- [ ] Non-prefixed `SUPABASE_*` variables for API routes
- [ ] Stripe webhook endpoint configured
- [ ] Test payment completes successfully
- [ ] Order appears in Supabase `orders` table
- [ ] Daily summary cron job works
- [ ] Confirmation emails send correctly

## Debugging Commands

```bash
# Check Vercel deployment logs
vercel logs <deployment-url>

# Test Stripe webhook locally
stripe listen --forward-to localhost:3000/api/webhook

# Test API endpoints
curl https://your-app.vercel.app/api/check-capacity?date=2025-01-15
curl https://your-app.vercel.app/api/daily-summary
```
