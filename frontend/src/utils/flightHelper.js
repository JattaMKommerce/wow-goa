/**
 * Utility functions for flight calculation and formatting.
 */

/**
 * Calculates human-readable duration between departure and arrival times (HH:MM).
 * Handles overnight / next-day arrivals automatically.
 * 
 * @param {string} depTime - Departure time in "HH:MM"
 * @param {string} arrTime - Arrival time in "HH:MM"
 * @returns {string} Formatted duration, e.g. "1h 02m", "2h 30m", or ""
 */
export function calculateFlightDuration(depTime, arrTime) {
  if (!depTime || !arrTime) return '';
  const depParts = String(depTime).split(':').map(Number);
  const arrParts = String(arrTime).split(':').map(Number);
  if (depParts.length < 2 || arrParts.length < 2) return '';
  const [depH, depM] = depParts;
  const [arrH, arrM] = arrParts;
  if (isNaN(depH) || isNaN(depM) || isNaN(arrH) || isNaN(arrM)) return '';

  let startTotal = depH * 60 + depM;
  let endTotal = arrH * 60 + arrM;

  // Next day arrival (overnight crossing e.g. 23:30 -> 02:00)
  if (endTotal < startTotal) {
    endTotal += 24 * 60;
  }

  const diffMinutes = endTotal - startTotal;
  if (diffMinutes === 0) return '0m';

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h 00m`;
  } else {
    return `${minutes}m`;
  }
}
