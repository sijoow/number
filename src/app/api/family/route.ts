import { userFrom } from "@/lib/auth-server";
import { configured, hangulProgress, hangulUsers } from "@/lib/db";
import { familyFromHangul } from "@/lib/hangul";

/*
 * 한글나라에서 받아오는 아이 정보·설정 — 같은 클러스터의 한글나라 DB 를 읽기만 한다(lib/hangul).
 * 로그인한 아이디의 것을 준다. 관리자(마스터)는 ?profile=아이디 로 아이 것을 본다(관리자 화면).
 * 비밀번호 값(hash·salt)은 읽지도 내보내지도 않는다 — 이름만.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = userFrom(req);
  if (!user) return Response.json({ error: "login" }, { status: 401 });
  if (!configured()) return Response.json({ error: "db-off" }, { status: 503 });
  const asked = new URL(req.url).searchParams.get("profile");
  let profile = user.id;
  if (asked && asked !== user.id) {
    if (user.role !== "master" || !/^[a-z0-9_-]{2,32}$/.test(asked)) return Response.json({ error: "forbidden" }, { status: 403 });
    profile = asked;
  }
  try {
    const [u, p] = await Promise.all([
      (await hangulUsers()).findOne({ _id: profile }, { projection: { name: 1 } }),
      (await hangulProgress()).findOne({ _id: profile }, { projection: { settings: 1, "progress.firstOn": 1 } }),
    ]);
    return Response.json({ family: familyFromHangul(u, p, Date.now()) });
  } catch (e) {
    console.error("[api/family] GET", e);
    return Response.json({ error: "db-error" }, { status: 502 });
  }
}
