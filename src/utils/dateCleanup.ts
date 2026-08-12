import { OrderItem, StoreSpecial } from '../types';

/**
 * Checks if a date string is invalid or expired (i.e. prior to today).
 * Supports YYYY-MM-DD and standard ISO date formats.
 */
export const isDateExpiredOrInvalid = (dateStr?: string): boolean => {
  if (!dateStr || !dateStr.trim()) return false;

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return true; // Malformed or invalid date format

  // Get current date at start of day (00:00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Consider end of the given promo date (23:59:59)
  const promoEndDate = new Date(parsed);
  promoEndDate.setHours(23, 59, 59, 999);

  return promoEndDate < today;
};

/**
 * Automatically cleans up invalid or expired promotion end dates.
 * - For Order Items: removes/clears the `endingDate` if it is expired or malformed.
 * - For Store Specials: marks specials as 'expired' or removes invalid end dates if past.
 */
export const cleanupExpiredAndInvalidDates = (
  orderList: OrderItem[],
  specials: StoreSpecial[]
): {
  cleanedOrderList: OrderItem[];
  cleanedSpecials: StoreSpecial[];
  removedOrderDatesCount: number;
  expiredSpecialsCount: number;
} => {
  let removedOrderDatesCount = 0;
  let expiredSpecialsCount = 0;

  const cleanedOrderList = orderList.map((item) => {
    if (item.endingDate && isDateExpiredOrInvalid(item.endingDate)) {
      removedOrderDatesCount++;
      return {
        ...item,
        endingDate: undefined, // Automatically remove invalid/expired promotion end date
      };
    }
    return item;
  });

  const cleanedSpecials = specials.map((special) => {
    const isExpired = isDateExpiredOrInvalid(special.validUntil);
    if (isExpired && special.status !== 'expired') {
      expiredSpecialsCount++;
      return {
        ...special,
        status: 'expired' as const, // Auto-mark expired specials
      };
    }
    return special;
  });

  return {
    cleanedOrderList,
    cleanedSpecials,
    removedOrderDatesCount,
    expiredSpecialsCount,
  };
};
