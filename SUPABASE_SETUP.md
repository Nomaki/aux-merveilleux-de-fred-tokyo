# Supabase Setup Guide

This document provides instructions for setting up the Supabase database for the Birthday Cake Reservation system.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project in Supabase

## Environment Variables

Add the following environment variables to your `.env` file and Vercel project settings:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

You can find these values in:
- Supabase Dashboard → Project Settings → API

## Database Schema

### Create the `orders` table

Run the following SQL in the Supabase SQL Editor:

```sql
-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_code TEXT NOT NULL UNIQUE,
  payment_intent_id TEXT,
  customer_name_kanji TEXT NOT NULL,
  customer_name_katakana TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  delivery_date_time TIMESTAMPTZ NOT NULL,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on reservation_code for fast lookups
CREATE INDEX idx_orders_reservation_code ON orders(reservation_code);

-- Create index on delivery_date_time for daily summary queries
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date_time);

-- Create index on payment_status for filtering
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Add constraint for payment_status values
ALTER TABLE orders ADD CONSTRAINT check_payment_status
  CHECK (payment_status IN ('pending', 'completed', 'failed'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS)

For production, enable RLS and create appropriate policies:

```sql
-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything (for API routes)
CREATE POLICY "Service role has full access" ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to read their own orders
CREATE POLICY "Users can read their own orders" ON orders
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Policy: Anon users cannot access orders directly
-- (All operations should go through API routes)
CREATE POLICY "Anon users cannot access orders" ON orders
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
```

## Vercel Cron Job Setup

The system uses Vercel Cron Jobs to send daily summary emails at midnight JST.

### Cron Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/daily-summary",
      "schedule": "0 15 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `"0 15 * * *"` = Every day at 15:00 UTC
- UTC 15:00 = JST 00:00 (midnight in Japan)

### Testing the Cron Job

You can manually test the daily summary endpoint:

```bash
curl -X GET https://your-app.vercel.app/api/daily-summary
```

Or using the Vercel CLI:

```bash
vercel env pull  # Download env vars
vercel dev       # Run locally
# Then visit: http://localhost:3000/api/daily-summary
```

## Data Flow

### Order Creation Process

1. User fills out reservation form
2. User proceeds to payment page
3. Payment page generates unique reservation code (format: AB1234)
4. Payment intent is created with order data in metadata
5. User completes payment
6. Stripe webhook fires `payment_intent.succeeded`
7. Webhook handler saves order to Supabase `orders` table
8. Confirmation email sent to customer

### Daily Summary Process

1. Vercel cron triggers at midnight JST (15:00 UTC)
2. `/api/daily-summary` endpoint is called
3. Query Supabase for orders with `delivery_date_time` = today
4. Generate HTML email with all orders grouped by time
5. Send summary email to admin via Resend

## Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `reservation_code` | TEXT | Unique code (e.g., AB1234) |
| `payment_intent_id` | TEXT | Stripe payment intent ID |
| `customer_name_kanji` | TEXT | Customer full name in Kanji |
| `customer_name_katakana` | TEXT | Customer full name in Katakana |
| `email` | TEXT | Customer email address |
| `phone_number` | TEXT | Customer phone number |
| `delivery_date_time` | TIMESTAMPTZ | Scheduled delivery/pickup time |
| `cart_items` | JSONB | Array of ordered items with details |
| `total_amount` | INTEGER | Total order amount in yen |
| `payment_status` | TEXT | Status: 'pending', 'completed', 'failed' |
| `created_at` | TIMESTAMPTZ | Order creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

## Troubleshooting

### Orders not being saved

1. Check Supabase credentials in environment variables
2. Check Vercel logs for webhook errors
3. Verify Stripe webhook is configured and working
4. Check that `orders` table exists with correct schema

### Daily summary not sending

1. Check Vercel cron logs in dashboard
2. Verify Resend API key is valid
3. Test endpoint manually: `GET /api/daily-summary`
4. Check admin email address in `api/daily-summary.js`

### Timezone issues

The system uses JST (Asia/Tokyo) timezone for:
- Daily summary queries
- Email date formatting

Cron runs at 15:00 UTC = 00:00 JST (midnight in Japan)

## Backup and Maintenance

### Regular backups

Supabase automatically creates daily backups. You can also:
- Export data via SQL: `SELECT * FROM orders`
- Use Supabase CLI: `supabase db dump`
- Enable Point-in-Time Recovery (PITR) for Pro plans

### Data retention

Consider implementing a data retention policy:

```sql
-- Archive old orders (optional)
CREATE TABLE orders_archive AS SELECT * FROM orders WHERE false;

-- Move orders older than 1 year to archive
INSERT INTO orders_archive
SELECT * FROM orders
WHERE created_at < NOW() - INTERVAL '1 year';

-- Delete from main table (optional)
-- DELETE FROM orders WHERE created_at < NOW() - INTERVAL '1 year';
```
