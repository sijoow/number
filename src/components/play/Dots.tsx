/** 수만큼 점 — 다섯씩 한 줄(업체 숫자 카드 위 점·따라 쓰기 옆 점처럼). size 는 점 하나 지름(CSS 길이), 0 이면 빈자리 */
export function Dots({ n, size, tone = "butter-deep", className = "" }: { n: number; size: string; tone?: string; className?: string }) {
  const gap = `calc(${size} * 0.35)`;
  return (
    <span className={`inline-flex flex-col items-center ${className}`} style={{ gap, minHeight: size }} aria-label={`점 ${n}개`}>
      {Array.from({ length: Math.ceil(n / 5) }, (_, r) => (
        <span key={r} className="flex" style={{ gap }}>
          {Array.from({ length: Math.min(5, n - r * 5) }, (_, i) => (
            <span key={i} className="rounded-full" style={{ width: size, height: size, background: `var(--${tone})` }} />
          ))}
        </span>
      ))}
    </span>
  );
}
