/**
 * /.well-known/assetlinks.json — 안드로이드 앱(TWA)이 이 사이트를 주소창 없이 띄우게 하는 확인 파일.
 * 숫자놀이는 한글나라와 다른 앱이라 패키지 이름·서명 키가 따로다(docs/tools/apk/build.cjs).
 * 아직 서명 키를 안 만들었다 — `node build.cjs key` 로 만든 지문을 FINGERPRINT 에 넣고 다시 배포한다. 지문은 비밀이 아니다.
 */
export const dynamic = "force-static";

const PACKAGE = "kr.haon.sujanori";
const FINGERPRINT = "";

export function GET() {
  const body = FINGERPRINT
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: PACKAGE, sha256_cert_fingerprints: [FINGERPRINT] } }]
    : [];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
