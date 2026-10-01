import { DOCTORS, TREATMENTS } from "@/lib/clinic";
import { MAX_SEARCH_DAYS, freeSlots } from "@/lib/availability";
import { getStore } from "@/lib/store";
import { addDays, fromDubai, toDubai, weekdayOf } from "@/lib/time";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Today, 16:30", "Tomorrow, 10:00" or "Sat, 10:00". */
function label(date: string, time: string, today: string) {
  if (date === today) return `Today, ${time}`;
  if (date === addDays(today, 1)) return `Tomorrow, ${time}`;
  return `${DAYS[weekdayOf(date)]}, ${time}`;
}

/** Each dentist's next free appointment, for the "Next free" row on their card. */
export async function GET() {
  const store = getStore();
  if (!store) return Response.json({ error: "offline" }, { status: 503 });

  try {
    const now = new Date();
    const today = toDubai(now).date;
    const until = addDays(today, MAX_SEARCH_DAYS);
    const busy = await store.bookedBetween(fromDubai(today, "00:00"), fromDubai(until, "00:00"));

    const nextFree: Record<string, string | null> = {};
    for (const doctor of DOCTORS) {
      // Use the dentist's shortest own treatment as the unit of "free".
      const treatment = TREATMENTS.filter((t) => t.doctorId === doctor.id).sort((a, b) => a.minutes - b.minutes)[0];
      const slot = freeSlots({ treatment, dateFrom: today, dateTo: until, doctorId: doctor.id, busy, now })[0];
      nextFree[doctor.id] = slot ? label(slot.date, slot.time, today) : null;
    }
    return Response.json(nextFree, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
  } catch (error) {
    console.error("next-free failed", error);
    return Response.json({ error: "error" }, { status: 500 });
  }
}
