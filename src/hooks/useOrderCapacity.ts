import { useState, useCallback } from 'react';
import type { CapacityResponse } from '../types';

interface UseOrderCapacityResult {
  capacity: CapacityResponse | null;
  isLoading: boolean;
  error: string | null;
  checkCapacity: (date: Date | null) => Promise<void>;
}

/**
 * Hook to check order capacity for a specific date
 * Debounces requests and caches results
 */
export function useOrderCapacity(): UseOrderCapacityResult {
  const [capacity, setCapacity] = useState<CapacityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, CapacityResponse>>(new Map());

  const checkCapacity = useCallback(async (date: Date | null) => {
    if (!date) {
      setCapacity(null);
      setError(null);
      return;
    }

    // Convert to Date object if it's not already
    const dateObj = date instanceof Date ? date : new Date(date);

    // Format date as YYYY-MM-DD
    const dateStr = dateObj.toISOString().split('T')[0];

    console.log('🗓️ Formatted date:', dateStr);

    // Check cache first
    if (cache.has(dateStr)) {
      setCapacity(cache.get(dateStr)!);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/check-capacity?date=${dateStr}`);

      if (!response.ok) {
        // In development, if API route doesn't work, use mock data
        if (import.meta.env.DEV) {
          console.warn('⚠️ API route not available in dev mode, using mock data');
          // Mock: All dates available with 15 spots remaining
          const mockData: CapacityResponse = {
            available: true,
            count: 15,
            limit: 30,
            remaining: 15,
            date: dateStr,
          };
          setCache(prev => new Map(prev).set(dateStr, mockData));
          setCapacity(mockData);
          setIsLoading(false);
          return;
        }

        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check capacity');
      }

      const data: CapacityResponse = await response.json();

      // Cache the result
      setCache(prev => new Map(prev).set(dateStr, data));
      setCapacity(data);
    } catch (err: any) {
      console.error('Error checking capacity:', err);

      // In development, fall back to mock data
      if (import.meta.env.DEV) {
        console.warn('⚠️ Using mock capacity data for development');
        const mockData: CapacityResponse = {
          available: true,
          count: 15,
          limit: 30,
          remaining: 15,
          date: dateStr,
        };
        setCache(prev => new Map(prev).set(dateStr, mockData));
        setCapacity(mockData);
      } else {
        setError(err.message || 'Failed to check capacity');
        setCapacity(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cache]);

  return {
    capacity,
    isLoading,
    error,
    checkCapacity,
  };
}
