import Image from "next/image";
import NoorCard from "./NoorCard";
import { buttonClass, buttonLineClass } from "./ui";

export default function Hero() {
  return (
    <section id="top" aria-label="Oravie Dental Studio">
      <div className="mx-auto grid max-w-[1200px] items-center gap-7 px-5 py-8 desk:grid-cols-[1fr_1.08fr] desk:gap-14 desk:px-10 desk:py-[var(--hero-pad)]">
        <div>
          <h1 className="text-[38px] leading-[1.04] font-extrabold tracking-[-0.035em] desk:text-[58px]">
            Dental care in Jumeirah, without the rush.
          </h1>
          <p className="mt-5 max-w-[470px] text-base leading-[1.6] font-medium text-slate desk:text-lg">
            Check-ups, whitening, fillings, root canals and aligners, with clear written prices before any
            treatment. Book online at any hour.
          </p>
          <div className="mt-[30px] flex flex-wrap gap-3">
            <a href="#noor" data-open-noor className={`${buttonClass} flex-auto desk:flex-none`}>
              Book appointment
            </a>
            <a href="#treatments" className={`${buttonLineClass} flex-auto desk:flex-none`}>
              View treatments and prices
            </a>
          </div>
          <p className="mt-[34px] flex items-center gap-3.5 text-sm font-semibold text-slate">
            Insurance:
            <span className="inline-flex h-[34px] items-center rounded-lg border border-line bg-white px-3 text-[13px] font-bold text-[#33445B]">
              Most major UAE plans accepted
            </span>
          </p>
        </div>

        <div className="relative">
          {/* Desktop: the photo takes what is left of the first view after the top
              bar, header and equal padding, between 400 and 560px. */}
          <div className="relative h-[300px] overflow-hidden rounded-[18px] desk:h-[clamp(400px,calc(100svh_-_var(--topbar-h)_-_var(--header-h)_-_2_*_var(--hero-pad)),560px)]">
            {/* The 3:2 photo covers a near-square box, so it renders ~840px wide. */}
            <Image
              src="/images/hero-treatment-room.webp"
              alt="A bright treatment room with a light blue dental chair, overhead lamp and wooden floor"
              fill
              sizes="(min-width: 900px) 840px, 100vw"
              loading="eager"
              fetchPriority="high"
              className="object-cover"
            />
          </div>
          <NoorCard />
        </div>
      </div>
    </section>
  );
}
