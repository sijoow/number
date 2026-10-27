import { userFrom } from "@/lib/auth-server";
import { configured, progressCollection } from "@/lib/db";
import { listChildren } from "@/lib/users";

/*
 * 관리자(마스터) 전용 — 아이 목록(한글나라 계정) + 아이마다 숫자놀이 진도(문서 그대로).
 * 계정 만들기·비밀번호·지우기는 한글나라 관리자 페이지에서 한다(숫자놀이는 한글나라 DB 에 쓰지 않는다).
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = userFrom(req);
  if (!user) return Response.json({ error: "login" }, { status: 401 });
  if (user.role !== "master") return Response.json({ error: "forbidden" }, { status: 403 });
  try {
    const children = await listChildren();
    if (!configured()) return Response.json({ db: false, children: children.map((c) => ({ ...c, saved: null })) });
    const docs = await (await progressCollection()).find({ _id: { $in: children.map((c) => c.id) } }).toArray();
    return Response.json({
      db: true,
      children: children.map((c) => {
        const d = docs.find((x) => x._id === c.id);
        return { ...c, saved: d ? { progress: d.progress, settings: d.settings, updatedAt: d.updatedAt } : null };
      }),
    });
  } catch (e) {
    console.error("[api/admin/children] GET", e);
    return Response.json({ error: "db-error" }, { status: 502 });
  }
}
