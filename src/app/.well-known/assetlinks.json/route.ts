/**
 * /.well-known/assetlinks.json — 안드로이드 앱(TWA)이 이 사이트를 주소창 없이 띄우게 하는 확인 파일.
 * 숫자놀이는 한글나라와 다른 앱이라 패키지 이름·서명 키가 따로다(docs/tools/apk/build.cjs).
 * 지문 = `node build.cjs key` 로 만든 서명 키(2026-10-27, 키는 저장소 밖 haon-apk/sujanori). 지문은 비밀이 아니다.
 * 키를 새로 만들면 여기 지문도 바꾸고 다시 배포해야 앱이 주소창 없이 뜬다.
 */
export const dynamic = "force-static";

const PACKAGE = "kr.haon.sujanori";
const FINGERPRINT = "F2:4E:09:20:4C:DB:23:94:64:52:62:F4:C2:79:B0:C8:47:CF:0B:65:E5:9E:95:81:A7:25:F2:0C:AF:7E:EA:A9";

export function GET() {
  const body = FINGERPRINT
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: PACKAGE, sha256_cert_fingerprints: [FINGERPRINT] } }]
    : [];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
