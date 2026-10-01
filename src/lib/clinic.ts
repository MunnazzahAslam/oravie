/**
 * Structured clinic data for the website, the database seed and the booking
 * tools. Noor's answers come from knowledge.md; keep the two in step.
 */

export const CLINIC = {
  name: "Oravie Dental Studio",
  phone: "+971 4 000 0000", // placeholder, never a real number
  address: "Jumeirah 1, Dubai",
  parking: "Free parking behind the clinic",
  timeZone: "Asia/Dubai",
  /** Dubai has no daylight saving, so a fixed offset is exact. */
  utcOffset: "+04:00",
  slotMinutes: 30,
};

/** Day numbers follow JavaScript: 0 = Sunday … 6 = Saturday. */
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Opening hours per weekday, as "HH:MM". */
export const HOURS: Record<number, { open: string; close: string }> = {
  0: { open: "10:00", close: "18:00" },
  1: { open: "09:00", close: "21:00" },
  2: { open: "09:00", close: "21:00" },
  3: { open: "09:00", close: "21:00" },
  4: { open: "09:00", close: "21:00" },
  5: { open: "09:00", close: "21:00" },
  6: { open: "09:00", close: "21:00" },
};

/**
 * Same-day emergency slots "kept free every day": these 30-minute windows are
 * never offered for routine treatments, only for emergency visits.
 */
export const EMERGENCY_HOLDS: Record<number, string[]> = {
  0: ["12:00", "15:00"],
  1: ["12:00", "17:00"],
  2: ["12:00", "17:00"],
  3: ["12:00", "17:00"],
  4: ["12:00", "17:00"],
  5: ["12:00", "17:00"],
  6: ["12:00", "17:00"],
};

export type DoctorId = "sara-haddad" | "arjun-mehta" | "elena-rossi";

export type Doctor = {
  id: DoctorId;
  name: string;
  initials: string;
  specialty: string;
  languages: string[];
  workingDays: number[];
  workingDaysLabel: string;
  /** Compact form for the dentist cards, e.g. "Mon, Wed, Sat". */
  inClinic: string;
};

export const DOCTORS: Doctor[] = [
  {
    id: "sara-haddad",
    name: "Dr. Sara Haddad",
    initials: "SH",
    specialty: "General and cosmetic dentistry",
    languages: ["English", "Arabic"],
    workingDays: [1, 2, 3, 4, 5, 6],
    workingDaysLabel: "Monday to Saturday",
    inClinic: "Monday to Saturday",
  },
  {
    id: "arjun-mehta",
    name: "Dr. Arjun Mehta",
    initials: "AM",
    specialty: "Root canal specialist",
    languages: ["English", "Hindi"],
    workingDays: [1, 3, 6],
    workingDaysLabel: "Monday, Wednesday, Saturday",
    inClinic: "Mon, Wed, Sat",
  },
  {
    id: "elena-rossi",
    name: "Dr. Elena Rossi",
    initials: "ER",
    specialty: "Orthodontics and aligners",
    languages: ["English", "Italian"],
    workingDays: [0, 2, 4],
    workingDaysLabel: "Tuesday, Thursday, Sunday",
    inClinic: "Tue, Thu, Sun",
  },
];

export type TreatmentId =
  | "cleaning"
  | "whitening"
  | "filling"
  | "root-canal"
  | "aligners"
  | "emergency";

export type Treatment = {
  id: TreatmentId;
  name: string;
  description: string;
  fromPriceAed: number;
  minutes: number;
  /** null: any available doctor (emergency visits). */
  doctorId: DoctorId | null;
};

export const TREATMENTS: Treatment[] = [
  {
    id: "cleaning",
    name: "Check-up and cleaning",
    description: "A thorough check, a gentle clean and a clear picture of your teeth.",
    fromPriceAed: 350,
    minutes: 45,
    doctorId: "sara-haddad",
  },
  {
    id: "whitening",
    name: "Teeth whitening",
    description: "A brighter smile in a single, comfortable visit.",
    fromPriceAed: 1200,
    minutes: 60,
    doctorId: "sara-haddad",
  },
  {
    id: "filling",
    name: "Tooth-coloured filling",
    description: "Repairs that blend in with your natural teeth.",
    fromPriceAed: 400,
    minutes: 45,
    doctorId: "sara-haddad",
  },
  {
    id: "root-canal",
    name: "Root canal treatment",
    description: "Specialist care to save a tooth, with time to pause when you need.",
    fromPriceAed: 2000,
    minutes: 90,
    doctorId: "arjun-mehta",
  },
  {
    id: "aligners",
    name: "Clear aligners (consultation)",
    description: "Find out if near-invisible aligners are right for you.",
    fromPriceAed: 250,
    minutes: 30,
    doctorId: "elena-rossi",
  },
  {
    id: "emergency",
    name: "Emergency visit",
    description: "Same-day slots are kept free every day.",
    fromPriceAed: 300,
    minutes: 30,
    doctorId: null,
  },
];

export const treatmentById = (id: TreatmentId) => TREATMENTS.find((t) => t.id === id)!;
export const doctorById = (id: DoctorId) => DOCTORS.find((d) => d.id === id)!;

const aedFormat = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 });
/** "AED 1,200" */
export const aed = (n: number) => `AED ${aedFormat.format(n)}`;
