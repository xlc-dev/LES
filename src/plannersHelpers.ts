import { unixToHour } from "./utils";

/**
 * Calculates the appliance duration bitmask based on duration and hour.
 *
 * @param {number} duration - The duration of the appliance in hours.
 * @param {number} hour - The starting hour (0-23) when the appliance is planned.
 * @returns {number} The calculated bitmask representing the appliance's planned duration.
 * @throws {Error} If duration or hour is out of valid range.
 */
function calculateApplianceDurationBit(duration: number, hour: number): number {
  if (hour < 0 || hour > 23) {
    throw new Error("Hour must be between 0 and 23.");
  }

  if (duration <= 0) {
    throw new Error("Duration must be a positive integer.");
  }

  const shift = 24 - hour - duration;
  const base = 2 ** duration - 1;

  if (shift >= 0) {
    return base << shift;
  } else {
    return base >> -shift;
  }
}

/**
 * Checks whether an appliance can be planned in at a certain time.
 *
 * This is done by retrieving the correct daily bitmap window and then
 * comparing that to the new planned-in time. Also, the existing planning
 * is checked against the newly planned-in time.
 *
 * @param {Appliance} appliance - The appliance to check.
 * @param {number} unix - The Unix timestamp representing the time to check (in seconds).
 * @param {number} applianceBitmapPlan - The current bitmap plan for the appliance.
 * @returns {boolean} Returns true if the appliance can be planned at the given time, otherwise false.
 */
export function checkApplianceTime(
  appliance: Appliance,
  unix: number,
  applianceBitmapPlan: number,
): boolean {
  const date = new Date(unix * 1000);
  const dayNumber = (date.getUTCDay() + 6) % 7; // Adjust Sunday (0) to match ApplianceDays.SUNDAY (6)

  const bitmapWindow = appliance.timeDaily.find(
    (w) => w.day === dayNumber,
  )?.bitmapWindow;

  if (bitmapWindow === undefined) {
    return false;
  }

  const hour = unixToHour(unix);
  const applianceDurationBit = (1 << appliance.duration) - 1;
  const shift = 24 - hour - appliance.duration;
  const currentTimeWindow =
    shift >= 0 ? applianceDurationBit << shift : applianceDurationBit >> -shift;

  if ((bitmapWindow & currentTimeWindow) !== currentTimeWindow) {
    return false;
  }

  if ((currentTimeWindow & applianceBitmapPlan) !== 0) {
    return false;
  }

  return true;
}

/**
 * Returns the updated bitmap window with the new energy usage.
 *
 * @param {number} hour - The hour of the day.
 * @param {number} duration - The duration of the appliance.
 * @param {number} bitmap - The bitmap representing the appliance's energy usage.
 *
 * @returns {number} The updated bitmap window.
 */
export function planEnergy(
  hour: number,
  duration: number,
  bitmap: number,
): number {
  const applianceDurationBit = calculateApplianceDurationBit(duration, hour);
  return applianceDurationBit | bitmap;
}
