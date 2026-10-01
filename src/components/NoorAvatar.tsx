/** Noor's mark: a blue rounded square with an "N". */
export default function NoorAvatar({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[10px] bg-blue font-extrabold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.41 }}
      aria-hidden="true"
    >
      N
    </span>
  );
}
