import { useState, useCallback } from 'react';
import type { CapacityResponse } from '../types';

interface UseCalendarCapacityResult {
  capacityMap: Map<string, CapacityResponse>;
  isLoading: boolean;
  checkMonthCapacity: (month: Date) => Promise<void>;
  getCapacityForDate: (date: Date) => CapacityResponse | null;
}

/**
 * Hook to check capacity for multiple dates in a calendar view
 * Optimized for fetching capacity data for an entire month
 */
export function useCalendarCapacity(): UseCalendarCapacityResult {
  const [capacityMap, setCapacityMap] = useState<Map<string, CapacityResponse>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date: Date): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0];
  };

  const getCapacityForDate = useCallback((date: Date): CapacityResponse | null => {
    const dateStr = formatDate(date);
    return capacityMap.get(dateStr) || null;
  }, [capacityMap]);

  const checkSingleDate = async (dateStr: string): Promise<CapacityResponse> => {
    try {
      const response = await fetch(`/api/check-capacity?date=${dateStr}`);

      if (!response.ok) {
        // In development, use mock data
        if (import.meta.env.DEV) {
          // Generate varied mock data for different dates
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
    } catch (err: any) {
      // Fallback to mock data in dev
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
      throw err;
    }
  };

  const checkMonthCapacity = useCallback(async (month: Date) => {
    setIsLoading(true);

    try {
      // Get all dates in the month (plus a few days before/after for calendar view)
      const year = month.getFullYear();
      const monthNum = month.getMonth();

      // Start from a few days before the month
      const startDate = new Date(year, monthNum, -5);
      const endDate = new Date(year, monthNum + 1, 10);

      const datesToCheck: string[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        // Only check dates at least 48 hours in the future
        const minDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
        if (currentDate >= minDate) {
          datesToCheck.push(formatDate(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Check capacity for all dates (in parallel for better performance)
      const results = await Promise.all(
        datesToCheck.map(async (dateStr) => {
          const data = await checkSingleDate(dateStr);
          return { dateStr, data };
        })
      );

      // Update the map with new results
      setCapacityMap(prev => {
        const newMap = new Map(prev);
        results.forEach(({ dateStr, data }) => {
          // Only add if not already in cache
          if (!newMap.has(dateStr)) {
            newMap.set(dateStr, data);
          }
        });
        return newMap;
      });
    } catch (error) {
      console.error('Error checking month capacity:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove capacityMap from dependencies to prevent infinite loop

  return {
    capacityMap,
    isLoading,
    checkMonthCapacity,
    getCapacityForDate,
  };
}
