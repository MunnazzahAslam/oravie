"use client";

import Image from "next/image";
import { TREATMENTS, aed } from "@/lib/clinic";
import { useNoor } from "./noor/NoorProvider";
import SectionTitle from "./SectionTitle";

export default function Treatments() {
  const { ask, busy } = useNoor();

  return (
    <section id="treatments" aria-labelledby="treatments-title" className="py-16 desk:py-24">
      <div className="mx-auto max-w-[1200px] px-5 desk:px-10">
        <SectionTitle
          id="treatments-title"
          title="Treatments and prices"
          sub="Prices are starting points. Your dentist confirms the plan and the cost in writing before any treatment."
        />
        <div className="mt-11 grid items-start gap-6 desk:grid-cols-[420px_1fr] desk:gap-14">
          <div className="relative h-[240px] overflow-hidden rounded-[18px] desk:h-[520px]">
            <Image
              src="/images/treatments-room.webp"
              alt="A calm, uncluttered treatment room with a grey dental chair and a wall-mounted screen"
              fill
              sizes="(min-width: 900px) 780px, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            {/* Each row asks Noor about booking that treatment. */}
            <ul className="border-t border-line">
              {TREATMENTS.map((t) => (
                <li key={t.id} className="border-b border-line">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => ask(`I'd like to book: ${t.name}`)}
                    aria-label={`Ask Noor to book ${t.name}, ${t.minutes} minutes, from ${aed(t.fromPriceAed)}`}
                    className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 py-5 text-left disabled:cursor-wait desk:grid-cols-[1fr_auto_auto] desk:gap-6"
                  >
                    <span>
                      <span className="block text-lg leading-[1.35] font-bold tracking-[-0.01em] transition-colors group-hover:text-blue">
                        {t.name}
                      </span>
                      <span className="mt-1 block text-sm leading-normal font-medium text-slate">{t.description}</span>
                    </span>
                    <span className="col-start-1 row-start-2 text-sm font-semibold text-slate tabular-nums desk:col-start-auto desk:row-start-auto desk:text-right">
                      {t.minutes} min
                    </span>
                    <span className="row-span-2 min-w-[110px] text-right text-lg leading-[1.35] font-extrabold tabular-nums desk:row-span-1">
                      <span className="block text-xs font-semibold text-slate">from</span>
                      {aed(t.fromPriceAed)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-[18px] text-sm leading-[1.6] font-medium text-slate">
              Bring your insurance card and Emirates ID or passport. We confirm your cover at the visit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
