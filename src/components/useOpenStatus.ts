"use client";

import { useSyncExternalStore } from "react";
import { openStatus } from "@/lib/hours";

// Re-check once a minute; the label is a plain string, so unchanged minutes
// don't re-render anything.
const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
};

const snapshot = () => JSON.stringify(openStatus());

/**
 * Live open/closed status in Dubai time. Returns null during server render and
 * hydration, since the page is static and the real time is only known in the browser.
 */
export function useOpenStatus() {
  const value = useSyncExternalStore(subscribe, snapshot, () => "");
  return value ? (JSON.parse(value) as ReturnType<typeof openStatus>) : null;
}
