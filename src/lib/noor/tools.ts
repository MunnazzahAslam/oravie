import { tool } from "ai";
import { z } from "zod";
import { CLINIC, DOCTORS, TREATMENTS, doctorById, treatmentById, type DoctorId, type TreatmentId } from "../clinic";
import { dayGrid, doctorsFor, freeSlots, isFree } from "../availability";
import { getStore, type BookingRow } from "../store";
import { addDays, fromDubai, toDubai } from "../time";
import type { BookResult, BookingCard, CancelResult, FindResult, SlotGroup, SlotsResult } from "./tool-types";

const TREATMENT_IDS = TREATMENTS.map((t) => t.id) as [TreatmentId, ...TreatmentId[]];
const DOCTOR_IDS = DOCTORS.map((d) => d.id) as [DoctorId, ...DoctorId[]];
const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

/** Noor offers at most this many times at once. */
const MAX_SLOTS = 6;
const HOUR = 3_600_000;

const dateLabel = new Intl.DateTimeFormat("en-GB", {
  timeZone: CLINIC.timeZone,
  weekday: "long",
  day: "numeric",
  month: "long",
});

function toCard(row: BookingRow): BookingCard {
  const starts = new Date(row.starts_at);
  const treatment = treatmentById(row.treatment_id);
  return {
    reference: row.reference,
    treatmentName: treatment.name,
    doctorName: doctorById(row.doctor_id).name,
    dateLabel: dateLabel.format(starts),
    time: toDubai(starts).time,
    minutes: treatment.minutes,
    status: row.status,
  };
}

/** "or 4821", "OR-4821" and "4821" all mean OR-4821. */
const normaliseReference = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 4 ? `OR-${digits}` : raw.trim().toUpperCase();
};

/** Phones match when their last 9 digits agree, so +971 50… and 050… are the same. */
const samePhone = (a: string, b: string) => {
  const tail = (s: string) => s.replace(/\D/g, "").slice(-9);
  return tail(a).length >= 7 && tail(a) === tail(b);
};

const newReference = () => `OR-${1000 + Math.floor(Math.random() * 9000)}`;

const offline = { ok: false as const, reason: "offline" as const, clinicPhone: CLINIC.phone };
const failed = { ok: false as const, reason: "error" as const, clinicPhone: CLINIC.phone };

export const noorTools = {
  get_available_slots: tool({
    description:
      "Find free appointment times for a treatment. Returns at most 6 times, which the website shows as buttons. Use treatment 'emergency' for pain or damage.",
    inputSchema: z.object({
      treatment: z.enum(TREATMENT_IDS),
      date_from: DATE.describe("First day to search, Dubai date"),
      date_to: DATE.describe("Last day to search, Dubai date. Same as date_from for a single day."),
      time_of_day: z.enum(["morning", "afternoon", "evening"]).optional().describe("morning: before 12:00; afternoon: 12:00 to 17:00; evening: from 17:00"),
      doctor: z.enum(DOCTOR_IDS).optional(),
    }),
    execute: async ({ treatment: treatmentId, date_from, date_to, time_of_day, doctor }): Promise<SlotsResult> => {
      const store = getStore();
      if (!store) return offline;
      try {
        const treatment = treatmentById(treatmentId);
        const now = new Date();
        const to = date_to < date_from ? date_from : date_to;
        const busy = await store.bookedBetween(fromDubai(date_from, "00:00"), fromDubai(addDays(to, 1), "00:00"));
        const free = freeSlots({ treatment, dateFrom: date_from, dateTo: to, timeOfDay: time_of_day, doctorId: doctor, busy, now }).slice(0, treatment.id === "emergency" ? 3 : MAX_SLOTS);
        if (free.length === 0) return { ok: false, reason: "none_free", clinicPhone: CLINIC.phone };

        // Group the offered times by day and doctor, and note booked times in between.
        const groups: SlotGroup[] = [];
        for (const slot of free) {
          let group = groups.find((g) => g.date === slot.date && g.doctorId === slot.doctorId);
          if (!group) {
            group = {
              date: slot.date,
              dateLabel: dateLabel.format(new Date(slot.startsAt)),
              doctorId: slot.doctorId,
              doctorName: doctorById(slot.doctorId).name,
              slots: [],
              taken: [],
            };
            groups.push(group);
          }
          group.slots.push({ time: slot.time, startsAt: slot.startsAt });
        }
        for (const group of groups) {
          const first = group.slots[0].time;
          const last = group.slots[group.slots.length - 1].time;
          group.taken = dayGrid(group.date, doctorById(group.doctorId as DoctorId), treatment, busy, now)
            .filter((s) => s.state === "taken" && s.time > first && s.time < last)
            .map((s) => s.time);
        }

        return {
          ok: true,
          treatmentId: treatment.id,
          treatmentName: treatment.name,
          minutes: treatment.minutes,
          fromPriceAed: treatment.fromPriceAed,
          emergency: treatment.id === "emergency",
          groups,
          clinicPhone: CLINIC.phone,
        };
      } catch (error) {
        console.error("get_available_slots failed", error);
        return failed;
      }
    },
  }),

  book_appointment: tool({
    description:
      "Book one appointment. starts_at must be a startsAt value returned by get_available_slots. Needs the patient's name and phone.",
    inputSchema: z.object({
      treatment: z.enum(TREATMENT_IDS),
      doctor: z.enum(DOCTOR_IDS),
      starts_at: z.string().describe("Exact startsAt from get_available_slots (ISO 8601)"),
      patient_name: z.string().min(2).max(80),
      phone: z.string().min(7).max(20),
    }),
    execute: async ({ treatment: treatmentId, doctor: doctorId, starts_at, patient_name, phone }): Promise<BookResult> => {
      const store = getStore();
      if (!store) return offline;
      try {
        const treatment = treatmentById(treatmentId);
        const doctor = doctorsFor(treatment, doctorId)[0];
        const starts = new Date(starts_at);
        if (!doctor || Number.isNaN(starts.getTime())) return { ok: false, reason: "invalid_slot", clinicPhone: CLINIC.phone };

        // Re-check right before writing: someone may have taken it since it was offered.
        const { date } = toDubai(starts);
        const busy = await store.bookedBetween(fromDubai(date, "00:00"), fromDubai(addDays(date, 1), "00:00"));
        if (!isFree(treatment, doctor, starts, busy)) {
          const stillOpen = dayGrid(date, doctor, treatment, busy).some((s) => s.startsAt === starts.toISOString());
          return { ok: false, reason: stillOpen ? "slot_taken" : "invalid_slot", clinicPhone: CLINIC.phone };
        }

        const booking = {
          patient_name: patient_name.trim(),
          phone: phone.trim(),
          treatment_id: treatment.id,
          doctor_id: doctor.id,
          starts_at: starts.toISOString(),
          ends_at: new Date(starts.getTime() + treatment.minutes * 60_000).toISOString(),
          source: "noor" as const,
        };
        // The database has the final say on clashes; retry only on a reference collision.
        for (let attempt = 0; attempt < 5; attempt++) {
          const result = await store.insert({ ...booking, reference: newReference() });
          if (result.ok) return { ok: true, booking: toCard(result.row) };
          if (result.reason === "slot_taken") return { ok: false, reason: "slot_taken", clinicPhone: CLINIC.phone };
          if (result.reason === "error") return failed;
        }
        return failed;
      } catch (error) {
        console.error("book_appointment failed", error);
        return failed;
      }
    },
  }),

  find_booking: tool({
    description: "Look up a booking. Needs the reference (like OR-4821) and the phone number it was booked with.",
    inputSchema: z.object({ reference: z.string().min(4).max(12), phone: z.string().min(7).max(20) }),
    execute: async ({ reference, phone }): Promise<FindResult> => {
      const store = getStore();
      if (!store) return offline;
      try {
        const row = await store.byReference(normaliseReference(reference));
        // A wrong phone looks the same as a missing booking: don't confirm references to strangers.
        if (!row || !samePhone(row.phone, phone)) return { ok: false, reason: "not_found", clinicPhone: CLINIC.phone };
        return { ok: true, booking: toCard(row) };
      } catch (error) {
        console.error("find_booking failed", error);
        return failed;
      }
    },
  }),

  cancel_booking: tool({
    description: "Cancel a booking and free its slot. Needs the reference and the phone number it was booked with.",
    inputSchema: z.object({ reference: z.string().min(4).max(12), phone: z.string().min(7).max(20) }),
    execute: async ({ reference, phone }): Promise<CancelResult> => {
      const store = getStore();
      if (!store) return offline;
      try {
        const ref = normaliseReference(reference);
        const row = await store.byReference(ref);
        if (!row || !samePhone(row.phone, phone)) return { ok: false, reason: "not_found", clinicPhone: CLINIC.phone };
        if (row.status === "cancelled") return { ok: false, reason: "already_cancelled", clinicPhone: CLINIC.phone };
        const cancelled = await store.cancel(ref);
        if (!cancelled) return { ok: false, reason: "already_cancelled", clinicPhone: CLINIC.phone };
        return {
          ok: true,
          booking: toCard(cancelled),
          within24Hours: new Date(cancelled.starts_at).getTime() - Date.now() < 24 * HOUR,
        };
      } catch (error) {
        console.error("cancel_booking failed", error);
        return failed;
      }
    },
  }),
};
