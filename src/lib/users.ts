/**
 * 아이 계정 — 한글나라 것을 그대로 쓴다(2026-10-27 사용자: 로그인 계정은 한글나라에서 받아온다).
 *   마스터·환경변수 계정  ACCOUNTS (한글나라와 같은 값 — fe 등)
 *   관리자가 만든 아이 계정  한글나라 DB users 컬렉션 { _id: 아이디, name, hash, salt } — scrypt, 한글나라 lib/users 와 같은 방식
 * 숫자놀이는 계정을 만들거나 지우지 않는다 — 아이 계정은 한글나라 관리자 페이지에서 만든다.
 * DB 가 없으면(로컬·미설정) ACCOUNTS 의 계정만 쓴다.
 */

import { scryptSync, timingSafeEqual } from "node:crypto";
import { accounts } from "@/lib/auth-server";
import { checkLogin, type TokenUser } from "@/lib/auth-token";
import { configured, hangulUsers } from "@/lib/db";

function hashOf(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString("hex");
}

/** 로그인 확인 — 환경변수 계정 먼저, 없으면 한글나라 아이 계정 */
export async function login(id: string, password: string): Promise<TokenUser | null> {
  const fromEnv = checkLogin(accounts(), id, password);
  if (fromEnv) return fromEnv;
  if (!configured()) return null;
  const doc = await (await hangulUsers()).findOne({ _id: id.trim().toLowerCase() });
  if (!doc?.hash || !doc.salt) return null;
  const a = Buffer.from(hashOf(password, doc.salt), "hex");
  const b = Buffer.from(doc.hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b) ? { id: doc._id, role: "child" } : null;
}

/** 관리자 화면의 아이 목록 — 환경변수 아이 계정 + 한글나라 아이 계정 */
export async function listChildren(): Promise<{ id: string; name: string; source: "env" | "hangul" }[]> {
  const env = accounts()
    .filter((a) => a.role === "child")
    .map((a) => ({ id: a.id, name: a.id, source: "env" as const }));
  if (!configured()) return env;
  const docs = await (await hangulUsers()).find({}, { projection: { name: 1, createdAt: 1 } }).sort({ createdAt: 1 }).toArray();
  return [...env, ...docs.filter((d) => !env.some((e) => e.id === d._id)).map((d) => ({ id: d._id, name: d.name || d._id, source: "hangul" as const }))];
}
