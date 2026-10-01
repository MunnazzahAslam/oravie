/**
 * Noor ends some answers with small markers the chat turns into UI:
 *   [[source:price-list]]            → "Source: Oravie price list" tag
 *   [[chips:See Saturday times|…]]   → tappable follow-up suggestions
 * Markers are stripped from the visible text, including a half-streamed one.
 */

export const SOURCES = {
  "price-list": "Oravie price list",
  insurance: "Oravie insurance policy",
  policies: "Oravie clinic policies",
  doctors: "Oravie doctor schedule",
  hours: "Oravie opening hours",
} as const;

export type SourceId = keyof typeof SOURCES;

export type ParsedReply = {
  text: string;
  sources: SourceId[];
  chips: string[];
};

const MARKER = /\[\[(source|chips):([^\]]*)\]\]/g;

export function parseReply(raw: string): ParsedReply {
  const sources: SourceId[] = [];
  const chips: string[] = [];

  for (const [, kind, value] of raw.matchAll(MARKER)) {
    if (kind === "source") {
      for (const id of value.split(/[|,]/).map((s) => s.trim())) {
        if (id in SOURCES && !sources.includes(id as SourceId)) sources.push(id as SourceId);
      }
    } else {
      for (const chip of value.split("|").map((s) => s.trim())) {
        if (chip && chip.length <= 40 && chips.length < 3) chips.push(chip);
      }
    }
  }

  let text = raw.replace(MARKER, "");
  // Hide a marker that is still streaming in ("[[sou…" or a lone trailing "[").
  const open = text.lastIndexOf("[[");
  if (open !== -1) text = text.slice(0, open);
  text = text.replace(/\[$/, "").trim();

  return { text, sources, chips };
}
