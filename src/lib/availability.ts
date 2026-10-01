import {
  CLINIC,
  DOCTORS,
  EMERGENCY_HOLDS,
  type Doctor,
  type DoctorId,
  type Treatment,
} from "./clinic";
import { addDays, fromDubai, slotTimes, toDubai, weekdayOf } from "./time";

/** The part of a booking that matters for availability. */
export type Busy = { doctor_id: string; starts_at: string; ends_at: string };

export type TimeOfDay = "morning" | "afternoon" | "evening";

export type SlotState = "free" | "taken" | "held" | "past";
export type DaySlot = { time: string; startsAt: string; state: SlotState };

export type FreeSlot = { doctorId: DoctorId; date: string; time: string; startsAt: string };

const MIN = 60_000;
/** Don't offer a slot that starts in the next few minutes. */
const LEAD_MINUTES = 15;
/** How far ahead Noor will look in one search. */
export const MAX_SEARCH_DAYS = 14;

const inPartOfDay = (time: string, part?: TimeOfDay) => {
  if (!part) return true;
  if (part === "morning") return time < "12:00";
  if (part === "afternoon") return time >= "12:00" && time < "17:00";
  return time >= "17:00";
};

/** The doctors who can perform a treatment (any doctor for emergencies). */
export function doctorsFor(treatment: Treatment, only?: DoctorId): Doctor[] {
  const eligible = treatment.doctorId ? DOCTORS.filter((d) => d.id === treatment.doctorId) : DOCTORS;
  return only ? eligible.filter((d) => d.id === only) : eligible;
}

/**
 * Every start time on one day for one doctor, marked free, taken (booked),
 * held (reserved for emergencies) or past. Empty when the doctor isn't in.
 */
export function dayGrid(
  date: string,
  doctor: Doctor,
  treatment: Treatment,
  busy: Busy[],
  now = new Date(),
): DaySlot[] {
  const weekday = weekdayOf(date);
  if (!doctor.workingDays.includes(weekday)) return [];

  const length = treatment.minutes * MIN;
  const earliest = now.getTime() + LEAD_MINUTES * MIN;
  const holds = EMERGENCY_HOLDS[weekday].map((h) => fromDubai(date, h).getTime());
  const taken = busy
    .filter((b) => b.doctor_id === doctor.id)
    .map((b) => [new Date(b.starts_at).getTime(), new Date(b.ends_at).getTime()] as const);

  return slotTimes(date, treatment.minutes).map((time) => {
    const start = fromDubai(date, time);
    const s = start.getTime();
    const e = s + length;
    let state: SlotState = "free";
    if (s < earliest) state = "past";
    else if (taken.some(([bs, be]) => s < be && e > bs)) state = "taken";
    // Emergency windows are only bookable for emergency visits.
    else if (treatment.id !== "emergency" && holds.some((h) => s < h + CLINIC.slotMinutes * MIN && e > h)) state = "held";
    return { time, startsAt: start.toISOString(), state };
  });
}

type Search = {
  treatment: Treatment;
  dateFrom: string;
  dateTo: string;
  timeOfDay?: TimeOfDay;
  doctorId?: DoctorId;
  busy: Busy[];
  now?: Date;
};

/** Free slots in date order, then time, then the clinic's doctor order. */
export function freeSlots({ treatment, dateFrom, dateTo, timeOfDay, doctorId, busy, now = new Date() }: Search): FreeSlot[] {
  const today = toDubai(now).date;
  const from = dateFrom < today ? today : dateFrom;
  const last = addDays(from, MAX_SEARCH_DAYS - 1);
  const to = dateTo > last ? last : dateTo;

  const out: FreeSlot[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const seen = new Set<string>();
    const day: FreeSlot[] = [];
    for (const doctor of doctorsFor(treatment, doctorId)) {
      for (const slot of dayGrid(date, doctor, treatment, busy, now)) {
        if (slot.state !== "free" || !inPartOfDay(slot.time, timeOfDay)) continue;
        // Emergencies: one entry per time is enough, whichever doctor is free first.
        if (!treatment.doctorId && seen.has(slot.time)) continue;
        seen.add(slot.time);
        day.push({ doctorId: doctor.id, date, time: slot.time, startsAt: slot.startsAt });
      }
    }
    out.push(...day.sort((a, b) => a.time.localeCompare(b.time)));
  }
  return out;
}

/** Whether one exact start time is bookable right now. */
export function isFree(treatment: Treatment, doctor: Doctor, startsAt: Date, busy: Busy[], now = new Date()) {
  const { date } = toDubai(startsAt);
  return dayGrid(date, doctor, treatment, busy, now).some(
    (s) => s.state === "free" && s.startsAt === startsAt.toISOString(),
  );
}
