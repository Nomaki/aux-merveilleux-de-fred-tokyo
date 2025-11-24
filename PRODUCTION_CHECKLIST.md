# Production Deployment Checklist

## Issue: Orders not saving to Supabase in production

If emails are being sent but orders aren't saving to Supabase in production, follow this checklist:

## 1. ✅ Verify Vercel Environment Variables

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Ensure ALL of these are set for **Production**:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx  # NOT sk_test_xxxxx for production
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Resend
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=your@domain.com

# Supabase (CRITICAL!)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Common mistakes:**
- ❌ Using Supabase **anon key** instead of **service_role key**
- ❌ Having spaces before/after the values
- ❌ Not deploying after adding variables
- ❌ Setting variables only for "Preview" but not "Production"

### How to find your Supabase Service Role Key:
1. Go to Supabase Dashboard
2. Click on your project
3. Go to **Settings** → **API**
4. Copy the **`service_role`** key (NOT the anon key!)

## 2. ✅ Verify Supabase RLS Policies

Run this SQL in your Supabase SQL Editor:

```sql
-- Check if policies exist
SELECT
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;
```

**Expected output:**
```
| policyname                      | roles         | cmd    |
|---------------------------------|---------------|--------|
| Service role has full access    | service_role  | ALL    |
| Anon users cannot access orders | anon          | ALL    |
```

**If the "Service role has full access" policy is missing**, run the entire `supabase-setup.sql` file in your Supabase SQL Editor.

## 3. ✅ Check Stripe Webhook Configuration

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Verify the endpoint URL is correct:
   ```
   https://your-production-domain.vercel.app/api/webhook
   ```
3. Check that these events are selected:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
4. The webhook secret in Stripe should match `STRIPE_WEBHOOK_SECRET` in Vercel

## 4. ✅ Test Production Webhook

### View Vercel Logs:
```bash
vercel logs --follow
```

Or in Vercel Dashboard:
1. Go to your project
2. Click **Deployments**
3. Click latest deployment
4. Click **Functions** tab
5. Find `/api/webhook` and check logs

### Test with Stripe CLI:
```bash
# Forward webhooks to production
stripe listen --forward-to https://your-domain.vercel.app/api/webhook

# Trigger a test payment
stripe trigger payment_intent.succeeded
```

Look for these log messages:
- ✅ `PaymentIntent succeeded: pi_xxxxx`
- ✅ `Attempting to insert order: ...`
- ✅ `Order saved to Supabase successfully`
- ✅ `Sending confirmation emails...`
- ✅ `Confirmation emails sent successfully`

### Common Errors:

**"Missing Supabase environment variables"**
- → Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Vercel
- → Redeploy after adding

**"Failed to save order to Supabase: RLS POLICY ERROR"**
- → Run `supabase-setup.sql` in Supabase SQL Editor
- → Verify you're using `service_role` key, not `anon` key

**"No reservation code in payment intent metadata"**
- → Check your frontend is sending metadata correctly in Stripe payment intent
- → Verify `metadata.reservationCode` exists

## 5. ✅ Redeploy After Changes

After making ANY environment variable changes:

```bash
# Trigger a new deployment
git commit --allow-empty -m "Redeploy to apply env vars"
git push
```

Or in Vercel Dashboard:
- Go to **Deployments**
- Click **"Redeploy"** on latest deployment

## 6. ✅ Manual Test

1. Make a test payment on production
2. Check Vercel logs immediately
3. Check Supabase table:
   ```sql
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
   ```
4. Check your email for confirmation

## Debugging Script

Run this locally to verify your production config:

```bash
node test-supabase-connection.js
```

If this works locally but not in production → Environment variables issue

---

## Quick Fix Commands

### Check Vercel env vars:
```bash
vercel env ls
```

### Add missing env var:
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### Pull production env vars locally:
```bash
vercel env pull .env.production
```

---

## Still Not Working?

1. Share the Vercel webhook logs (`/api/webhook`)
2. Check if the order appears with `payment_status = 'pending'` in Supabase
3. Verify the email that's being sent contains the correct reservation code
