import { ApplianceTypes, ApplianceDays, highestSetBit } from "./utils";

function generateRandomTimeWindow(bitmap: number): [number, number] {
  let startHour = Math.floor(Math.random() * 24);
  let endHour = Math.floor(Math.random() * (24 - startHour)) + startHour + 1;

  const existingBits = bitmap & ((1 << endHour) - 1);
  if (existingBits & ((1 << startHour) - 1)) {
    startHour = highestSetBit(existingBits) % 24;
  }

  return [startHour, endHour];
}

export function createTimeWindow(
  day: ApplianceDays,
  appliance_name: ApplianceTypes
): {
  day: ApplianceDays;
  bitmap_window: number;
  appliance_name: ApplianceTypes;
} {
  let bitmap = 0;

  // Stove has fixed time window from 5 PM to 8 PM
  if (appliance_name === ApplianceTypes.STOVE) {
    return { day, bitmap_window: 0b000000000000000011110000, appliance_name };
  }

  // Electric vehicle is restricted to 8 AM to 5 PM on weekdays
  if (
    appliance_name === ApplianceTypes.ELECTRIC_VEHICLE &&
    ![ApplianceDays.SATURDAY, ApplianceDays.SUNDAY].includes(day)
  ) {
    bitmap |= 0b111111111111111111111111 & ~(0b111111111111 << 8); // Restrict hours 8-5
  }

  // Random time window generation
  const numWindows = Math.floor(Math.random() * 100) + 1;
  const amount = numWindows < 90 ? 1 : numWindows < 99 ? 2 : 3;

  for (let i = 0; i < amount; i++) {
    let [startHour, endHour] = generateRandomTimeWindow(bitmap);
    const windowMask = ((1 << (endHour - startHour)) - 1) << startHour;
    bitmap |= windowMask;
  }

  return { day, bitmap_window: bitmap, appliance_name };
}

/**
 * Checks if a given hour is available in a 24-bit bitmap.
 * @param bitmap The 24-bit number representing availability (1 = available, 0 = not available).
 * @param hour The hour to check (0-23).
 * @returns True if the hour is available, false otherwise.
 */
export function isAvailable(bitmap: number, hour: number): boolean {
  return (bitmap & (1 << hour)) !== 0;
}

/**
 * Sets the availability of a given hour in a 24-bit bitmap.
 * @param bitmap The 24-bit number representing availability (1 = available, 0 = not available).
 * @param hour The hour to set (0-23).
 * @param isAvailable True to set the hour as available, false to set it as not available.
 * @returns The updated 24-bit bitmap.
 */
export function setAvailability(bitmap: number, hour: number, isAvailable: boolean): number {
  if (isAvailable) {
    return bitmap | (1 << hour); // Set the bit to 1 (available)
  } else {
    return bitmap & ~(1 << hour); // Set the bit to 0 (not available)
  }
}
