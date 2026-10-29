import { FriendArt, Numeral } from "@/components/Art";

/** 노래 그림 — 이름이 숫자면 그 숫자 친구(영은 숫자 0), 아니면 만난 친구가 돌아가며. 노래 화면과 홈 노래 풍선이 같이 쓴다 */
export function SongArt({ n, height, className = "" }: { n: number; height: string; className?: string }) {
  if (n === 0) {
    return (
      <span className={`grid place-items-center rounded-[22%] bg-white shadow ${className}`} style={{ width: `calc(${height} * 0.7)`, height: `calc(${height} * 0.7)` }}>
        <Numeral n={0} className="text-ink" style={{ fontSize: `calc(${height} * 0.5)` }} />
      </span>
    );
  }
  return <FriendArt n={n} height={height} className={className} />;
}
