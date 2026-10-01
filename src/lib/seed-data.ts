import {
  CLINIC,
  DOCTORS,
  EMERGENCY_HOLDS,
  TREATMENTS,
  type DoctorId,
  type TreatmentId,
} from "./clinic";
import { addDays, fromDubai, minutesOf, slotTimes, toDubai, weekdayOf } from "./time";

export type SeedBooking = {
  reference: string;
  patient_name: string;
  phone: string;
  treatment_id: TreatmentId;
  doctor_id: DoctorId;
  starts_at: string;
  ends_at: string;
  status: "booked";
  source: "noor" | "staff";
  created_at: string;
};

/** The booking test 6 cancels. Its phone number confirms the cancellation. */
export const DEMO_BOOKING = {
  reference: "OR-4821",
  patient_name: "Layla Nasser",
  phone: "+971 50 000 4821",
};

const NAMES = [
  "Omar Khalid", "Priya Nair", "Hannah Weber", "Yusuf Rahman", "Mariam Saeed",
  "Daniel Costa", "Aisha Karim", "Leo Martin", "Rahul Shah", "Noura Salem",
  "James Carter", "Mei Lin", "Tariq Aziz", "Chloe Dubois",
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Span = { doctor: DoctorId; start: number; end: number };

/**
 * About 15 believable bookings across the next 7 days, all inside doctor
 * working days and opening hours, never overlapping, never on an emergency hold.
 */
export function buildSeedBookings(now = new Date()): SeedBooking[] {
  const rand = mulberry32(2026);
  const today = toDubai(now);
  const taken: Span[] = [];
  const bookings: SeedBooking[] = [];
  const refs = new Set([DEMO_BOOKING.reference]);

  const clashes = (date: string, time: string, minutes: number, doctor: DoctorId) => {
    const start = fromDubai(date, time).getTime();
    const end = start + minutes * 60_000;
    const holds = EMERGENCY_HOLDS[weekdayOf(date)].map((h) => fromDubai(date, h).getTime());
    return (
      taken.some((s) => s.doctor === doctor && start < s.end && end > s.start) ||
      holds.some((h) => start < h + CLINIC.slotMinutes * 60_000 && end > h)
    );
  };

  const add = (
    date: string,
    time: string,
    treatmentId: TreatmentId,
    patient: { name: string; phone: string; reference?: string },
    source: "noor" | "staff",
  ) => {
    const t = TREATMENTS.find((x) => x.id === treatmentId)!;
    const doctor = t.doctorId!;
    const starts = fromDubai(date, time);
    const ends = new Date(starts.getTime() + t.minutes * 60_000);
    let reference = patient.reference;
    while (!reference || (refs.has(reference) && !patient.reference)) {
      reference = `OR-${1000 + Math.floor(rand() * 9000)}`;
    }
    refs.add(reference);
    taken.push({ doctor, start: starts.getTime(), end: ends.getTime() });
    bookings.push({
      reference,
      patient_name: patient.name,
      phone: patient.phone,
      treatment_id: treatmentId,
      doctor_id: doctor,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      status: "booked",
      source,
      created_at: new Date(now.getTime() - Math.floor(1 + rand() * 72) * 3_600_000).toISOString(),
    });
  };

  // OR-4821: a cleaning with Dr. Sara at 11:00 on her next working day, two or more days out.
  const sara = DOCTORS.find((d) => d.id === "sara-haddad")!;
  let demoDate = addDays(today.date, 2);
  while (!sara.workingDays.includes(weekdayOf(demoDate))) demoDate = addDays(demoDate, 1);
  add(demoDate, "11:00", "cleaning", { name: DEMO_BOOKING.patient_name, phone: DEMO_BOOKING.phone, reference: DEMO_BOOKING.reference }, "staff");

  // Test 1 asks for Saturday afternoon: take one of Dr. Sara's afternoon slots
  // (and one in the evening) so the times Noor offers visibly skip booked ones.
  let saturday = addDays(today.date, 1);
  while (weekdayOf(saturday) !== 6) saturday = addDays(saturday, 1);
  add(saturday, "14:00", "cleaning", { name: "Sami Farouk", phone: "+971 50 000 1400" }, "staff");
  add(saturday, "18:00", "filling", { name: "Grace Okafor", phone: "+971 50 000 1800" }, "noor");

  const routine = TREATMENTS.filter((t) => t.doctorId);
  let tries = 0;
  while (bookings.length < 15 && tries++ < 500) {
    const date = addDays(today.date, Math.floor(rand() * 7));
    const t = routine[Math.floor(rand() * routine.length)];
    const doctor = DOCTORS.find((d) => d.id === t.doctorId)!;
    if (!doctor.workingDays.includes(weekdayOf(date))) continue;
    const times = slotTimes(date, t.minutes);
    const time = times[Math.floor(rand() * times.length)];
    // Nothing in the past today: leave at least an hour from now.
    if (date === today.date && minutesOf(time) < minutesOf(today.time) + 60) continue;
    if (clashes(date, time, t.minutes, doctor.id)) continue;
    const i = bookings.length - 1;
    add(
      date,
      time,
      t.id,
      { name: NAMES[i % NAMES.length], phone: `+971 50 000 ${String(1000 + i * 137).slice(-4)}` },
      rand() < 0.4 ? "noor" : "staff",
    );
  }

  return bookings.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}
