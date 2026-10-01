import type { ReactNode } from "react";
import NoorAvatar from "../NoorAvatar";

export default function NoorHeader({ action }: { action?: ReactNode }) {
  return (
    <div className="flex items-center gap-[11px] border-b border-line px-4 py-3.5">
      <NoorAvatar />
      <div className="min-w-0">
        <p className="text-sm leading-tight font-bold">Noor</p>
        <p className="text-xs font-medium text-slate">Oravie reception</p>
      </div>
      <span className="ml-auto text-xs font-semibold text-ok">● Online</span>
      {action}
    </div>
  );
}
