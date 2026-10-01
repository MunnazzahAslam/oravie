import Image from "next/image";
import SectionTitle from "./SectionTitle";

const STEPS = [
  { title: "Book in under a minute", text: "Ask Noor for a time online, or call the clinic." },
  { title: "Check-up and X-rays if needed", text: "Your dentist looks at everything and explains what they see." },
  { title: "A written plan with prices", text: "You leave with the plan and costs, and decide in your own time." },
];

export default function FirstVisit() {
  return (
    <section id="first-visit" aria-labelledby="first-visit-title" className="bg-navy py-16 text-white desk:py-24">
      <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-5 desk:grid-cols-2 desk:gap-16 desk:px-10">
        <div className="relative h-[260px] overflow-hidden rounded-[18px] desk:h-[480px]">
          <Image
            src="/images/first-visit.webp"
            alt="A dentist points to an X-ray on a screen while explaining it to a seated patient"
            fill
            sizes="(min-width: 900px) 640px, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <SectionTitle
            id="first-visit-title"
            title="Your first visit"
            sub="About 45 minutes, with time for your questions."
            subClassName="text-mist"
          />
          <ol className="mt-[34px] grid gap-[22px]">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[44px_1fr] gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-[#5F86C4] text-[15px] font-extrabold tabular-nums">
                  {i + 1}
                </span>
                <span>
                  <span className="mt-0.5 block text-[17px] leading-[1.35] font-bold">{s.title}</span>
                  <span className="text-[15px] leading-[1.55] font-medium text-mist">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
