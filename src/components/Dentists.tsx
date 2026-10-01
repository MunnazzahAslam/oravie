import Image from "next/image";
import { DOCTORS } from "@/lib/clinic";
import NextFree from "./NextFree";
import SectionTitle from "./SectionTitle";

const GALLERY = [
  {
    src: "/images/gallery-lobby.webp",
    alt: "A bright, minimal waiting area with cream sofas and a small indoor tree",
    sizes: "(min-width: 900px) 510px, 100vw",
  },
  {
    src: "/images/gallery-room.webp",
    alt: "A treatment room with a dental chair beside a large window with blinds",
    sizes: "(min-width: 900px) 510px, 70vw",
  },
  {
    src: "/images/gallery-mirror.webp",
    alt: "Close-up of a dental mirror, with a treatment lamp softly blurred behind it",
    sizes: "(min-width: 900px) 330px, 50vw",
  },
];

export default function Dentists() {
  return (
    <section id="dentists" aria-labelledby="dentists-title" className="py-16 desk:py-24">
      <div className="mx-auto max-w-[1200px] px-5 desk:px-10">
        <SectionTitle
          id="dentists-title"
          title="Our dentists"
          sub="Three dentists, each with their own speciality and languages."
        />
        <ul className="mt-11 grid gap-6 desk:grid-cols-3">
          {DOCTORS.map((d) => (
            <li key={d.id} className="rounded-2xl border border-line p-6">
              <div className="flex items-center gap-4">
                <span
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-[14px] bg-ice-2 text-[22px] font-extrabold text-blue-hover"
                  aria-hidden="true"
                >
                  {d.initials}
                </span>
                <div>
                  <h3 className="text-[19px] font-bold">{d.name}</h3>
                  <p className="mt-[3px] text-sm font-medium text-slate">{d.specialty}</p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-[92px_1fr] gap-x-2.5 gap-y-2 text-sm font-medium">
                <dt className="text-slate">Languages</dt>
                <dd>{d.languages.join(", ")}</dd>
                <dt className="text-slate">In clinic</dt>
                <dd>{d.inClinic}</dd>
              </dl>
              <NextFree doctorId={d.id} />
            </li>
          ))}
        </ul>

        <div className="mt-10 grid grid-cols-2 gap-4 desk:grid-cols-[1.4fr_1fr_1fr]">
          {GALLERY.map((g, i) => (
            <div
              key={g.src}
              className={`relative overflow-hidden rounded-2xl ${
                i === 0 ? "col-span-2 h-[220px] desk:col-span-1 desk:h-[340px]" : "h-[180px] desk:h-[340px]"
              }`}
            >
              <Image src={g.src} alt={g.alt} fill sizes={g.sizes} className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
