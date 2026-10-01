"use client";

import { Check, Phone, TriangleAlert, X } from "lucide-react";
import type { BookingCard, SlotsResult } from "@/lib/noor/tool-types";
import SlotPicker from "./SlotPicker";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-slate">{label}</dt>
      <dd className="text-right font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Details({ booking }: { booking: BookingCard }) {
  return (
    <dl className="mt-2.5 border-t border-line pt-1.5 text-[13px]">
      <Row label="Treatment" value={booking.treatmentName} />
      <Row label="Dentist" value={booking.doctorName} />
      <Row label="Date" value={booking.dateLabel} />
      <Row label="Time" value={`${booking.time} · ${booking.minutes} min`} />
      <Row label="Reference" value={booking.reference} />
    </dl>
  );
}

/** A booking, as confirmed by book_appointment or found by find_booking. */
export function BookingConfirmation({
  booking,
  fresh,
  onCancel,
}: {
  booking: BookingCard;
  /** True right after booking; false when the card shows a looked-up booking. */
  fresh: boolean;
  onCancel?: () => void;
}) {
  const cancelled = booking.status === "cancelled";
  return (
    <div className="mt-2.5 rounded-xl border border-line p-3.5">
      <p className="flex items-center gap-2 text-sm font-bold">
        <span className={`grid h-5 w-5 place-items-center rounded-full text-white ${cancelled ? "bg-slate" : "bg-blue"}`}>
          {cancelled ? <X size={12} strokeWidth={3} aria-hidden="true" /> : <Check size={12} strokeWidth={3} aria-hidden="true" />}
        </span>
        {cancelled ? "Cancelled booking" : fresh ? "Booking confirmed" : "Your booking"}
      </p>
      <Details booking={booking} />
      {!cancelled && onCancel && (
        <button type="button" onClick={onCancel} className="mt-1.5 text-[13px] font-bold text-blue hover:underline">
          Cancel this booking
        </button>
      )}
    </div>
  );
}

export function BookingCancelled({ booking, within24Hours }: { booking: BookingCard; within24Hours: boolean }) {
  return (
    <div className="mt-2.5 rounded-xl border border-line bg-ice p-3.5">
      <p className="flex items-center gap-2 text-sm font-bold">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-slate text-white">
          <X size={12} strokeWidth={3} aria-hidden="true" />
        </span>
        Booking cancelled
      </p>
      <p className="mt-2 text-[13px] leading-normal font-medium text-slate">
        <span className="font-semibold text-navy tabular-nums">{booking.reference}</span> · {booking.treatmentName},{" "}
        {booking.dateLabel} at <span className="tabular-nums">{booking.time}</span>. The time is free again.
      </p>
      {within24Hours && (
        <p className="mt-1.5 text-[13px] leading-normal font-medium text-slate">
          Free cancellation is up to 24 hours before, so the clinic may contact you about this one.
        </p>
      )}
    </div>
  );
}

/** Pain or damage: the clinic phone, the next free emergency time, and when to go to hospital. */
export function EmergencyCard({
  result,
  active,
  onConfirm,
}: {
  result: Extract<SlotsResult, { ok: true }>;
  active: boolean;
  onConfirm: (message: string) => void;
}) {
  const first = result.groups[0];
  return (
    <div className="mt-2.5 rounded-xl border border-alert/30 border-l-4 border-l-alert bg-[#FDF4F3] p-3.5">
      <p className="flex items-center gap-2 text-sm font-bold text-alert">
        <TriangleAlert size={16} aria-hidden="true" /> Emergency visit
      </p>
      <a
        href={`tel:${result.clinicPhone.replace(/\s/g, "")}`}
        className="mt-2.5 flex items-center gap-2 text-sm font-bold tabular-nums"
      >
        <Phone size={14} className="text-alert" aria-hidden="true" /> Call the clinic: {result.clinicPhone}
      </a>
      <p className="mt-2.5 text-[13px] font-semibold text-slate">
        Next free: {first.dateLabel}, <span className="tabular-nums">{first.slots[0].time}</span> with {first.doctorName}
      </p>
      <SlotPicker result={result} active={active} onConfirm={onConfirm} />
      <p className="mt-3 border-t border-alert/20 pt-2.5 text-[13px] leading-normal font-medium">
        Severe swelling, bleeding that won&apos;t stop, or trouble breathing? Go to a hospital emergency department now.
      </p>
    </div>
  );
}
