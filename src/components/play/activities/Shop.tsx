"use client";

import { useEffect, useMemo, useState } from "react";
import { FriendArt, Numeral, ThingArt } from "@/components/Art";
import { SpeechBubble } from "@/components/ui";
import { LINES, shopAsk, shopName } from "@/curriculum/lines";
import { countUp } from "@/curriculum/numbers";
import { thingOf } from "@/curriculum/things";
import { answerFeedback, useTurn } from "@/lib/answer";
import type { ShopRound } from "@/lib/rounds";
import { useStep } from "@/lib/steps";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/useTimers";
import { say, stopVoice } from "@/lib/voice";
import { HandHint } from "../HandHint";
import { HeldGhost, useDragPick } from "../dragPick";
import type { OnDone } from "../types";

/*
 * 가게 놀이 — 숫자 친구 손님이 물건을 달라고 한다.
 *   이름으로 하나(r.named, 레벨 A — 업체 「동물 마트」 그대로, 2026-10-29 사용자): "딸기를 주세요!" 선반의 서로 다른 물건 셋 중 그것을 바구니에 끌어 넣으면(눌러도 된다)
 *     바로 "고마워!" 하고 떠난다. 다른 물건이면 그 이름을 말하고 흔들릴 뿐 선반에 그대로.
 *   수만큼(놀이터): "사과 세 개 주세요!" 담고 「다 담았어!」 — 바구니에 든 것을 누르면 선반으로. 틀리면 많다·모자라다·다른 물건을 알려 주고 다시.
 * 도장 놀이는 첫 번째 답만 점수.
 */

/** 물건 하나 — 폰 가로(높이 384px)에서도 손가락으로 집을 만하게 */
const ITEM = "min(13vh, calc(8*var(--vw)))";

export function Shop({ rounds, assess, onDone }: { rounds: ShopRound[]; assess: boolean; onDone: OnDone }) {
  const [idx, setIdx] = useState(0);
  useStep(idx, rounds.length);
  const [basket, setBasket] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const later = useTimers();
  const turn = useTurn();
  const r = rounds[idx];
  const ask = useMemo(() => (r.named ? [shopName(thingOf(r.thing).name)] : [thingOf(r.thing).name, shopAsk(r.n)]), [r]);
  // 이름으로 하나 — 잘못 고른 물건이 잠깐 흔들린다
  const [bump, setBump] = useState<number | null>(null);

  useEffect(() => {
    void say(idx === 0 ? [LINES.shop, ...ask] : ask);
    return () => stopVoice();
  }, [idx, ask]);

  const put = (i: number) => {
    if (leaving || basket.includes(i)) return;
    setBasket([...basket, i]);
    sfx.pop();
  };
  const takeOut = (i: number) => {
    if (leaving) return;
    setBasket(basket.filter((x) => x !== i));
    sfx.tick();
  };


  const next = (s: number) => {
    setLeaving(true);
    later(() => {
      if (idx + 1 >= rounds.length) {
        onDone({ correct: s, total: rounds.length });
        return;
      }
      setIdx(idx + 1);
      setBasket([]);
      setTries(0);
      setLeaving(false);
    }, 1400);
  };

  const check = () => {
    if (leaving) return;
    const alive = turn();
    const wanted = basket.filter((i) => r.shelf[i] === r.thing).length;
    const otherIn = basket.some((i) => r.shelf[i] !== r.thing);
    // 담은 것을 하나, 둘 세어 준다(다른 물건은 빼고)
    const counted = wanted > 0 ? countUp(Math.min(wanted, 20)) : [];
    if (!otherIn && wanted === r.n) {
      const s = tries === 0 ? score + 1 : score;
      setScore(s);
      void answerFeedback({ name: counted, right: true, then: [LINES.shopThanks], alive }).then((ok) => ok && next(s));
      return;
    }
    setTries(tries + 1);
    const why = otherIn ? LINES.shopOther : wanted > r.n ? LINES.shopTooMany : LINES.shopTooFew;
    if (assess) {
      void answerFeedback({ name: counted, right: false, then: [why], alive }).then((ok) => ok && next(score));
      return;
    }
    void answerFeedback({ name: counted, right: false, then: [why, ...ask], alive });
  };


  /** 이름으로 하나 — 맞는 물건이면 바구니에 담고 손님이 떠난다. 다른 물건이면 그 이름을 말하고 선반에 그대로 */
  const pickNamed = (i: number) => {
    if (leaving || basket.length) return;
    const alive = turn();
    if (r.shelf[i] === r.thing) {
      setBasket([i]);
      sfx.pop();
      const s = tries === 0 ? score + 1 : score;
      setScore(s);
      void answerFeedback({ name: [], right: true, then: [LINES.shopThanks], alive }).then((ok) => ok && next(s));
      return;
    }
    setTries(tries + 1);
    setBump(i);
    later(() => setBump(null), 500);
    const name = [thingOf(r.shelf[i]).name];
    if (assess) {
      void answerFeedback({ name, right: false, then: [LINES.shopNotThis], alive }).then((ok) => ok && next(score));
      return;
    }
    void answerFeedback({ name, right: false, then: [LINES.shopNotThis, ...ask], alive });
  };

  const { held, begin } = useDragPick<number>((i, zone, tapped) => {
    if (!tapped && zone !== "basket") return;
    if (r.named) pickNamed(i);
    else put(i);
  });
  return (
    <div className="flex min-h-full items-center justify-center-safe px-3 py-2">
      <div className="relative flex w-[min(96vw,64rem)] flex-col overflow-hidden rounded-[2rem] bg-[#fdf1df] ring-4 ring-white/80">
        {/* 가게 차양 */}
        <div aria-hidden className="h-[min(4.5vh,2.2rem)] shrink-0 bg-[repeating-linear-gradient(90deg,var(--sky-deep)_0_2.4rem,#fff_2.4rem_4.8rem)]" />
        <div className="flex items-stretch gap-[2.5vw] px-[2.5vw] pb-[2vh] pt-[1.5vh] portrait:flex-col portrait:items-center">
          {/* 손님 — 달라는 수와 같은 숫자 친구. 말풍선에 물건·수 */}
          <div key={idx} className={`flex shrink-0 flex-col items-center justify-end gap-2 ${leaving ? "animate-walk-out" : "animate-pop-in"}`}>
            <SpeechBubble tail="down" className="flex items-center gap-2 px-4 py-2 text-2xl">
              <ThingArt id={r.thing} size="min(8vh, calc(5*var(--vw)))" />
              {r.named ? (
                <span className="whitespace-nowrap">{shopName(thingOf(r.thing).name)}</span>
              ) : (
                <>
                  <Numeral n={r.n} className="text-brand" style={{ fontSize: "min(8vh, calc(5*var(--vw)))" }} />
                  <span className="whitespace-nowrap">개 주세요!</span>
                </>
              )}
            </SpeechBubble>
            <FriendArt n={r.friend} height="min(36vh, 15rem)" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-[2vh] portrait:w-full">
            {/* 선반 */}
            <div className="flex flex-col items-stretch">
              <div className="flex min-h-[min(15vh,7rem)] flex-wrap items-end justify-center gap-[1.4vh] px-2 pb-1">
                {r.shelf.map((id, i) =>
                  basket.includes(i) ? null : (
                    <button
                      key={`${idx}-${i}`}
                      type="button"
                      aria-label={thingOf(id).name}
                      onPointerDown={begin(i)}
                      style={{ touchAction: "none" }}
                      className={`transition-transform active:scale-90 ${held?.moved && held.item === i ? "opacity-30" : ""} ${bump === i ? "animate-shake" : ""}`}
                    >
                      <ThingArt id={id} size={ITEM} />
                    </button>
                  ),
                )}
              </div>
              <span aria-hidden className="h-[min(2.4vh,1.1rem)] rounded-full bg-[#c98b55] shadow-[0_6px_0_#a46a3c]" />
            </div>
            {/* 바구니 + 다 담았어 */}
            <div className="flex items-center gap-[2vw] portrait:flex-col portrait:gap-3">
              <div
                data-drop="basket"
                className={`flex min-h-[min(17vh,8rem)] min-w-0 flex-1 flex-wrap items-center justify-center gap-[1vh] rounded-[1.6rem] border-[6px] px-3 py-1.5 transition-colors portrait:w-full ${held?.over === "basket" ? "border-brand bg-brand-soft" : "border-[#e0524c] bg-white/85"}`}
                style={{ boxShadow: "inset 0 -10px 0 rgb(224 82 76 / 0.15)" }}
              >
                {basket.length === 0 && <span className="font-body text-xl text-ink-soft">여기에 담아요</span>}
                {basket.map((i) => (
                  <button key={`b-${i}`} type="button" aria-label={`${thingOf(r.shelf[i]).name} 빼기`} onClick={() => !r.named && takeOut(i)} className="animate-drop-in transition-transform active:scale-90">
                    <ThingArt id={r.shelf[i]} size={`calc(${ITEM} * 0.85)`} />
                  </button>
                ))}
              </div>
              {!r.named && (
                <button type="button" onClick={check} disabled={basket.length === 0 || leaving} className="cta shrink-0 whitespace-nowrap rounded-full px-8 py-4 text-3xl font-extrabold disabled:opacity-50">
                  다 담았어!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <HeldGhost held={held}>{(i) => <ThingArt id={r.shelf[i]} size={ITEM} />}</HeldGhost>
      <HandHint on={idx === 0 && basket.length === 0} from={`[aria-label="${thingOf(r.thing).name}"]`} to={`[data-drop="basket"]`} />
    </div>
  );
}
