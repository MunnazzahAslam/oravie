"use client";

import { CLINIC } from "@/lib/clinic";
import { useOpenStatus } from "./useOpenStatus";

export default function TopBar() {
  const status = useOpenStatus();

  return (
    <div className="bg-navy text-[13px] font-medium text-[#C9D6E8]">
      <div className="mx-auto flex h-[38px] max-w-[1200px] items-center gap-7 px-5 desk:px-10">
        <span className="flex items-center" aria-live="polite">
          <span
            className={`mr-[7px] inline-block h-[7px] w-[7px] rounded-full ${status?.open ? "bg-ok-bright" : "bg-[#8A98AA]"}`}
            aria-hidden="true"
          />
          {/* Until the browser knows the time, show the regular hours. */}
          {status?.label ?? "Mon to Sat 9:00 to 21:00"}
        </span>
        <span className="hidden desk:inline">{CLINIC.address}</span>
        <span className="hidden desk:inline">{CLINIC.parking}</span>
        <a href={`tel:${CLINIC.phone.replace(/\s/g, "")}`} className="ml-auto font-semibold text-white tabular-nums">
          {CLINIC.phone}
        </a>
      </div>
    </div>
  );
}
