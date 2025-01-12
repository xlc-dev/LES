import { ApplianceTypes, ApplianceDays, ensureValidBitmap } from "./utils";

/**
 * Generates a random time window within a 24-hour period, ensuring no overlap with existing availability.
 *
 * @param {number} bitmap - The current availability bitmap.
 * @returns {[number, number]} A tuple containing the start and end hours of the generated time window.
 */
function generateRandomTimeWindow(bitmap: number): [number, number] {
  const windowLength = 2 + Math.floor(Math.random() * 6);

  for (let attempt = 0; attempt < 10; attempt++) {
    const startHour = Math.floor(Math.random() * (24 - windowLength));
    const endHour = startHour + windowLength;

    let hasOverlap = false;
    for (let h = startHour; h < endHour; h++) {
      if ((bitmap & (1 << h)) !== 0) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) {
      return [startHour, endHour];
    }
  }

  for (let h = 0; h < 24 - windowLength; h++) {
    if ((bitmap & (1 << h)) === 0) {
      return [h, h + windowLength];
    }
  }

  throw new Error("No available time window found");
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
    return 0x0f0000; // 000000000000000011110000
  }

  if (
    applianceName === ApplianceTypes.ELECTRIC_VEHICLE &&
    ![ApplianceDays.SATURDAY, ApplianceDays.SUNDAY].includes(day)
  ) {
    bitmap = 0xffffff & ~(0xfff << 8);
    return bitmap;
  }

  const numWindows = Math.random() * 100;
  const amount = numWindows < 90 ? 1 : numWindows < 99 ? 2 : 3;

  for (let i = 0; i < amount; i++) {
    const [startHour, endHour] = generateRandomTimeWindow(bitmap);
    const windowMask = ((1 << (endHour - startHour)) - 1) << startHour;
    bitmap |= ensureValidBitmap(windowMask);
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
  if (hour < 0 || hour > 23) {
    throw new Error("Hour must be between 0 and 23.");
  }
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
    return ensureValidBitmap(bitmap | (1 << hour));
  } else {
    return ensureValidBitmap(bitmap & ~(1 << hour));
  }
}
