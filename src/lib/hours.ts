import { HOURS } from "./clinic";
import { minutesOf, toDubai } from "./time";

/** "09:00" → "9:00" */
const short = (t: string) => t.replace(/^0/, "");

/** `label` for the top bar; `short` for the "Today" row of the hours table. */
export type OpenStatus = { open: boolean; label: string; short: string };

/** Whether the clinic is open right now in Dubai, as a short line for the top bar. */
export function openStatus(now = new Date()): OpenStatus {
  const { weekday, time } = toDubai(now);
  const today = HOURS[weekday];
  const minute = minutesOf(time);

  if (minute < minutesOf(today.open)) {
    return { open: false, label: `Opens today at ${short(today.open)}`, short: `Opens at ${short(today.open)}` };
  }
  if (minute < minutesOf(today.close)) {
    return { open: true, label: `Open today until ${short(today.close)}`, short: `Open until ${short(today.close)}` };
  }
  const tomorrow = HOURS[(weekday + 1) % 7];
  return {
    open: false,
    label: `Closed now · opens tomorrow at ${short(tomorrow.open)}`,
    short: `Closed, opens ${short(tomorrow.open)} tomorrow`,
  };
}
