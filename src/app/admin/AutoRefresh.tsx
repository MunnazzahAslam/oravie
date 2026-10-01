"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the bookings from the server every few seconds while the tab is visible. */
export default function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
