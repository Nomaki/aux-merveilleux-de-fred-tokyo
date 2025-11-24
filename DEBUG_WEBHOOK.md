# Debugging Webhook Issues

## Problem: Getting 500 error with real events, no logs visible

### Step 1: Wait for Deployment

After the latest push, wait ~60 seconds for deployment to complete.

Check deployment status:
```bash
vercel ls --yes
```

Look for status: `● Ready`

### Step 2: View Logs in Vercel Dashboard

Since `vercel logs --follow` is deprecated, use the dashboard:

1. Go to: https://vercel.com/dashboard
2. Click on **birthday-reservation-fred**
3. Click **Deployments** tab
4. Click on the **latest Production deployment**
5. Click **Functions** tab (or **Runtime Logs**)
6. Look for `/api/webhook` in the list
7. Click on it to see function-specific logs

**Important:** Logs appear ONLY when the function is invoked. If you don't see any logs, the function hasn't been called yet.

### Step 3: Check Stripe Webhook Attempts

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Scroll down to **"Recent deliveries"** or **"Attempts"**
4. Click on a recent attempt
5. Look at:
   - **Response**: Should show status code (200, 400, 500, etc.)
   - **Response body**: Shows error message if any
   - **Logs**: Stripe's view of what happened

### Step 4: Common Issues & Solutions

#### Issue: "No endpoint found"
- ❌ Webhook URL is wrong in Stripe
- ✅ Update to: `https://birthday-reservation-fred.vercel.app/api/webhook`

#### Issue: 500 error with no logs
- ❌ Function is crashing immediately (before logging)
- ❌ Function is timing out
- ✅ Check if `STRIPE_WEBHOOK_SECRET` is set in Vercel Production
- ✅ Wait for latest deployment to finish

#### Issue: "Signature verification failed"
- ❌ Wrong webhook secret
- ✅ Copy EXACT secret from Stripe webhook page
- ✅ Update in Vercel: `vercel env add STRIPE_WEBHOOK_SECRET`
- ✅ Redeploy

#### Issue: Function timeout
- ❌ Function takes >10 seconds (default limit)
- ✅ Increased to 60 seconds in latest update
- ✅ Check your Vercel plan (Hobby has 10s limit)

### Step 5: Manual Test with Logging

After deployment completes, test from Stripe:

1. Stripe Dashboard → Webhooks → Your endpoint
2. Click **"Send test webhook"**
3. Select: `payment_intent.succeeded`
4. Click **"Send test event"**
5. Immediately go to Vercel Dashboard → Functions → `/api/webhook`
6. You should see logs starting with: `🎯 Webhook handler invoked:`

### Step 6: Check Environment Variables

Verify ALL required env vars are set for Production:

```bash
vercel env ls
```

**Required for Production:**
- `STRIPE_SECRET_KEY` (sk_test_... or sk_live_...)
- `STRIPE_WEBHOOK_SECRET` (whsec_...)
- `RESEND_API_KEY` (re_...)
- `RESEND_FROM_EMAIL` (your@email.com)
- `SUPABASE_URL` (https://xxx.supabase.co)
- `SUPABASE_SERVICE_ROLE_KEY` (eyJhbG...)

If any are missing, add them:
```bash
vercel env add VARIABLE_NAME
```

Then redeploy:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

### Step 7: Test with Real Payment

1. Go to your app
2. Fill out order form
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete payment
5. **Immediately** check:
   - Stripe Dashboard → Events → Latest event
   - Vercel Dashboard → Functions → `/api/webhook` logs
   - Supabase Dashboard → Table Editor → orders table
   - Your email inbox

### Expected Log Output

With the latest update, you should see these logs in order:

```
🎯 Webhook handler invoked: 2025-11-24T...
📥 Request method: POST
📋 Headers: {...}
📖 Reading request body...
✅ Body read successfully, length: XXXX
🔑 Stripe signature present: true
🔐 Verifying webhook signature...
✅ Signature verified, event type: payment_intent.succeeded
🔄 Processing event type: payment_intent.succeeded
💳 Processing payment_intent.succeeded...
✅ PaymentIntent succeeded: pi_...
💰 Amount: 5500 JPY
📧 Receipt email: ...
📋 Starting order processing...
📋 Payment metadata: {...}
🔍 Attempting to insert order: {...}
✅ Order saved to Supabase successfully: {...}
📧 Sending confirmation emails...
✅ Customer email sent: ...
✅ Admin email sent: ...
```

### Step 8: If Still No Logs

If you see NO logs at all:

1. **Check function is deployed:**
   ```bash
   curl -I https://birthday-reservation-fred.vercel.app/api/webhook
   ```
   Should return: `HTTP/2 405` (Method not allowed - but means it exists)

2. **Check Stripe is calling the right URL:**
   - Stripe Dashboard → Webhooks
   - Verify endpoint URL is EXACT: `https://birthday-reservation-fred.vercel.app/api/webhook`
   - NO trailing slash
   - HTTPS not HTTP

3. **Check Vercel deployment includes the function:**
   - Vercel Dashboard → Deployment → Functions tab
   - Look for `/api/webhook` in the list
   - If missing, the build might be failing

4. **Force a fresh deployment:**
   ```bash
   vercel --prod --force
   ```

### Step 9: Get Help

If still stuck, share:
1. Screenshot of Stripe webhook attempt (Response tab)
2. Screenshot of Vercel Functions page
3. Output of: `vercel env ls`
4. Output of: `vercel ls --yes`

## Quick Diagnosis Commands

```bash
# Check if endpoint exists
curl -X POST https://birthday-reservation-fred.vercel.app/api/webhook
# Should return error but not 404

# Check deployment status
vercel ls --yes

# Check env vars
vercel env ls

# Force redeploy
vercel --prod --force
```
