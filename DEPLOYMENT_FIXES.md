# Deployment Fixes for Supabase Integration

## Summary

Fixed critical issues preventing orders from being saved to Supabase in production.

## Changes Made

### 1. Enhanced Error Logging ([api/webhook.js](api/webhook.js))

**Before**: Silent failures - webhook returned 200 even when database insert failed
**After**: Comprehensive error logging with:
- Environment variable validation
- Detailed Supabase error messages (code, message, details, hint)
- Full order data logged for manual recovery
- Specific error type detection (RLS policy, duplicate key, missing env vars)
- Enhanced success logging with order details

### 2. Improved Supabase Client Configuration

**Before**: Basic client initialization without auth options
**After**:
- Proper auth configuration (no session persistence for server-side)
- Environment variable validation at startup
- Applied to all API endpoints: webhook.js, check-capacity.js, daily-summary.js

### 3. Added Test Tools

#### test-supabase-insert.js
- Local testing script to verify Supabase connection
- Tests table access and insert permissions
- Provides clear error messages for common issues
- Run with: `node test-supabase-insert.js`

#### api/test-webhook.js
- Production webhook testing endpoint
- Simulates payment intent without going through Stripe
- Test with: `curl -X POST https://your-app.vercel.app/api/test-webhook`

### 4. Comprehensive Documentation

#### VERCEL_ENV_SETUP.md
- Complete guide for setting environment variables
- Explains the difference between `VITE_*` and non-prefixed variables
- Verification steps and debugging commands

#### PRODUCTION_TROUBLESHOOTING.md
- Step-by-step diagnosis guide
- Common issues with solutions
- Manual recovery procedures for lost orders
- Testing checklist

## Required Actions for Production Deployment

### 1. Set Environment Variables in Vercel

```bash
vercel env add SUPABASE_URL production
# Enter: https://rruzygmejpetutiotmjj.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add VITE_SUPABASE_URL production
# Enter: https://rruzygmejpetutiotmjj.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Or set via Vercel Dashboard → Project Settings → Environment Variables

**CRITICAL**: After adding variables, you MUST redeploy!

### 2. Verify Supabase RLS Policies

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'orders';

-- If "Service role has full access" policy doesn't exist, create it:
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

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

### 3. Deploy to Vercel

```bash
git add .
git commit -m "fix: enhanced Supabase error logging and connection handling"
git push origin main
```

Vercel will auto-deploy.

### 4. Verify Deployment

#### Test 1: Supabase Connection
```bash
curl -X POST https://your-app.vercel.app/api/test-webhook
```

Expected: `{ "success": true, "message": "Test order created successfully", ... }`

#### Test 2: Check Capacity Endpoint
```bash
curl https://your-app.vercel.app/api/check-capacity?date=2025-01-15
```

Expected: `{ "available": true, "count": 0, "limit": 30, ... }`

#### Test 3: Real Payment Flow
1. Make a test payment through the app
2. Check Vercel logs for webhook execution
3. Verify order appears in Supabase `orders` table

## Expected Log Output (Success)

```
✅ PaymentIntent succeeded: pi_3QaRNXJdULck6v561K5J2YY4
💰 Amount: 5000 JPY
📧 Receipt email: customer@example.com
📋 Payment metadata: {
  "reservationCode": "CAKE-lx8kj94-ABCD",
  "deliveryDateTime": "2025-01-15T10:00:00.000Z",
  ...
}
🔍 Attempting to insert order: {
  reservation_code: "CAKE-lx8kj94-ABCD",
  payment_intent_id: "pi_3QaRNXJdULck6v561K5J2YY4",
  email: "customer@example.com"
}
✅ Order saved to Supabase successfully: {
  id: "2f3e4dbc-f8dc-493e-97a5-241bf8fa4440",
  reservation_code: "CAKE-lx8kj94-ABCD",
  email: "customer@example.com",
  total_amount: 5000
}
```

## What to Look For If Still Failing

1. **In Vercel Logs**: Search for `❌` emoji - all errors are marked
2. **In Stripe Dashboard**: Check webhook delivery status (should be 200)
3. **In Supabase Logs**: Check for failed insert attempts
4. **For Lost Orders**: Search logs for `📦 FAILED ORDER DATA` - contains full order info for recovery

## Testing Done

- ✅ Local Supabase connection test passes
- ✅ Test order insert/delete works
- ✅ Environment variable validation working
- ✅ Error logging enhanced
- ✅ Documentation complete

## Next Steps

1. Deploy to production
2. Monitor Vercel webhook logs during next payment
3. Verify order appears in Supabase
4. If issues persist, follow PRODUCTION_TROUBLESHOOTING.md

## Files Changed

- `api/webhook.js` - Enhanced error logging and validation
- `api/check-capacity.js` - Added env validation and auth config
- `api/daily-summary.js` - Added env validation and auth config
- `test-supabase-insert.js` - New local test script
- `api/test-webhook.js` - New production test endpoint
- `VERCEL_ENV_SETUP.md` - New environment setup guide
- `PRODUCTION_TROUBLESHOOTING.md` - New troubleshooting guide
