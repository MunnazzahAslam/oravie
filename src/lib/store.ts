import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DoctorId, TreatmentId } from "./clinic";
import { buildSeedBookings } from "./seed-data";

export type BookingRow = {
  reference: string;
  patient_name: string;
  phone: string;
  treatment_id: TreatmentId;
  doctor_id: DoctorId;
  starts_at: string;
  ends_at: string;
  status: "booked" | "cancelled";
  source: "noor" | "staff";
  created_at: string;
};

export type NewBooking = Omit<BookingRow, "status" | "created_at">;

export type InsertResult =
  | { ok: true; row: BookingRow }
  // slot_taken: another booking overlaps; duplicate: the reference is in use.
  | { ok: false; reason: "slot_taken" | "duplicate" | "error" };

/** Everything the app needs from the bookings table. */
export interface BookingStore {
  /** Live bookings that overlap [from, to). */
  bookedBetween(from: Date, to: Date): Promise<BookingRow[]>;
  insert(booking: NewBooking): Promise<InsertResult>;
  byReference(reference: string): Promise<BookingRow | null>;
  cancel(reference: string): Promise<BookingRow | null>;
  /** Bookings of any status starting at or after `from`, soonest first. */
  from(from: Date): Promise<BookingRow[]>;
  /** How many live bookings Noor has made since `since`. */
  noorCountSince(since: Date): Promise<number>;
}

const COLUMNS =
  "reference, patient_name, phone, treatment_id, doctor_id, starts_at, ends_at, status, source, created_at";

class SupabaseStore implements BookingStore {
  constructor(private db: SupabaseClient) {}

  async bookedBetween(from: Date, to: Date) {
    const { data, error } = await this.db
      .from("bookings")
      .select(COLUMNS)
      .eq("status", "booked")
      .lt("starts_at", to.toISOString())
      .gt("ends_at", from.toISOString());
    if (error) throw new Error(error.message);
    return data as BookingRow[];
  }

  async insert(booking: NewBooking): Promise<InsertResult> {
    const { data, error } = await this.db.from("bookings").insert(booking).select(COLUMNS).single();
    if (!error) return { ok: true, row: data as BookingRow };
    // 23P01: the no-overlap exclusion constraint; 23505: unique reference.
    if (error.code === "23P01") return { ok: false, reason: "slot_taken" };
    if (error.code === "23505") return { ok: false, reason: "duplicate" };
    console.error("Booking insert failed", error);
    return { ok: false, reason: "error" };
  }

  async byReference(reference: string) {
    const { data, error } = await this.db.from("bookings").select(COLUMNS).eq("reference", reference).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as BookingRow | null) ?? null;
  }

  async cancel(reference: string) {
    const { data, error } = await this.db
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("reference", reference)
      .eq("status", "booked")
      .select(COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as BookingRow | null) ?? null;
  }

  async from(from: Date) {
    const { data, error } = await this.db
      .from("bookings")
      .select(COLUMNS)
      .gte("starts_at", from.toISOString())
      .order("starts_at")
      .limit(200);
    if (error) throw new Error(error.message);
    return data as BookingRow[];
  }

  async noorCountSince(since: Date) {
    const { count, error } = await this.db
      .from("bookings")
      .select("reference", { count: "exact", head: true })
      .eq("source", "noor")
      .eq("status", "booked")
      .gte("created_at", since.toISOString());
    if (error) throw new Error(error.message);
    return count ?? 0;
  }
}

/** In-memory stand-in with the same rules, for local work without Supabase. */
class MemoryStore implements BookingStore {
  private rows: BookingRow[] = buildSeedBookings();

  async bookedBetween(from: Date, to: Date) {
    return this.rows.filter(
      (r) => r.status === "booked" && new Date(r.starts_at) < to && new Date(r.ends_at) > from,
    );
  }

  async insert(booking: NewBooking): Promise<InsertResult> {
    if (this.rows.some((r) => r.reference === booking.reference)) return { ok: false, reason: "duplicate" };
    const clash = this.rows.some(
      (r) =>
        r.status === "booked" &&
        r.doctor_id === booking.doctor_id &&
        new Date(r.starts_at) < new Date(booking.ends_at) &&
        new Date(r.ends_at) > new Date(booking.starts_at),
    );
    if (clash) return { ok: false, reason: "slot_taken" };
    const row: BookingRow = { ...booking, status: "booked", created_at: new Date().toISOString() };
    this.rows.push(row);
    return { ok: true, row };
  }

  async byReference(reference: string) {
    return this.rows.find((r) => r.reference === reference) ?? null;
  }

  async cancel(reference: string) {
    const row = this.rows.find((r) => r.reference === reference && r.status === "booked");
    if (!row) return null;
    row.status = "cancelled";
    return row;
  }

  async from(from: Date) {
    return this.rows
      .filter((r) => new Date(r.starts_at) >= from)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }

  async noorCountSince(since: Date) {
    return this.rows.filter((r) => r.source === "noor" && r.status === "booked" && new Date(r.created_at) >= since).length;
  }
}

// Survives dev hot reloads and is shared by every route in the process.
const cache = globalThis as { __oravieStore?: BookingStore };

/**
 * The bookings store, or null when the database isn't configured.
 * Supabase when its keys are set; the in-memory stand-in only in dev test mode.
 */
export function getStore(): BookingStore | null {
  if (cache.__oravieStore) return cache.__oravieStore;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    cache.__oravieStore = new SupabaseStore(createClient(url, key, { auth: { persistSession: false } }));
  } else if (process.env.NOOR_MOCK === "1" && process.env.NODE_ENV !== "production") {
    cache.__oravieStore = new MemoryStore();
  }
  return cache.__oravieStore ?? null;
}
