/**
 * What Noor's tools return. Shared by the server (which produces these) and
 * the chat UI (which renders them as slot grids and cards), so it must stay
 * free of server-only imports.
 */

export type SlotOption = { time: string; startsAt: string };

export type SlotGroup = {
  date: string;
  /** "Saturday 3 October" */
  dateLabel: string;
  doctorId: string;
  doctorName: string;
  slots: SlotOption[];
  /** Booked times that fall between the offered ones, shown struck through. */
  taken: string[];
};

export type SlotsResult =
  | {
      ok: true;
      treatmentId: string;
      treatmentName: string;
      minutes: number;
      fromPriceAed: number;
      emergency: boolean;
      groups: SlotGroup[];
      clinicPhone: string;
    }
  | { ok: false; reason: "offline" | "none_free" | "error"; clinicPhone: string };

export type BookingCard = {
  reference: string;
  treatmentName: string;
  doctorName: string;
  dateLabel: string;
  time: string;
  minutes: number;
  status: "booked" | "cancelled";
};

export type BookResult =
  | { ok: true; booking: BookingCard }
  | { ok: false; reason: "slot_taken" | "invalid_slot" | "offline" | "error"; clinicPhone: string };

export type FindResult =
  | { ok: true; booking: BookingCard }
  | { ok: false; reason: "not_found" | "offline" | "error"; clinicPhone: string };

export type CancelResult =
  | { ok: true; booking: BookingCard; within24Hours: boolean }
  | { ok: false; reason: "not_found" | "already_cancelled" | "offline" | "error"; clinicPhone: string };
