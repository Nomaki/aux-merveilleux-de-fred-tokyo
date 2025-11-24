# Quick Deployment Checklist ✅

Run through this checklist to ensure Supabase orders are being saved in production.

## Pre-Deployment

- [ ] Run local test: `node test-supabase-insert.js`
  - Should show: ✅ Test order inserted successfully!

## Supabase Setup

- [ ] Go to [Supabase Dashboard](https://app.supabase.com)
- [ ] Select your project
- [ ] Go to SQL Editor
- [ ] Run the script from `supabase-setup.sql`
- [ ] Verify output shows 3 policies created

## Vercel Environment Variables

Check these are set in Vercel → Project Settings → Environment Variables:

- [ ] `SUPABASE_URL` = `https://rruzygmejpetutiotmjj.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGci...` (the long JWT token)
- [ ] `VITE_SUPABASE_URL` = `https://rruzygmejpetutiotmjj.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = `eyJhbGci...` (different JWT token)
- [ ] `STRIPE_SECRET_KEY` = `sk_test_...`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...`

## Deploy

- [ ] Push to GitHub: `git push origin main`
- [ ] Wait for Vercel deployment to complete
- [ ] Check deployment status at [Vercel Dashboard](https://vercel.com/dashboard)

## Post-Deployment Testing

### Test 1: Test Webhook Endpoint
```bash
curl -X POST https://YOUR-APP.vercel.app/api/test-webhook
```
- [ ] Should return: `{"success":true,"message":"Test order created successfully"}`

### Test 2: Check Capacity Endpoint
```bash
curl https://YOUR-APP.vercel.app/api/check-capacity?date=2025-01-15
```
- [ ] Should return: `{"available":true,"count":X,"limit":30}`

### Test 3: Real Payment
- [ ] Make a test payment through the app
- [ ] Go to Vercel → Deployments → Functions → webhook
- [ ] Check logs for: `✅ Order saved to Supabase successfully`
- [ ] Go to Supabase → Table Editor → orders
- [ ] Verify the order appears in the table

## If Something Fails

See [PRODUCTION_TROUBLESHOOTING.md](PRODUCTION_TROUBLESHOOTING.md) for detailed debugging steps.

## Success Criteria

✅ Test webhook returns success
✅ Real payment creates order in Supabase
✅ No errors in Vercel logs
✅ Stripe webhook shows 200 status

## Replace YOUR-APP with your actual Vercel app URL!
