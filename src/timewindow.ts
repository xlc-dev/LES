import { ApplianceTypes, ApplianceDays } from "./utils";

/**
 * Generates a random time window within a 24-hour period, ensuring no overlap with existing availability.
 *
 * @param {number} bitmap - The current availability bitmap.
 * @returns {[number, number]} A tuple containing the start and end hours of the generated time window.
 */
function generateRandomTimeWindow(bitmap: number): [number, number] {
  // Generate longer windows (2-8 hours)
  let startHour = Math.floor(Math.random() * 24);
  let windowLength = 2 + Math.floor(Math.random() * 6);
  let endHour = Math.min(24, startHour + windowLength);

  // If overlap found, try a different time slot
  const existingBits = bitmap & ((1 << endHour) - 1);
  if (existingBits & ((1 << startHour) - 1)) {
    // Find a free slot
    for (let hour = 0; hour < 24; hour++) {
      if (!(bitmap & (1 << hour))) {
        startHour = hour;
        endHour = Math.min(24, startHour + windowLength);
        break;
      }
    }
  }

  return [startHour, endHour];
}

/**
 * Creates a time window for a specific appliance on a given day.
 *
 * @param {ApplianceDays} day - The day of the week.
 * @param {ApplianceTypes} applianceName - The type of appliance.
 * @returns {number} bitmap - The bitmap for the time window.
 */
export function createTimeWindow(day: ApplianceDays, applianceName: ApplianceTypes): number {
  let bitmap = 0;

  if (applianceName === ApplianceTypes.STOVE) {
    return 0b000000000000000011110000;
  }

  if (
    applianceName === ApplianceTypes.ELECTRIC_VEHICLE &&
    ![ApplianceDays.SATURDAY, ApplianceDays.SUNDAY].includes(day)
  ) {
    const restricted_hours = 0b111111111111111111111111 & ~(0b111111111111 << 8);
    bitmap |= restricted_hours;
  }

  const num_windows = Math.floor(Math.random() * 100);
  const amount = num_windows < 90 ? 1 : num_windows < 99 ? 2 : 3;

  for (let i = 0; i < amount; i++) {
    const [startHour, endHour] = generateRandomTimeWindow(bitmap);
    const window_mask = (((1 << (endHour - startHour)) - 1) << startHour) & 0xffffff;
    bitmap |= window_mask;
  }

  return bitmap;
}

/**
 * Checks if a given hour is available in a 24-bit bitmap.
 *
 * @param {number} bitmap - The 24-bit number representing availability (1 = available, 0 = not available).
 * @param {number} hour - The hour to check (0-23).
 * @returns {boolean} True if the hour is available, false otherwise.
 */
export function isAvailable(bitmap: number, hour: number): boolean {
  return (bitmap & (1 << hour)) !== 0;
}

/**
 * Sets the availability of a given hour in a 24-bit bitmap.
 *
 * @param {number} bitmap - The 24-bit number representing availability (1 = available, 0 = not available).
 * @param {number} hour - The hour to set (0-23).
 * @param {boolean} isAvailable - True to set the hour as available, false to set it as not available.
 * @returns {number} The updated 24-bit bitmap.
 */
export function setAvailability(bitmap: number, hour: number, isAvailable: boolean): number {
  if (isAvailable) {
    return bitmap | (1 << hour); // Set the bit to 1 (available)
  } else {
    return bitmap & ~(1 << hour); // Set the bit to 0 (not available)
  }
}
