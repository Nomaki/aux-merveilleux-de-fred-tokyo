# Stripe Webhook Setup Guide

## ✅ Webhook Endpoint Fixed

Your webhook endpoint is now properly configured at:
```
https://birthday-reservation-fred.vercel.app/api/webhook
```

## 🔧 Configure Stripe Webhook (REQUIRED)

### Step 1: Go to Stripe Dashboard

1. Log in to https://dashboard.stripe.com
2. Switch to **Test mode** (toggle in top right) for testing
3. Go to **Developers** → **Webhooks**

### Step 2: Add Endpoint

Click **"+ Add endpoint"** button

**Endpoint URL:**
```
https://birthday-reservation-fred.vercel.app/api/webhook
```

**Description:** (optional)
```
Birthday Reservation System - Production
```

**Events to send:**
Click "Select events" and choose:
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`

Click **"Add endpoint"**

### Step 3: Get Webhook Secret

After creating the endpoint:
1. Click on the endpoint you just created
2. Find "Signing secret" section
3. Click **"Reveal"** to show the secret
4. Copy the secret (starts with `whsec_...`)

### Step 4: Add Secret to Vercel

#### Option A: Via Vercel CLI (fastest)
```bash
vercel env add STRIPE_WEBHOOK_SECRET
```
When prompted:
- Paste the webhook secret
- Select environments: **Production** and **Preview**

#### Option B: Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on **birthday-reservation-fred** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_xxxxxxxxxx` (paste your secret)
   - Environments: Check **Production** and **Preview**
5. Click **Save**

### Step 5: Redeploy

After adding the environment variable, trigger a new deployment:

```bash
# Option 1: Via git (if you have changes)
git commit --allow-empty -m "Add webhook secret"
git push

# Option 2: Via Vercel Dashboard
# Go to Deployments → Click "..." on latest → Redeploy
```

## ✅ Verify Environment Variables

Make sure ALL these are set in Vercel Production:

```bash
# Check what's configured
vercel env ls
```

Required variables:
- ✅ `STRIPE_SECRET_KEY` - Your Stripe secret key (sk_test_... or sk_live_...)
- ✅ `STRIPE_WEBHOOK_SECRET` - The webhook signing secret (whsec_...)
- ✅ `RESEND_API_KEY` - Your Resend API key for emails
- ✅ `RESEND_FROM_EMAIL` - The sender email address
- ✅ `SUPABASE_URL` - Your Supabase project URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase SERVICE ROLE key (not anon!)

## 🧪 Test the Webhook

### Test 1: Send a Test Event from Stripe

1. In Stripe Dashboard → Webhooks
2. Click on your endpoint
3. Click **"Send test webhook"** button
4. Select event: `payment_intent.succeeded`
5. Click **"Send test event"**

**Expected result:**
- Status should show as "Succeeded" in Stripe
- Check Vercel logs (see below)

### Test 2: Make a Real Test Payment

1. Go to your app: https://birthday-reservation-fred.vercel.app
2. Fill out the order form
3. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
4. Complete the payment

**Expected result:**
- ✅ Payment succeeds in Stripe
- ✅ Order saved to Supabase
- ✅ Confirmation email sent to customer
- ✅ Admin notification email sent

## 📊 View Logs

### Vercel Logs (Real-time)

Since `vercel logs --follow` is deprecated, use Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Click **birthday-reservation-fred**
3. Click **Deployments** → Click latest deployment
4. Click **Runtime Logs** tab
5. Filter by function: `/api/webhook`

### Stripe Webhook Logs

1. In Stripe Dashboard → Webhooks
2. Click on your endpoint
3. Scroll down to see "Recent events"
4. Click on any event to see request/response details

## 🔍 Troubleshooting

### Webhook returns 404
- ❌ Endpoint URL is wrong
- ✅ Use: `https://birthday-reservation-fred.vercel.app/api/webhook`

### Webhook returns 400 (Signature verification failed)
- ❌ Wrong webhook secret in Vercel
- ✅ Copy the EXACT secret from Stripe and update in Vercel
- ✅ Redeploy after updating

### Order not saving to Supabase
- ❌ `SUPABASE_SERVICE_ROLE_KEY` not set or using wrong key
- ✅ Go to Supabase → Settings → API → Copy "service_role" key
- ✅ Add to Vercel and redeploy
- ❌ RLS policies not configured
- ✅ Run `supabase-setup.sql` in Supabase SQL Editor

### Email not sending
- ❌ `RESEND_API_KEY` or `RESEND_FROM_EMAIL` not set
- ✅ Add to Vercel and redeploy

### Webhook not being called
- ❌ Stripe webhook not configured with correct URL
- ✅ Check Stripe Dashboard → Webhooks
- ❌ Using Test mode in Stripe but Live keys in app (or vice versa)
- ✅ Make sure modes match

## 🎯 Production Checklist

Before going live:

- [ ] Switch Stripe to **Live mode**
- [ ] Create NEW webhook endpoint for Live mode
- [ ] Update `STRIPE_SECRET_KEY` in Vercel to live key (`sk_live_...`)
- [ ] Update `STRIPE_WEBHOOK_SECRET` in Vercel to live webhook secret
- [ ] Update `RESEND_FROM_EMAIL` to your real domain email
- [ ] Test with a real payment
- [ ] Verify order appears in Supabase
- [ ] Verify emails are received

## 📚 Related Files

- [api/webhook.js](api/webhook.js) - Webhook handler
- [api/send-confirmation-email.js](api/send-confirmation-email.js) - Email sender
- [api/daily-summary.js](api/daily-summary.js) - Daily summary with PDF tickets
- [vercel.json](vercel.json) - Vercel configuration
- [supabase-setup.sql](supabase-setup.sql) - Database policies
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Full troubleshooting guide
