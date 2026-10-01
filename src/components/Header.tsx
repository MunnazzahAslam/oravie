import Logo from "./Logo";
import { buttonBase } from "./ui";

const LINKS = [
  { href: "#treatments", label: "Treatments" },
  { href: "#first-visit", label: "Your first visit" },
  { href: "#dentists", label: "Dentists" },
  { href: "#treatments", label: "Prices" },
  { href: "#visit", label: "Contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-11 px-5 desk:h-[76px] desk:justify-start desk:px-10">
        <a href="#top" aria-label="Oravie Dental Studio, back to top">
          <Logo />
        </a>
        <nav aria-label="Main" className="hidden flex-1 gap-[30px] text-[15px] font-semibold text-[#33445B] desk:flex">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="transition-colors hover:text-blue">
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href="#noor"
          data-open-noor
          className={`${buttonBase} h-10 bg-blue px-3.5 text-sm text-white hover:bg-blue-hover desk:h-12 desk:px-[22px] desk:text-[15px]`}
        >
          Book appointment
        </a>
      </div>
    </header>
  );
}
