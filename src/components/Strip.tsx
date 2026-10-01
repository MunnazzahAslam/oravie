const POINTS = [
  { title: "Prices before treatment", text: "A written plan with costs after your first visit." },
  { title: "Evenings and Sundays", text: "Until 21:00 Mon to Sat, 10:00 to 18:00 Sun." },
  { title: "Emergency slots daily", text: "Same-day times kept free for pain or damage." },
  { title: "Gentle with nerves", text: "Longer appointments and a pause whenever you ask." },
];

export default function Strip() {
  return (
    <div className="border-y border-line bg-ice">
      <ul className="mx-auto grid max-w-[1200px] grid-cols-2 gap-[18px] px-5 py-[30px] desk:grid-cols-4 desk:gap-6 desk:px-10">
        {POINTS.map((p) => (
          <li key={p.title}>
            <p className="text-base font-bold">{p.title}</p>
            <p className="text-sm leading-normal font-medium text-slate">{p.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
