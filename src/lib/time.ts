import { CLINIC, HOURS } from "./clinic";

/**
 * Dubai time helpers. Dates are "YYYY-MM-DD" and times "HH:MM" in Dubai
 * local time; Dubai has no daylight saving, so the offset is always +04:00.
 */

const OFFSET_MINUTES = 4 * 60;

const pad = (n: number) => String(n).padStart(2, "0");

/** The Dubai calendar date and time for an instant. */
export function toDubai(d: Date) {
  const local = new Date(d.getTime() + OFFSET_MINUTES * 60_000);
  return {
    date: `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`,
    time: `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`,
    weekday: local.getUTCDay(),
  };
}

/** The instant for a Dubai local date and time. */
export const fromDubai = (date: string, time: string) =>
  new Date(`${date}T${time}:00${CLINIC.utcOffset}`);

/** Adds whole days to a "YYYY-MM-DD" date. */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const weekdayOf = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

export const minutesOf = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const timeOf = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Every 30-minute start time on a date where a treatment of `minutes` still ends by closing. */
export function slotTimes(date: string, minutes: number) {
  const hours = HOURS[weekdayOf(date)];
  const times: string[] = [];
  for (let t = minutesOf(hours.open); t + minutes <= minutesOf(hours.close); t += CLINIC.slotMinutes) {
    times.push(timeOf(t));
  }
  return times;
}
