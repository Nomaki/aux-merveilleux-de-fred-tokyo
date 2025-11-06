# Order Limit Feature Documentation

This document describes the daily order limit feature that prevents customers from booking dates that have reached capacity.

## Overview

The system limits each day to a maximum of **30 completed orders**. When a date reaches this limit, customers:

- See a clear warning message below the date picker
- Cannot submit the form for that date
- Must choose an alternative date

## Features Implemented

### 1. **Capacity Checking API**

- **Endpoint**: `GET /api/check-capacity?date=YYYY-MM-DD`
- **Location**: `api/check-capacity.js`
- **Function**: Queries Supabase for completed orders on a specific date
- **Response**:
  ```json
  {
    "available": true,
    "count": 12,
    "limit": 30,
    "remaining": 18,
    "date": "2025-01-15"
  }
  ```

### 2. **Order Capacity Hook**

- **Location**: `src/hooks/useOrderCapacity.ts`
- **Function**: React hook that checks capacity for selected dates
- **Features**:
  - Automatic caching of results
  - Loading states
  - Error handling

### 3. **Visual Indicators**

The form displays different alerts based on capacity:

#### ✅ Available (Green Alert)

- Shown when: More than 5 spots remaining
- Message: "予約可能（残り 18 枠）" / "Available (18 spots remaining)"

#### ⚠️ Limited Availability (Orange Alert)

- Shown when: 1-5 spots remaining
- Message: "残りわずか（残り 3 枠）" / "Limited availability (3 spots remaining)"

#### ❌ Fully Booked (Red Alert)

- Shown when: 30 or more orders for that date
- Message: "この日は予約が満席です" / "This date is fully booked"
- Form validation prevents submission

### 4. **Form Validation**

- Validates date capacity before form submission
- Shows error if date becomes fully booked between selection and submission
- Error message: "この日は予約が満席です。別の日付をお選びください。"

## User Experience Flow

1. **User selects a delivery date**

   - System shows "空き状況を確認中..." (Checking availability...)

2. **Capacity check completes**

   - If available: Green alert with remaining spots
   - If limited: Orange warning with remaining spots
   - If full: Red error, form cannot be submitted

3. **User attempts to submit**
   - If date is full: Form validation error appears
   - User must select a different date

## Technical Details

### Database Query

```sql
SELECT COUNT(*) FROM orders
WHERE delivery_date_time >= 'YYYY-MM-DD 00:00:00'
  AND delivery_date_time <= 'YYYY-MM-DD 23:59:59'
  AND payment_status = 'completed'
```

### Timezone Handling

- All dates are compared in **JST (Japan Standard Time)**
- Queries match by calendar date, not exact timestamp
- Start of day: 00:00:00 JST
- End of day: 23:59:59 JST

### Performance Optimizations

1. **Caching**: Results cached in React state to avoid duplicate API calls
2. **Debouncing**: Could be added if needed for rapid date changes
3. **Query optimization**: Uses Supabase count with indexes

### Capacity Settings

To change the daily order limit, update `DAILY_ORDER_LIMIT` in:

- `api/check-capacity.js`

Currently set to: **30 orders per day**

## Translation Keys

### English (`en.json`)

```json
{
  "form": {
    "capacityChecking": "Checking availability...",
    "capacityAvailable": "Available",
    "capacityLimited": "Limited availability ({{count}} spots remaining)",
    "capacityFull": "This date is fully booked. Please select another date."
  },
  "validation": {
    "dateFull": "This date is fully booked. Please select another date."
  }
}
```

### Japanese (`ja.json`)

```json
{
  "form": {
    "capacityChecking": "空き状況を確認中...",
    "capacityAvailable": "予約可能（残り{{count}}枠）",
    "capacityLimited": "残りわずか（残り{{count}}枠）",
    "capacityFull": "この日は予約が満席です。別の日付をお選びください。"
  },
  "validation": {
    "dateFull": "この日は予約が満席です。別の日付をお選びください。"
  }
}
```

## Files Modified

1. **New Files**:

   - `api/check-capacity.js` - Capacity checking API endpoint
   - `src/hooks/useOrderCapacity.ts` - React hook for capacity checking
   - `ORDER_LIMIT_FEATURE.md` - This documentation

2. **Modified Files**:
   - `src/pages/ReservationForm.tsx` - Added capacity checking and UI
   - `src/types/index.ts` - Added `CapacityResponse` interface
   - `src/i18n/locales/en.json` - Added English translations
   - `src/i18n/locales/ja.json` - Added Japanese translations

## Testing

### Manual Testing Steps

1. **Test with available capacity**:

   - Select a future date
   - Verify green "Available" message appears
   - Should be able to submit form

2. **Test with limited capacity** (requires 25-29 orders in DB):

   - Select a date with 25-29 orders
   - Verify orange "Limited availability" message
   - Should still be able to submit

3. **Test with full capacity** (requires 30+ orders in DB):
   - Select a date with 30+ orders
   - Verify red "Fully booked" message
   - Form submission should fail with validation error

### API Testing

```bash
# Check capacity for a specific date
curl "http://localhost:5173/api/check-capacity?date=2025-01-15"

# Expected response
{
  "available": true,
  "count": 5,
  "limit": 30,
  "remaining": 25,
  "date": "2025-01-15"
}
```

## Future Enhancements

Possible improvements:

1. **Calendar view**: Disable fully booked dates in date picker
2. **Real-time updates**: WebSocket notifications when capacity changes
3. **Variable limits**: Different limits for weekends vs weekdays
4. **Hourly limits**: Limit orders per time slot, not just per day
5. **Admin override**: Allow admin to exceed daily limit in special cases

## Troubleshooting

### Capacity not updating

- Check browser console for API errors
- Verify Supabase connection and credentials
- Clear cache by refreshing the page

### Wrong capacity count

- Verify timezone settings (should be JST)
- Check that only `payment_status = 'completed'` orders are counted
- Review date range in query (should be full day, 00:00 to 23:59)

### Form allows submission when full

- Check form validation is running
- Verify `capacity` state is populated
- Check translation keys exist
