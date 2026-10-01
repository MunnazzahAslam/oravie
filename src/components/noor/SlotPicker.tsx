"use client";

import { useState, type FormEvent } from "react";
import type { SlotGroup, SlotOption, SlotsResult } from "@/lib/noor/tool-types";

type Picked = { group: SlotGroup; slot: SlotOption };

type SlotPickerProps = {
  result: Extract<SlotsResult, { ok: true }>;
  /** Only the newest picker in the conversation accepts input. */
  active: boolean;
  onConfirm: (message: string) => void;
};

const input =
  "h-[38px] min-w-0 rounded-lg border border-line bg-white px-2.5 text-base font-medium outline-none placeholder:text-[#8A98AA] focus:border-blue focus:ring-2 focus:ring-blue/15 desk:text-[13px]";

/**
 * Free times as a 4-column grid of tappable slots. Picking one reveals a
 * name and phone form; confirming sends the booking request to Noor.
 */
export default function SlotPicker({ result, active, onConfirm }: SlotPickerProps) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tried, setTried] = useState(false);

  const nameOk = name.trim().length >= 2;
  const phoneOk = phone.replace(/\D/g, "").length >= 7;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!picked || !nameOk || !phoneOk || !active) return;
    onConfirm(
      `Book ${picked.slot.time} on ${picked.group.dateLabel} with ${picked.group.doctorName} for ${result.treatmentName}. Name: ${name.trim()}. Phone: ${phone.trim()}.`,
    );
  };

  const several = result.groups.length > 1;

  return (
    <div className="mt-2.5">
      {result.groups.map((group) => {
        // Offered and already-booked times together, in time order.
        const cells = [
          ...group.slots.map((slot) => ({ time: slot.time, slot })),
          ...group.taken.map((time) => ({ time, slot: null })),
        ].sort((a, b) => a.time.localeCompare(b.time));

        return (
          <div key={`${group.date}-${group.doctorId}`} className="mt-2.5 first:mt-0">
            {several && (
              <p className="mb-1.5 text-xs font-semibold text-slate">
                {group.dateLabel} · {group.doctorName}
              </p>
            )}
            <div className="grid grid-cols-4 gap-1.5 tabular-nums" role="group" aria-label={`Times on ${group.dateLabel}`}>
              {cells.map(({ time, slot }) => {
                if (!slot) {
                  return (
                    <span
                      key={time}
                      className="grid h-9 place-items-center rounded-lg border border-line bg-white text-[13px] font-semibold text-[#A7B3C2] line-through"
                      aria-label={`${time}, taken`}
                    >
                      {time}
                    </span>
                  );
                }
                const selected = picked?.slot.startsAt === slot.startsAt;
                return (
                  <button
                    key={time}
                    type="button"
                    disabled={!active}
                    aria-pressed={selected}
                    onClick={() => setPicked({ group, slot })}
                    className={`h-9 rounded-lg border text-[13px] font-bold transition-colors disabled:cursor-default ${
                      selected
                        ? "border-blue bg-blue text-white"
                        : "border-slot-border bg-slot text-blue-hover enabled:hover:border-blue"
                    } ${!active && !selected ? "opacity-60" : ""}`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {picked && active && (
        <form onSubmit={submit} className="mt-2.5" noValidate>
          <div className="grid grid-cols-2 gap-2">
            <input
              className={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              aria-invalid={tried && !nameOk}
              autoComplete="name"
              maxLength={80}
            />
            <input
              className={input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              aria-label="Phone number"
              aria-invalid={tried && !phoneOk}
              type="tel"
              autoComplete="tel"
              maxLength={20}
            />
          </div>
          {tried && (!nameOk || !phoneOk) && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-alert">
              {!nameOk ? "Please add your name." : "Please add a phone number we can reach you on."}
            </p>
          )}
          <button
            type="submit"
            className="mt-2 h-[38px] w-full rounded-[10px] bg-blue text-[13px] font-bold text-white tabular-nums transition-colors hover:bg-blue-hover"
          >
            Confirm {picked.slot.time}
          </button>
        </form>
      )}
    </div>
  );
}
