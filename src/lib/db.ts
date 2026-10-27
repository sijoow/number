/**
 * MongoDB 연결 — 서버(API 라우트)에서만 쓴다. 브라우저에는 접속 주소가 절대 나가지 않는다.
 *   MONGODB_URI  접속 주소 — 한글나라와 같은 클러스터 (.env.local / Vercel 환경변수)
 *   MONGO_DB     숫자놀이 DB — 기본 'haonnumber'. 진도(progress)를 여기에 쓴다
 *   HANGUL_DB    한글나라 DB — 기본 'todohangul'. 계정(users)·설정(progress.settings)을 **읽기만** 한다
 * 두 DB 이름이 같으면 숫자놀이 진도가 한글나라 진도 문서(같은 컬렉션 이름 progress)를 덮어쓴다 — 그래서 아예 멈춘다.
 * 주소가 없으면 configured() 가 false — API 는 503 을 주고 앱은 기기 저장만으로 돈다.
 */

import { MongoClient, type Db } from "mongodb";
import type { Progress, Settings } from "@/lib/progress";

export interface ProgressDoc {
  /** 아이디 */
  _id: string;
  progress: Progress;
  settings: Settings;
  /** 기기가 마지막으로 바꾼 시각(ms) — 더 최신 쪽이 이긴다 */
  updatedAt: number;
  savedAt: Date;
}

/** 한글나라 문서 — 필요한 칸만 (lib/hangul) */
export interface HangulUserDoc {
  _id: string;
  name?: string;
  /** 비밀번호 scrypt 값 — 로그인 확인에만 쓰고 화면으로 내보내지 않는다 */
  hash?: string;
  salt?: string;
  createdAt?: Date;
}
export interface HangulProgressDoc {
  _id: string;
  settings?: unknown;
  progress?: { firstOn?: unknown };
}

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGO_DB || "haonnumber";
const HANGUL_DB = process.env.HANGUL_DB || "todohangul";

// 개발 서버는 파일을 고칠 때마다 모듈을 다시 읽는다 — 연결은 하나만 유지
const g = globalThis as unknown as { _numberMongo?: Promise<MongoClient> };

export function configured(): boolean {
  return Boolean(URI);
}

async function client(): Promise<MongoClient> {
  if (!URI) throw new Error("MONGODB_URI 미설정 (.env.local 을 확인하세요)");
  if (DB_NAME === HANGUL_DB) throw new Error(`MONGO_DB 와 HANGUL_DB 가 같아요(${DB_NAME}) — 한글나라 진도를 덮어쓸 수 있어서 멈춥니다`);
  g._numberMongo ??= new MongoClient(URI, { serverSelectionTimeoutMS: 8000 }).connect().catch((e) => {
    g._numberMongo = undefined;
    throw e;
  });
  return g._numberMongo;
}

/** 숫자놀이 DB */
export async function db(): Promise<Db> {
  return (await client()).db(DB_NAME);
}

export async function progressCollection() {
  return (await db()).collection<ProgressDoc>("progress");
}

/** 한글나라 DB — 읽기만. 여기에 쓰는 코드를 만들지 않는다 */
async function hangulDb(): Promise<Db> {
  return (await client()).db(HANGUL_DB);
}

export async function hangulUsers() {
  return (await hangulDb()).collection<HangulUserDoc>("users");
}

export async function hangulProgress() {
  return (await hangulDb()).collection<HangulProgressDoc>("progress");
}

/** 부모 페이지에 보여 줄 DB 이름 */
export function dbNames(): { own: string; hangul: string } {
  return { own: DB_NAME, hangul: HANGUL_DB };
}
