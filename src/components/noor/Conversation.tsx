"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FileText, RotateCcw, Send, WifiOff } from "lucide-react";
import type { UIMessage } from "ai";
import { CLINIC } from "@/lib/clinic";
import { NOOR_LIMITS } from "@/lib/noor/limits";
import { SOURCES, parseReply, type SourceId } from "@/lib/noor/markers";
import type { BookResult, CancelResult, FindResult, SlotsResult } from "@/lib/noor/tool-types";
import { BookingCancelled, BookingConfirmation, EmergencyCard } from "./Cards";
import { useNoor, type NoorProblem } from "./NoorProvider";
import SlotPicker from "./SlotPicker";

export const STARTER_CHIPS = ["Book a cleaning", "Do you take my insurance?", "I have tooth pain"];

const GREETING =
  "Hi, I'm Noor. I can answer questions about Oravie or book your visit, day or night. How can I help?";

const rawText = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

/** A tool call inside an assistant message, e.g. type "tool-get_available_slots". */
type ToolPart = { type: `tool-${string}`; state: string; output?: unknown };
const isTool = (p: { type: string }): p is ToolPart => p.type.startsWith("tool-");

/** What Noor is doing while a tool runs. */
const TOOL_BUSY: Record<string, string> = {
  "tool-get_available_slots": "Checking the diary",
  "tool-book_appointment": "Booking your appointment",
  "tool-find_booking": "Looking up your booking",
  "tool-cancel_booking": "Cancelling your booking",
};

function Chips({ items, onPick, disabled }: { items: string[]; onPick: (t: string) => void; disabled?: boolean }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {items.map((chip) => (
        <button
          key={chip}
          type="button"
          disabled={disabled}
          onClick={() => onPick(chip)}
          className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-navy transition-colors hover:border-blue hover:text-blue disabled:opacity-50"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

function Typing() {
  return (
    <div className="mt-3 flex items-center gap-1.5 py-1" aria-label="Noor is typing">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate/60 motion-reduce:animate-none"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}

const PROBLEM_TEXT: Record<Exclude<NoorProblem, null>, string> = {
  offline: `Noor is offline right now. You can call the clinic on ${CLINIC.phone}.`,
  "too-long": `That message is a little long for Noor. Please keep it under ${NOOR_LIMITS.maxInputChars} characters.`,
  busy: "You've sent a lot of messages in a short time. Please wait a few minutes and try again.",
  error: `Sorry, something went wrong on our side. Try again, or call ${CLINIC.phone}.`,
};

function Problem({ problem, onRetry }: { problem: Exclude<NoorProblem, null>; onRetry: () => void }) {
  return (
    <div role="alert" className="mt-3 flex gap-2.5 rounded-lg bg-ice px-3 py-2.5 text-[13px] leading-relaxed">
      <WifiOff size={16} className="mt-0.5 shrink-0 text-slate" aria-hidden="true" />
      <div>
        <p>{PROBLEM_TEXT[problem]}</p>
        {problem !== "too-long" && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1.5 inline-flex items-center gap-1.5 font-bold text-blue hover:underline"
          >
            <RotateCcw size={13} aria-hidden="true" /> Try again
          </button>
        )}
      </div>
    </div>
  );
}

type ConversationProps = {
  /** Tailwind classes for the scrolling message area (height differs per placement). */
  scrollClassName?: string;
  inputId: string;
  autoFocus?: boolean;
};

export default function Conversation({ scrollClassName = "", inputId, autoFocus }: ConversationProps) {
  const { chat, send, busy, problem } = useNoor();
  const { messages, status } = chat;
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Keep the newest message in view as text streams in.
  const lastText = messages.length ? JSON.stringify(messages[messages.length - 1].parts).length : 0;
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages.length, lastText, status, problem]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    send(input);
    setInput("");
  };

  // Show the typing dots while waiting for Noor's next words: before she has
  // started, or after a tool has finished and her reply hasn't begun.
  const last = messages[messages.length - 1];
  const lastPart = last?.parts.filter((p) => p.type === "text" || isTool(p)).at(-1);
  const waiting =
    busy &&
    (last?.role === "user" ||
      !lastPart ||
      (lastPart.type === "text" ? !parseReply(lastPart.text).text : (lastPart as ToolPart).state === "output-available"));

  return (
    <>
      <div
        ref={scroller}
        className={`overflow-y-auto overscroll-contain px-4 py-3.5 ${scrollClassName}`}
        aria-live="polite"
        aria-busy={busy}
      >
        {/* Noor speaks in plain text; the patient's messages are navy bubbles. */}
        <p className="text-sm leading-normal font-medium">{GREETING}</p>
        {messages.length === 0 && <Chips items={STARTER_CHIPS} onPick={send} />}

        {messages.map((m, i) => {
          if (m.role === "user") {
            return (
              <div
                key={m.id}
                className="mt-3 ml-auto w-fit max-w-[85%] rounded-[12px_12px_4px_12px] bg-navy px-3 py-[9px] text-sm leading-[1.45] font-medium text-white"
              >
                {rawText(m)}
              </div>
            );
          }
          const isLast = i === messages.length - 1;
          // Only the newest message's slot buttons accept input, and not mid-reply.
          const active = isLast && !busy;
          const sources: SourceId[] = [];
          let chips: string[] = [];

          const body = m.parts.map((part, j) => {
            if (part.type === "text") {
              const reply = parseReply(part.text);
              reply.sources.forEach((src) => !sources.includes(src) && sources.push(src));
              if (reply.chips.length) chips = reply.chips;
              return reply.text ? (
                <p key={j} className="mt-3 text-sm leading-normal font-medium whitespace-pre-line first:mt-0">
                  {reply.text}
                </p>
              ) : null;
            }
            if (!isTool(part)) return null;

            if (part.state !== "output-available") {
              return part.state === "output-error" ? null : (
                <p key={j} className="mt-3 animate-pulse text-[13px] font-semibold text-slate first:mt-0 motion-reduce:animate-none">
                  {TOOL_BUSY[part.type] ?? "Working on it"}…
                </p>
              );
            }

            switch (part.type) {
              case "tool-get_available_slots": {
                const result = part.output as SlotsResult;
                if (!result.ok) return null;
                return result.emergency ? (
                  <EmergencyCard key={j} result={result} active={active} onConfirm={send} />
                ) : (
                  <SlotPicker key={j} result={result} active={active} onConfirm={send} />
                );
              }
              case "tool-book_appointment":
              case "tool-find_booking": {
                const result = part.output as BookResult | FindResult;
                if (!result.ok) return null;
                return (
                  <BookingConfirmation
                    key={j}
                    booking={result.booking}
                    fresh={part.type === "tool-book_appointment"}
                    onCancel={active ? () => send(`Cancel booking ${result.booking.reference}`) : undefined}
                  />
                );
              }
              case "tool-cancel_booking": {
                const result = part.output as CancelResult;
                return result.ok ? (
                  <BookingCancelled key={j} booking={result.booking} within24Hours={result.within24Hours} />
                ) : null;
              }
              default:
                return null;
            }
          });

          if (body.every((node) => node === null)) return null;
          // Noor's words first, then the grid or card she is talking about.
          const words = body.filter((_, j) => m.parts[j].type === "text");
          const widgets = body.filter((_, j) => m.parts[j].type !== "text");
          return (
            <div key={m.id} className="mt-3">
              {words}
              {widgets}
              {sources.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {sources.map((src) => (
                    <span
                      key={src}
                      className="inline-flex items-center gap-1.5 rounded-md bg-ice px-2 py-1 text-[11px] font-semibold text-slate"
                    >
                      <FileText size={11} aria-hidden="true" /> Source: {SOURCES[src]}
                    </span>
                  ))}
                </p>
              )}
              {isLast && status === "ready" && chips.length > 0 && <Chips items={chips} onPick={send} />}
            </div>
          );
        })}

        {waiting && <Typing />}
        {problem && <Problem problem={problem} onRetry={() => chat.regenerate()} />}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-line px-4 py-3">
        <label htmlFor={inputId} className="sr-only">
          Message Noor
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Noor anything"
          maxLength={NOOR_LIMITS.maxInputChars}
          autoComplete="off"
          className="h-[38px] min-w-0 flex-1 rounded-lg border border-line bg-white px-2.5 text-base font-medium outline-none placeholder:text-[#8A98AA] focus:border-blue focus:ring-2 focus:ring-blue/15 desk:text-[13px]"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={busy || !input.trim()}
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-blue text-white transition-colors hover:bg-blue-hover disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </>
  );
}
