/**
 * A scripted stand-in for the real model, for working on the chat UI without
 * an API key (NOOR_MOCK=1, development only). It follows simple keyword rules
 * and calls the real tools, so slots and bookings are genuine; the wording is
 * canned and is not how Noor decides anything.
 */
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { addDays, toDubai, weekdayOf } from "../time";

type Step = { text: string } | { tool: string; input: Record<string, unknown> };

const ANSWERS: [RegExp, string][] = [
  [
    /insurance/i,
    "Most major UAE insurance plans are accepted. Your coverage is confirmed at your visit with your insurance card and Emirates ID or passport.\n[[source:insurance]]\n[[chips:Book a check-up|What should I bring?]]",
  ],
  [
    /how much|price|cost/i,
    "Teeth whitening is from AED 1,200 and takes about 60 minutes with Dr. Sara Haddad. Your dentist confirms the plan and cost before any treatment.\n[[source:price-list]]\n[[chips:Book a whitening|Who does whitening?]]",
  ],
  [
    /antibiotic|medicine|pill/i,
    "I can't give medical advice, but I can book you in with a dentist who can. Would you like the earliest appointment?\n[[chips:Yes, earliest please|I'm in pain now]]",
  ],
];

const TREATMENT_WORDS: [RegExp, string][] = [
  [/whiten/i, "whitening"],
  [/filling/i, "filling"],
  [/root canal/i, "root-canal"],
  [/aligner/i, "aligners"],
  [/clean|check-up|checkup|earliest/i, "cleaning"],
];

const REFERENCE = /OR[-\s]?\d{4}/i;
const phoneIn = (s: string) => s.replace(REFERENCE, "").match(/\+?\d[\d\s-]{6,}\d/)?.[0];

function decide(history: string[], transcript: string, lastToolName?: string, lastToolJson?: string): Step {
  // After a tool has run, say one line about its result.
  if (lastToolName && lastToolJson) {
    const result = JSON.parse(lastToolJson);
    if (!result.ok) {
      if (result.reason === "slot_taken") return { text: "Sorry, that time has just been taken. Shall I look for another?" };
      if (result.reason === "none_free") return { text: "Nothing is free then. Would another day suit you?" };
      if (result.reason === "not_found") return { text: `That reference and phone number don't match a booking. You can call us on ${result.clinicPhone}.` };
      if (result.reason === "already_cancelled") return { text: "That booking has already been cancelled." };
      return { text: `Sorry, I can't reach the booking system right now. Please call us on ${result.clinicPhone}.` };
    }
    if (lastToolName === "get_available_slots") {
      if (result.emergency) {
        return {
          text: "I'm sorry you're in pain. Here is the next emergency time. For severe swelling, bleeding that won't stop or trouble breathing, please go to a hospital emergency department.",
        };
      }
      const g = result.groups[0];
      return {
        text: `${g.doctorName} has these times free on ${g.dateLabel}. ${result.treatmentName} takes ${result.minutes} minutes, from AED ${result.fromPriceAed.toLocaleString("en-AE")}.`,
      };
    }
    if (lastToolName === "book_appointment") return { text: "You're all booked. We look forward to seeing you." };
    if (lastToolName === "cancel_booking") return { text: "That's cancelled, and the time is free again." };
    return { text: "Here is your booking." };
  }

  const last = history[history.length - 1] ?? "";
  const today = toDubai(new Date()).date;

  // The slot form sends: "Book 15:00 on <day> with <doctor> for <treatment>. Name: X. Phone: Y."
  const form = last.match(/^Book (\d{2}:\d{2}) .*Name: (.+?)\. Phone: (.+?)\.?$/);
  if (form) {
    const [, time, name, phone] = form;
    const slot = transcript.match(new RegExp(`\\\\?"time\\\\?":\\\\?"${time}\\\\?",\\\\?"startsAt\\\\?":\\\\?"([^"\\\\]+)`));
    const treatment = [...transcript.matchAll(/\\?"treatmentId\\?":\\?"([a-z-]+)/g)].pop()?.[1];
    const doctor = [...transcript.matchAll(/\\?"doctorId\\?":\\?"([a-z-]+)/g)].pop()?.[1];
    if (slot && treatment && doctor) {
      return { tool: "book_appointment", input: { treatment, doctor, starts_at: slot[1], patient_name: name, phone } };
    }
  }

  // Cancelling: needs a reference (from this message or an earlier one) and a phone.
  const cancelling = history.some((m) => /cancel/i.test(m));
  const reference = [...history].reverse().find((m) => REFERENCE.test(m))?.match(REFERENCE)?.[0];
  if (cancelling && reference) {
    const phone = phoneIn(last);
    if (phone) return { tool: "cancel_booking", input: { reference, phone } };
    if (/cancel/i.test(last)) return { text: "Of course. What phone number was the booking made with?" };
  }

  if (/pain|hurt|broken|emergency|swollen/i.test(last)) {
    return { tool: "get_available_slots", input: { treatment: "emergency", date_from: today, date_to: addDays(today, 1) } };
  }

  for (const [re, answer] of ANSWERS) if (re.test(last)) return { text: answer };

  const wanted = TREATMENT_WORDS.find(([re]) => re.test(last));
  if (wanted || /book|appointment|saturday|slot|times?\b/i.test(last)) {
    const input: Record<string, unknown> = { treatment: wanted?.[1] ?? "cleaning", date_from: today, date_to: addDays(today, 7) };
    if (/saturday/i.test(last)) {
      let sat = today;
      while (weekdayOf(sat) !== 6) sat = addDays(sat, 1);
      input.date_from = input.date_to = sat;
    }
    const part = last.match(/morning|afternoon|evening/i)?.[0].toLowerCase();
    if (part) input.time_of_day = part;
    return { tool: "get_available_slots", input };
  }

  return { text: "(Test mode) I'm a scripted stand-in for Noor. Add ANTHROPIC_API_KEY to talk to the real one." };
}

const usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 0, text: 0, reasoning: undefined },
};

let callId = 0;

export function mockNoorModel() {
  return new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      const userTexts = prompt
        .filter((m) => m.role === "user")
        .map((m) => (m.content as { type: string; text?: string }[]).map((p) => p.text ?? "").join(""));
      const lastMessage = prompt[prompt.length - 1];
      const toolPart =
        lastMessage?.role === "tool"
          ? (lastMessage.content as { type: string; toolName?: string; output?: { value?: unknown } }[]).find(
              (p) => p.type === "tool-result",
            )
          : undefined;
      const step = decide(
        userTexts,
        JSON.stringify(prompt),
        toolPart?.toolName,
        toolPart ? JSON.stringify(toolPart.output?.value ?? {}) : undefined,
      );

      if ("tool" in step) {
        return {
          stream: simulateReadableStream({
            initialDelayInMs: 500,
            chunks: [
              { type: "tool-call", toolCallId: `mock-${++callId}`, toolName: step.tool, input: JSON.stringify(step.input) },
              { type: "finish", finishReason: { unified: "tool-calls", raw: undefined }, usage },
            ],
          }),
        };
      }

      return {
        stream: simulateReadableStream({
          initialDelayInMs: 500,
          chunkDelayInMs: 25,
          chunks: [
            { type: "text-start", id: "t" },
            ...step.text.split(/(?<= )/).map((delta) => ({ type: "text-delta" as const, id: "t", delta })),
            { type: "text-end", id: "t" },
            { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage },
          ],
        }),
      };
    },
  });
}
