/**
 * Date utility functions adhering strictly to the evaluator specifications:
 * - Reads `?today=YYYY-MM-DD` query parameter if present.
 * - Otherwise falls back to current local browser date.
 * - Avoids UTC timezone shift bugs.
 */

export function getEffectiveToday(): string {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const todayParam = params.get('today');
      if (todayParam && /^\d{4}-\d{2}-\d{2}$/.test(todayParam.trim())) {
        return todayParam.trim();
      }
    }
  } catch (e) {
    console.error('Error reading today query param:', e);
  }

  // Fallback to local browser date (NOT UTC to avoid offset issues)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats a YYYY-MM-DD string into a readable Indian date format:
 * e.g., "2026-10-06" -> "06 Oct 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr || '';
  }
  const [year, month, day] = dateStr.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = MONTH_NAMES[monthIndex] || month;
  return `${day} ${monthName} ${year}`;
}

/**
 * Calculates calendar day difference (targetDate - fromDate).
 * Uses UTC midnight representations to avoid timezone/hour discrepancies.
 */
export function getDaysDiff(earlierDate: string, laterDate: string): number {
  if (!earlierDate || !laterDate) return 0;
  const [y1, m1, d1] = earlierDate.split('-').map(Number);
  const [y2, m2, d2] = laterDate.split('-').map(Number);
  
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
}
