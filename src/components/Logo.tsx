export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
      <rect width="36" height="36" rx="10" fill="#1F5FBF" />
      <path d="M10 15.5c2 5.2 5 7.8 8 7.8s6-2.6 8-7.8" stroke="#fff" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ tagline = true }: { tagline?: boolean }) {
  return (
    <span className="flex items-center gap-[11px]">
      <LogoMark />
      <span>
        <span className="block text-[22px] leading-none font-extrabold tracking-[-0.02em]">oravie</span>
        {tagline && (
          <span className="mt-[3px] hidden text-[10px] leading-none font-semibold tracking-[0.16em] text-slate desk:block">
            DENTAL STUDIO
          </span>
        )}
      </span>
    </span>
  );
}
