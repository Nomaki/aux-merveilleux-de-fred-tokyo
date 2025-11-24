# Production Troubleshooting Guide - Supabase Orders Not Saving

This guide helps diagnose and fix issues with orders not being saved to Supabase in production.

## Quick Diagnosis Steps

### Step 1: Check Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Deployments" → Click latest deployment → "Functions"
4. Find the `/api/webhook` function
5. Look for these log messages:

#### ✅ Success Pattern:
```
✅ PaymentIntent succeeded: pi_xxxxx
💰 Amount: 5000 JPY
📧 Receipt email: customer@example.com
📋 Payment metadata: { reservationCode: "CAKE-xxxxx", ... }
🔍 Attempting to insert order: { reservation_code: "CAKE-xxxxx", ... }
✅ Order saved to Supabase successfully: { id: "...", reservation_code: "CAKE-xxxxx" }
```

#### ❌ Failure Patterns:

**Pattern 1: Missing Environment Variables**
```
❌ Missing Supabase environment variables: { SUPABASE_URL: 'MISSING', ... }
```
**Fix**: Set environment variables in Vercel (see below)

**Pattern 2: RLS Policy Error**
```
❌ Failed to save order to Supabase: { code: "42501", message: "new row violates row-level security policy" }
🔒 RLS POLICY ERROR: Service role might not have permission to insert rows.
```
**Fix**: Run SQL policy in Supabase (see below)

**Pattern 3: Missing Reservation Code**
```
❌ No reservation code in payment intent metadata
❌ This payment will not be saved to the database!
```
**Fix**: Check payment intent creation (see below)

**Pattern 4: Duplicate Key Error**
```
❌ Failed to save order to Supabase: { code: "23505", ... }
⚠️  DUPLICATE KEY ERROR: An order with this reservation code already exists.
```
**Fix**: Check reservation code generation logic

### Step 2: Verify Environment Variables

Run this command to check Vercel environment variables:
```bash
vercel env ls
```

Required variables for production:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (NOT the anon key!)
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`

To add missing variables:
```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

Or via Vercel Dashboard:
1. Project Settings → Environment Variables
2. Add each variable
3. Select "Production" environment
4. Click "Save"
5. **Redeploy the application** (env vars only apply to new deployments)

### Step 3: Verify Supabase RLS Policies

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to "SQL Editor"
4. Run this query to check existing policies:

```sql
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'orders';
```

5. If no "Service role has full access" policy exists, run:

```sql
-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies (if any)
DROP POLICY IF EXISTS "Service role has full access" ON orders;
DROP POLICY IF EXISTS "Anon users cannot access orders" ON orders;

-- Create correct policies
CREATE POLICY "Service role has full access" ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users cannot access orders" ON orders
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
```

### Step 4: Test the Webhook Endpoint

Test the webhook handler directly:

```bash
# Test with the test endpoint
curl -X POST https://your-app.vercel.app/api/test-webhook

# Expected response:
{
  "success": true,
  "message": "Test order created successfully",
  "order": { ... }
}
```

If the test succeeds but real payments fail, the issue is with Stripe metadata.

### Step 5: Verify Stripe Webhook Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to "Developers" → "Webhooks"
3. Find your webhook endpoint
4. Check "Recent events"
5. Look for `payment_intent.succeeded` events
6. Click on one to see the response status

**Expected**: 200 OK
**If you see 4xx or 5xx errors**: The webhook is failing

### Step 6: Check Payment Intent Metadata

The payment intent must include all required metadata. Check your payment creation:

```javascript
// In create-payment-intent.js - verify this data is being sent:
metadata: {
  reservationCode: orderData?.reservationCode || '',  // ⚠️ REQUIRED!
  deliveryDateTime: orderData?.deliveryDateTime || new Date().toISOString(),
  familyNameKanji: orderData?.familyNameKanji || '',
  nameKanji: orderData?.nameKanji || '',
  familyNameKatakana: orderData?.familyNameKatakana || '',
  nameKatakana: orderData?.nameKatakana || '',
  customerEmail: orderData?.email || '',
  customerPhone: orderData?.phoneNumber || '',
  cartItems: JSON.stringify(orderData?.cartItems || []),
}
```

## Common Issues and Solutions

### Issue 1: Orders not saving in production (but works locally)

**Root Cause**: Environment variables not set in Vercel

**Solution**:
1. Set all required environment variables in Vercel
2. **Redeploy** the application (crucial!)
3. Verify variables are set: `vercel env ls`

### Issue 2: "new row violates row-level security policy"

**Root Cause**: RLS policies blocking service role

**Solution**:
Run the SQL from Step 3 above in Supabase SQL Editor

### Issue 3: "No reservation code in payment intent metadata"

**Root Cause**: Reservation code not being generated or passed to Stripe

**Solution**:
Check `PaymentPage.tsx` - ensure:
```typescript
const newReservationCode = generateReservationCode();
setReservationCode(newReservationCode);

const orderWithReservation = {
  ...order,
  reservationCode: newReservationCode,  // ⚠️ Must be set!
};

createPaymentIntent(amount, orderWithReservation, i18n.language)
```

### Issue 4: Webhook returns 200 but order not saved

**Root Cause**: Webhook acknowledges receipt before verifying Supabase insert

**Solution**:
- This is by design (to prevent Stripe retries on transient errors)
- Check Vercel logs for the actual error
- Look for `📦 FAILED ORDER DATA` in logs - this contains the order data for manual recovery

## Manual Recovery of Lost Orders

If orders were lost due to database errors:

1. Go to Vercel Dashboard → Your Project → Deployments → Functions → webhook
2. Search logs for: `📦 FAILED ORDER DATA`
3. Copy the JSON order data
4. Go to Supabase Dashboard → SQL Editor
5. Run:

```sql
INSERT INTO orders (
  reservation_code,
  payment_intent_id,
  customer_name_kanji,
  customer_name_katakana,
  email,
  phone_number,
  delivery_date_time,
  cart_items,
  total_amount,
  payment_status
) VALUES (
  'CAKE-xxxxx',           -- from failed order data
  'pi_xxxxx',             -- from failed order data
  'テスト 太郎',          -- from failed order data
  'テスト タロウ',        -- from failed order data
  'test@example.com',    -- from failed order data
  '090-1234-5678',       -- from failed order data
  '2025-01-15T10:00:00Z', -- from failed order data
  '[{"id":"cake-1","name":"ケーキ","price":5000,"quantity":1}]'::jsonb,
  5000,
  'completed'
);
```

## Testing Checklist

Before marking this as "fixed":

- [ ] Run local test: `node test-supabase-insert.js` → Should succeed
- [ ] Check Vercel env vars: All required variables set
- [ ] Verify RLS policies: Service role policy exists
- [ ] Test webhook: `curl -X POST https://your-app.vercel.app/api/test-webhook` → Success
- [ ] Make a real test payment → Check order appears in Supabase
- [ ] Check Vercel webhook logs → No errors
- [ ] Check Stripe webhook delivery → 200 status

## Still Not Working?

1. **Check Supabase service status**: https://status.supabase.com
2. **Verify Supabase credentials are correct** in `.env` and Vercel
3. **Check Supabase project is not paused** (free tier auto-pauses)
4. **Contact support** with:
   - Vercel function logs (redact sensitive data)
   - Supabase project ID
   - Stripe payment intent ID
   - Reservation code
