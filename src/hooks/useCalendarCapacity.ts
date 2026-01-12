import { useState, useCallback, useRef } from 'react';
import type { CapacityResponse } from '../types';

interface UseCalendarCapacityResult {
  capacityMap: Map<string, CapacityResponse>;
  isLoading: boolean;
  checkMonthCapacity: (month: Date) => Promise<void>;
  getCapacityForDate: (date: Date) => CapacityResponse | null;
  checkSingleDateCapacity: (date: Date) => Promise<CapacityResponse | null>;
}

// Session storage key for capacity cache
const CAPACITY_CACHE_KEY = 'capacity_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedCapacity {
  data: CapacityResponse;
  timestamp: number;
}

function getSessionCache(): Record<string, CachedCapacity> {
  try {
    const cached = sessionStorage.getItem(CAPACITY_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

function setSessionCache(cache: Record<string, CachedCapacity>) {
  try {
    sessionStorage.setItem(CAPACITY_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Session storage full or unavailable
  }
}

/**
 * Hook to check capacity for dates in a calendar view
 * Optimized to reduce API calls:
 * - Uses session storage cache with 5-min TTL
 * - Only fetches dates not already cached
 * - Limits parallel requests to reduce CPU usage
 */
export function useCalendarCapacity(): UseCalendarCapacityResult {
  const [capacityMap, setCapacityMap] = useState<Map<string, CapacityResponse>>(() => {
    // Initialize from session cache
    const cache = getSessionCache();
    const now = Date.now();
    const map = new Map<string, CapacityResponse>();
    for (const [dateStr, cached] of Object.entries(cache)) {
      if (now - cached.timestamp < CACHE_TTL_MS) {
        map.set(dateStr, cached.data);
      }
    }
    return map;
  });
  const [isLoading, setIsLoading] = useState(false);
  const pendingRequests = useRef<Set<string>>(new Set());

  const formatDate = (date: Date): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0];
  };

  const getCapacityForDate = useCallback((date: Date): CapacityResponse | null => {
    const dateStr = formatDate(date);
    return capacityMap.get(dateStr) || null;
  }, [capacityMap]);

  const fetchSingleDate = async (dateStr: string): Promise<CapacityResponse> => {
    const response = await fetch(`/api/check-capacity?date=${dateStr}`);

    if (!response.ok) {
      if (import.meta.env.DEV) {
        const dayNum = parseInt(dateStr.split('-')[2]);
        const mockCount = dayNum % 3 === 0 ? 28 : dayNum % 5 === 0 ? 15 : 5;
        return {
          available: mockCount < 30,
          count: mockCount,
          limit: 30,
          remaining: 30 - mockCount,
          date: dateStr,
        };
      }
      throw new Error('Failed to check capacity');
    }

    return await response.json();
  };

  const checkSingleDateCapacity = useCallback(async (date: Date): Promise<CapacityResponse | null> => {
    const dateStr = formatDate(date);

    // Check memory cache first
    const cached = capacityMap.get(dateStr);
    if (cached) return cached;

    // Check session cache
    const sessionCache = getSessionCache();
    const sessionCached = sessionCache[dateStr];
    if (sessionCached && Date.now() - sessionCached.timestamp < CACHE_TTL_MS) {
      setCapacityMap(prev => new Map(prev).set(dateStr, sessionCached.data));
      return sessionCached.data;
    }

    // Avoid duplicate requests
    if (pendingRequests.current.has(dateStr)) return null;

    try {
      pendingRequests.current.add(dateStr);
      const data = await fetchSingleDate(dateStr);

      // Update both caches
      setCapacityMap(prev => new Map(prev).set(dateStr, data));
      const cache = getSessionCache();
      cache[dateStr] = { data, timestamp: Date.now() };
      setSessionCache(cache);

      return data;
    } catch (err) {
      console.error('Error checking capacity:', err);
      return null;
    } finally {
      pendingRequests.current.delete(dateStr);
    }
  }, [capacityMap]);

  const checkMonthCapacity = useCallback(async (month: Date) => {
    setIsLoading(true);

    try {
      const year = month.getFullYear();
      const monthNum = month.getMonth();

      // Reduced range: only 3 days before to 5 days after month
      const startDate = new Date(year, monthNum, -3);
      const endDate = new Date(year, monthNum + 1, 5);

      const datesToCheck: string[] = [];
      const currentDate = new Date(startDate);
      const minDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const sessionCache = getSessionCache();
      const now = Date.now();

      while (currentDate <= endDate) {
        if (currentDate >= minDate) {
          const dateStr = formatDate(currentDate);
          // Skip if already in memory cache or fresh session cache
          const inMemory = capacityMap.has(dateStr);
          const inSession = sessionCache[dateStr] && now - sessionCache[dateStr].timestamp < CACHE_TTL_MS;
          if (!inMemory && !inSession) {
            datesToCheck.push(dateStr);
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // If nothing to fetch, restore from session cache
      if (datesToCheck.length === 0) {
        setCapacityMap(prev => {
          const newMap = new Map(prev);
          for (const [dateStr, cached] of Object.entries(sessionCache)) {
            if (!newMap.has(dateStr) && now - cached.timestamp < CACHE_TTL_MS) {
              newMap.set(dateStr, cached.data);
            }
          }
          return newMap;
        });
        return;
      }

      // Limit concurrent requests to reduce CPU usage (max 10 at a time)
      const BATCH_SIZE = 10;
      const results: { dateStr: string; data: CapacityResponse }[] = [];

      for (let i = 0; i < datesToCheck.length; i += BATCH_SIZE) {
        const batch = datesToCheck.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (dateStr) => {
            try {
              const data = await fetchSingleDate(dateStr);
              return { dateStr, data };
            } catch {
              return null;
            }
          })
        );
        results.push(...batchResults.filter((r): r is { dateStr: string; data: CapacityResponse } => r !== null));
      }

      // Update memory cache
      setCapacityMap(prev => {
        const newMap = new Map(prev);
        results.forEach(({ dateStr, data }) => {
          newMap.set(dateStr, data);
        });
        return newMap;
      });

      // Update session cache
      const updatedCache = getSessionCache();
      results.forEach(({ dateStr, data }) => {
        updatedCache[dateStr] = { data, timestamp: now };
      });
      setSessionCache(updatedCache);
    } catch (error) {
      console.error('Error checking month capacity:', error);
    } finally {
      setIsLoading(false);
    }
  }, [capacityMap]);

  return {
    capacityMap,
    isLoading,
    checkMonthCapacity,
    getCapacityForDate,
    checkSingleDateCapacity,
  };
}
