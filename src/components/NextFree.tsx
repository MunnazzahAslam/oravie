"use client";

import { useEffect, useState } from "react";

type NextFreeMap = Record<string, string | null>;

// One request shared by all three dentist cards.
let request: Promise<NextFreeMap | null> | null = null;
const load = () =>
  (request ??= fetch("/api/next-free")
    .then((r) => (r.ok ? (r.json() as Promise<NextFreeMap>) : null))
    .catch(() => null));

/**
 * The dentist's next real free slot. Reserves its space while loading, and
 * disappears if the diary can't be reached, rather than showing a guess.
 */
export default function NextFree({ doctorId }: { doctorId: string }) {
  const [state, setState] = useState<"loading" | "hidden" | string>("loading");

  useEffect(() => {
    let live = true;
    load().then((map) => live && setState(map?.[doctorId] ?? "hidden"));
    return () => {
      live = false;
    };
  }, [doctorId]);

  if (state === "hidden") return null;
  return (
    <div className="mt-5 flex items-center justify-between rounded-[10px] bg-slot px-3.5 py-3 text-sm font-semibold text-blue-hover">
      <span>Next free</span>
      {state === "loading" ? (
        <span className="h-3.5 w-20 animate-pulse rounded bg-slot-border/70 motion-reduce:animate-none" aria-label="Loading" />
      ) : (
        <span className="font-extrabold tabular-nums">{state}</span>
      )}
    </div>
  );
}
