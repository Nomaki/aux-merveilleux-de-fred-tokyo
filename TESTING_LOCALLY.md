# Testing the Order Limit Feature Locally

## Why it's not working locally

The capacity checking feature uses an API route (`/api/check-capacity`) that **only works when deployed to Vercel**, not in local development with Vite.

### The Problem
- Vite dev server (`npm run dev`) doesn't execute serverless functions
- API routes in `/api/` folder are for Vercel deployment
- Local Vite tries to serve them as static JavaScript files

### The Solution
The app now automatically uses **mock data in development mode** and will use the real API when deployed to Vercel.

## How to Test Locally

### 1. Start the dev server
```bash
npm run dev
```

### 2. Open the reservation form
Go to `http://localhost:5173`

### 3. Select a delivery date
- Fill in your customer information
- **Select a date** in the "お届け日時" (Delivery Date & Time) field
- Choose any date at least 48 hours in the future

### 4. You should see the capacity indicator
Below the date picker, you'll see a **green alert** that says:
- **Japanese**: "予約可能（残り15枠）"
- **English**: "Available (15 spots remaining)"

## Mock Data Behavior

In development, the system always shows:
- ✅ Available: Yes
- 📊 Current orders: 15
- 🎯 Limit: 30
- 📉 Remaining: 15

You'll see a console warning:
```
⚠️ API route not available in dev mode, using mock data
```

## Testing Different Capacity States

To test different states locally, you can temporarily modify the mock data in:
`src/hooks/useOrderCapacity.ts` (lines 49-55 and 77-83)

### Example: Test "Limited Availability" (Orange Alert)
```typescript
const mockData: CapacityResponse = {
  available: true,
  count: 27,      // Change to 27 (3 remaining)
  limit: 30,
  remaining: 3,   // Change to 3
  date: dateStr,
};
```

### Example: Test "Fully Booked" (Red Alert)
```typescript
const mockData: CapacityResponse = {
  available: false,  // Change to false
  count: 30,         // Change to 30
  limit: 30,
  remaining: 0,      // Change to 0
  date: dateStr,
};
```

## Testing on Vercel (Production)

Once deployed to Vercel, the real API will work:

### 1. Deploy to Vercel
```bash
git add .
git commit -m "Added order capacity feature"
git push
```

### 2. Vercel will automatically deploy

### 3. Test the real API
The capacity will show real data from your Supabase database.

## Verifying the API Endpoint

Once deployed to Vercel, you can test the API directly:

```bash
# Test the capacity API
curl "https://your-app.vercel.app/api/check-capacity?date=2025-01-15"
```

Expected response:
```json
{
  "available": true,
  "count": 5,
  "limit": 30,
  "remaining": 25,
  "date": "2025-01-15"
}
```

## Troubleshooting

### I don't see the capacity indicator

**Check:**
1. Did you select a date in the date picker?
2. Look in the browser console for warnings
3. Make sure you're running latest code: `npm run dev`

### The indicator shows error

**In development**, this is normal if the API fails. The app should automatically fall back to mock data showing 15 available spots.

**Check the console** for:
```
⚠️ Using mock capacity data for development
```

### Want to disable the feature temporarily?

Comment out these lines in `ReservationForm.tsx` (lines 98-102):
```typescript
// useEffect(() => {
//   if (form.values.deliveryDateTime) {
//     checkCapacity(form.values.deliveryDateTime);
//   }
// }, [form.values.deliveryDateTime, checkCapacity]);
```

## Visual Guide

### What to expect:

1. **Before selecting a date**: No indicator

2. **After selecting a date**:
   - Loading spinner briefly appears
   - Then one of these alerts shows up:

#### ✅ Available (Green)
```
┌─────────────────────────────────────┐
│ ✓ 予約可能（残り15枠）              │
│   Available (15 spots remaining)    │
└─────────────────────────────────────┘
```

#### ⚠️ Limited (Orange)
```
┌─────────────────────────────────────┐
│ ⚠ 残りわずか（残り3枠）             │
│   Limited availability (3 spots)    │
└─────────────────────────────────────┘
```

#### ❌ Fully Booked (Red)
```
┌─────────────────────────────────────┐
│ ✕ この日は予約が満席です。          │
│   This date is fully booked.        │
│   Please select another date.       │
└─────────────────────────────────────┘
```

## Next Steps

1. Test locally with mock data ✅
2. Deploy to Vercel
3. Set up Supabase (see `SUPABASE_SETUP.md`)
4. Test with real data
5. Create some test orders to verify capacity limits work correctly

## Summary

- **Local development**: Uses mock data (always shows 15/30)
- **Vercel deployment**: Uses real Supabase data
- **Feature works**: Just not with real API in local dev mode
- **This is normal**: Vercel serverless functions only work when deployed

The feature is **fully implemented and ready** - it just needs to be deployed to Vercel to work with real data!
