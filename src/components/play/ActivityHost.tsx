"use client";

import type { BuiltActivity } from "@/lib/rounds";
import { Arith } from "./activities/Arith";
import { Build } from "./activities/Build";
import { Clap } from "./activities/Clap";
import { Compare } from "./activities/Compare";
import { CountTap } from "./activities/CountTap";
import { FindNum } from "./activities/FindNum";
import { HowMany } from "./activities/HowMany";
import { Join } from "./activities/Join";
import { Meet } from "./activities/Meet";
import { NextNum } from "./activities/NextNum";
import { Pattern } from "./activities/Pattern";
import { ShapeFind } from "./activities/ShapeFind";
import { SizeCompare } from "./activities/SizeCompare";
import { Sort } from "./activities/Sort";
import { Trace } from "./activities/Trace";
import type { OnDone } from "./types";

/** 놀이 판 하나 — 오늘의 놀이와 놀이터가 같이 쓴다. assess 는 도장 놀이(틀리면 정답을 보여 주고 다음) */
export function ActivityHost({ built, assess, onDone }: { built: BuiltActivity; assess: boolean; onDone: OnDone }) {
  switch (built.kind) {
    case "meet":
      return <Meet n={built.n} onDone={onDone} />;
    case "count":
      return <CountTap rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "how-many":
      return <HowMany rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "find-num":
      return <FindNum rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "build":
      return <Build rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "trace":
      return <Trace digits={built.digits} onDone={onDone} />;
    case "clap":
      return <Clap rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "compare":
      return <Compare rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "next-num":
      return <NextNum rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "shape":
      return <ShapeFind rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "pattern":
      return <Pattern rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "join":
      return <Join rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "size":
      return <SizeCompare rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "add":
    case "subtract":
      return <Arith op={built.kind} rounds={built.rounds} assess={assess} onDone={onDone} />;
    case "sort":
      return <Sort rounds={built.rounds} assess={assess} onDone={onDone} />;
  }
}
