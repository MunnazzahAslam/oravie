type SectionTitleProps = {
  id: string;
  title: string;
  sub?: string;
  /** Colour for the subline; defaults to slate. */
  subClassName?: string;
};

export default function SectionTitle({ id, title, sub, subClassName = "text-slate" }: SectionTitleProps) {
  return (
    <>
      <h2 id={id} className="text-[30px] leading-[1.1] font-extrabold tracking-[-0.03em] desk:text-[40px]">
        {title}
      </h2>
      {sub && <p className={`mt-3.5 max-w-[560px] text-[17px] leading-[1.6] font-medium ${subClassName}`}>{sub}</p>}
    </>
  );
}
