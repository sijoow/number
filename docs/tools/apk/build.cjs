// 하온이의 숫자놀이 — 안드로이드 시험판(TWA). 보이스동화(10-20) 때 받아 둔 JDK 17 · 안드로이드 SDK · @bubblewrap/core 를 빌려 쓴다
// (한글나라 build.cjs 를 옮겨 와 패키지·키·폴더만 바꿈, 2026-10-27).
//   node build.cjs key            서명 키를 (처음 한 번) 만들고 SHA-256 지문을 보여 준다 — src/app/.well-known/assetlinks.json 에 넣는다
//   node build.cjs <사이트 주소>   그 사이트의 웹 매니페스트로 out/haon-number-test.apk 를 만든다
// 서명 키·비밀번호(keys.json)는 저장소 밖 KEYDIR 에만 — 화면에 찍지 않는다. 키를 잃으면 다음 APK 가 기존 앱 위에 안 깔린다(백업할 것).
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const DONG = "C:/Users/YOGIBO~1/AppData/Local/Temp/claude/c--Users-Yogibo-Design-Desktop-Dong/f0d0f72c-8637-4ba5-993a-4f2d651a2bb7/scratchpad/apk-build";
const { Config, JdkHelper, AndroidSdkTools, TwaManifest, TwaGenerator, KeyTool, GradleWrapper, ConsoleLog } = require(path.join(DONG, "node_modules", "@bubblewrap", "core"));

// 윈도우: Bubblewrap 은 실행 경로 키를 "Path" 로 쓴다 — "PATH" 와 갈라지면 keytool 을 못 찾는다(보이스동화 때 겪음)
if (process.platform === "win32") {
  const p = process.env.PATH || process.env.Path || "";
  delete process.env.PATH;
  process.env.Path = p;
}

// 경로에 띄어쓰기("Yogibo Design")가 있으면 윈도우의 안드로이드 도구(zipalign·apksigner)가 깨진다 — 짧은 경로(YOGIBO~1)를 쓴다
// 서명 키는 오래 남는 곳(KEYDIR), gradle 프로젝트·결과물은 지워져도 되는 임시 폴더(B)
const KEYDIR = "C:/Users/YOGIBO~1/haon-apk/sujanori";
const B = "C:/Users/YOGIBO~1/AppData/Local/Temp/claude/c--Users-Yogibo-Design-Desktop-nmber/781fd5a2-20ba-40c7-b3e7-dff395d02204/scratchpad/apk-number";
const PACKAGE_ID = "kr.haon.sujanori";
const ALIAS = "sujanori";
const APK_NAME = "haon-number-test.apk";
const KEYSTORE = path.join(KEYDIR, "sujanori.keystore");
const KEYS_JSON = path.join(KEYDIR, "keys.json");
const PROJECT = path.join(B, "project");
const OUT = path.join(B, "out");

const randomPassword = () => crypto.randomBytes(18).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 20);

(async () => {
  const log = new ConsoleLog("apk");
  const config = new Config(path.join(DONG, "jdk", "jdk-17.0.20.1+1"), path.join(DONG, "sdk"));
  const jdk = new JdkHelper(process, config);
  const keyTool = new KeyTool(jdk, log);

  fs.mkdirSync(KEYDIR, { recursive: true });
  if (!fs.existsSync(KEYS_JSON)) {
    // PKCS12 는 키 비밀번호가 저장소 비밀번호와 같아야 한다
    const pass = randomPassword();
    fs.writeFileSync(KEYS_JSON, JSON.stringify({ storePass: pass, keyPass: pass }, null, 2));
  }
  const { storePass, keyPass } = JSON.parse(fs.readFileSync(KEYS_JSON, "utf8"));
  if (!fs.existsSync(KEYSTORE)) {
    await keyTool.createSigningKey({
      path: KEYSTORE,
      alias: ALIAS,
      password: storePass,
      keypassword: keyPass,
      fullName: "Haon Sujanori",
      organizationalUnit: "Family",
      organization: "Haon",
      country: "KR",
    });
  }
  const info = await keyTool.keyInfo({ path: KEYSTORE, alias: ALIAS, password: storePass, keypassword: keyPass });
  const sha256 = info.fingerprints.get("SHA256");
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "key-info.json"), JSON.stringify({ packageId: PACKAGE_ID, sha256 }, null, 2));
  if (process.argv[2] === "key") {
    console.log("KEY", PACKAGE_ID, sha256);
    return;
  }

  const sdkOnly = process.argv[2] === "sign";
  if (sdkOnly) {
    // gradle 은 끝났고 정렬·서명만 다시 — out/haon-number-test.apk
    const sdk = await AndroidSdkTools.create(process, config, jdk, log);
    const unsigned = path.join(PROJECT, "app", "build", "outputs", "apk", "release", "app-release-unsigned.apk");
    const aligned = path.join(OUT, "app-release-unsigned-aligned.apk");
    const apk = path.join(OUT, APK_NAME);
    await sdk.zipalign(unsigned, aligned);
    await sdk.apksigner(KEYSTORE, storePass, ALIAS, keyPass, aligned, apk);
    fs.rmSync(aligned, { force: true });
    console.log("DONE", apk, PACKAGE_ID, sha256);
    return;
  }
  const SITE = (process.argv[2] || "").replace(/\/$/, "");
  if (!/^https:\/\//.test(SITE)) throw new Error("쓰는 법: node build.cjs https://<사이트>");
  const sdk = await AndroidSdkTools.create(process, config, jdk, log);
  if (!(await sdk.checkBuildTools())) throw new Error("build-tools 가 없다");

  const twa = await TwaManifest.fromWebManifest(`${SITE}/manifest.webmanifest`);
  twa.packageId = PACKAGE_ID;
  twa.launcherName = "숫자놀이";
  twa.startUrl = "/";
  twa.signingKey = { path: KEYSTORE, alias: ALIAS };
  twa.appVersionCode = 1;
  twa.appVersionName = "0.1.0-test";
  // 방향은 앱 안 '화면 보기' 설정(lib/orientation)이 고정한다 — 앱 틀은 기기를 따른다
  twa.orientation = "default";
  twa.display = "fullscreen";
  twa.fallbackType = "customtabs";
  twa.enableNotifications = false;
  twa.minSdkVersion = 24;
  twa.generatorApp = "bubblewrap-core-script";
  const problem = twa.validate();
  if (problem) throw new Error(`twa-manifest: ${problem}`);
  console.log("TWA", JSON.stringify({ name: twa.name, launcherName: twa.launcherName, iconUrl: twa.iconUrl, host: twa.host }));

  fs.rmSync(PROJECT, { recursive: true, force: true });
  await new TwaGenerator().createTwaProject(PROJECT, twa, log);
  await twa.saveToFile(path.join(PROJECT, "twa-manifest.json"));
  // 크롬으로 열기 + 카메라 자리까지 꽉 차게(보이스동화 덧대기에서 태블릿 가로 고정만 뺌)
  require("./patch-launcher.cjs")(path.join(PROJECT, "app", "src", "main", "java", ...PACKAGE_ID.split("."), "LauncherActivity.java"));
  fs.appendFileSync(path.join(PROJECT, "gradle.properties"), "\norg.gradle.daemon=false\n");
  if (process.platform === "win32") process.env.Path = PROJECT + ";" + process.env.Path;

  const gradle = new GradleWrapper(process, sdk, PROJECT);
  await gradle.assembleRelease();
  const unsigned = path.join(PROJECT, "app", "build", "outputs", "apk", "release", "app-release-unsigned.apk");
  const aligned = path.join(OUT, "app-release-unsigned-aligned.apk");
  const apk = path.join(OUT, APK_NAME);
  await sdk.zipalign(unsigned, aligned);
  await sdk.apksigner(KEYSTORE, storePass, ALIAS, keyPass, aligned, apk);
  fs.rmSync(aligned, { force: true });
  console.log("DONE", apk, PACKAGE_ID, sha256);
})().catch((e) => {
  console.error("FAILED", e && e.stack ? e.stack : e);
  process.exit(1);
});
