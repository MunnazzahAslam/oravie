"use client";

import { CLINIC } from "@/lib/clinic";
import { buttonClass, buttonLineClass } from "./ui";
import { useOpenStatus } from "./useOpenStatus";

// Every answer comes straight from knowledge.md.
const FAQS = [
  {
    q: "What happens at my first visit?",
    a: "A check-up, X-rays if needed, and a written plan with prices. It takes about 45 minutes.",
  },
  {
    q: "I get nervous at the dentist. Can you help?",
    a: "Yes. We offer longer appointments, a quiet room, and the option to pause any time.",
  },
  {
    q: "What if I have a dental emergency?",
    a: "Same-day emergency slots are kept free every day. For severe swelling, bleeding that won't stop, or trouble breathing, go to a hospital emergency department.",
  },
  {
    q: "Can I cancel my appointment?",
    a: "Yes, cancellation is free up to 24 hours before your appointment.",
  },
  {
    q: "Do you accept my insurance?",
    a: "Most major UAE insurance plans are accepted. Coverage is confirmed at your visit with your insurance card and Emirates ID or passport.",
  },
  {
    q: "Is there parking?",
    a: "Yes, free parking behind the clinic in Jumeirah 1.",
  },
];

const DIRECTIONS = "https://www.google.com/maps/search/?api=1&query=Jumeirah+1%2C+Dubai";

export default function BeforeYouVisit() {
  const status = useOpenStatus();

  return (
    <section className="pb-16 desk:pb-24">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 desk:grid-cols-2 desk:gap-16 desk:px-10">
        <div>
          <h2 id="faq" className="scroll-mt-24 text-[30px] leading-[1.1] font-extrabold tracking-[-0.03em] desk:text-[40px]">
            Before you visit
          </h2>
          {/* Native <details> with a shared name: one answer open at a time. */}
          <div className="mt-7 border-t border-line">
            {FAQS.map(({ q, a }, i) => (
              <details key={q} name="faq" open={i === 0} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="shrink-0 text-xl leading-none font-semibold text-blue" aria-hidden="true">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <p className="-mt-2 pb-5 text-[15px] leading-[1.6] font-medium text-slate">{a}</p>
              </details>
            ))}
          </div>
        </div>

        <section id="visit" aria-labelledby="visit-title" className="self-start rounded-[18px] bg-ice p-6 desk:p-8">
          <h2 id="visit-title" className="text-[30px] leading-[1.1] font-extrabold tracking-[-0.03em] desk:text-[32px]">
            Visit the studio
          </h2>
          <p className="mt-3.5 text-base leading-[1.6] font-medium text-slate">
            {CLINIC.address}. {CLINIC.parking}.
          </p>
          <table className="mt-[18px] w-full border-collapse text-[15px] font-semibold tabular-nums">
            <caption className="sr-only">Opening hours</caption>
            <tbody>
              <tr>
                <th scope="row" className="border-b border-line py-3 text-left font-semibold">Monday to Saturday</th>
                <td className="border-b border-line py-3 text-right text-slate">9:00 to 21:00</td>
              </tr>
              {status && (
                <tr>
                  <th scope="row" className="border-b border-line py-3 text-left font-extrabold">Today</th>
                  <td className="border-b border-line py-3 text-right font-extrabold">{status.short}</td>
                </tr>
              )}
              <tr>
                <th scope="row" className="border-b border-line py-3 text-left font-semibold">Sunday</th>
                <td className="border-b border-line py-3 text-right text-slate">10:00 to 18:00</td>
              </tr>
              <tr>
                <th scope="row" className="border-b border-line py-3 text-left font-semibold">Phone</th>
                <td className="border-b border-line py-3 text-right text-slate">{CLINIC.phone}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-[30px] flex flex-wrap gap-3">
            <a href="#noor" data-open-noor className={`${buttonClass} flex-auto desk:flex-none`}>
              Book appointment
            </a>
            <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" className={`${buttonLineClass} flex-auto desk:flex-none`}>
              Get directions
            </a>
          </div>
        </section>
      </div>
    </section>
  );
}
