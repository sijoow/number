// 잘림 점검 — 폰 크기마다 화면을 돌며, 화면·상자 밖으로 잘려 나가 볼 수도 스크롤로 닿을 수도 없는 요소를 센다.
// node clip-audit.mjs <포트> <폴더> [크기들] [화면 이름들]   · /api/progress 는 막는다(fe 서버 기록 보호)
//   예) node clip-audit.mjs 9343 clip 900x412 parent,play-build-20   (Git Bash 에서는 MSYS_NO_PATHCONV=1)
import { mkdirSync, writeFileSync } from "node:fs";
const [PORT = "9343", DIR = "clip", SIZES = "360x640,412x780,740x340,900x412", ONLY = ""] = process.argv.slice(2);
const OUT = new URL(`./${DIR}/`, import.meta.url);
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
const errors = [];
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, (m) => res(m.result ?? m));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
  if (m.method === "Fetch.requestPaused") void send("Fetch.failRequest", { requestId: m.params.requestId, errorReason: "Failed" });
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;
const click = (sel, nth = 0) => ev(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})][${nth}]; b?.click(); return !!b; })()`);
const clickText = (t) => ev(`(() => { const b = [...document.querySelectorAll("button, a")].find((x) => x.textContent.replace(/\\s+/g, " ").includes(${JSON.stringify(t)})); b?.click(); return !!b; })()`);

const AUDIT = `(() => {
  const W = innerWidth, H = innerHeight, out = [];
  const scrolls = (cs) => /(auto|scroll)/.test(cs.overflowY) || /(auto|scroll)/.test(cs.overflowX);
  const hides = (cs) => cs.overflowX === "hidden" || cs.overflowY === "hidden" || cs.overflowX === "clip" || cs.overflowY === "clip";
  const outside = (r, b) => r.bottom > b.bottom + 3 || r.right > b.right + 3 || r.top < b.top - 3 || r.left < b.left - 3;
  // 문서 자체가 세로로 스크롤되면(부모 페이지처럼 긴 페이지) 아래쪽도 스크롤로 닿는다 — 세로만 문서 끝까지 본다(가로로 넘친 건 그대로 잘림)
  const doc = document.scrollingElement;
  const docScrolls = doc.scrollHeight > H + 3 && ![document.documentElement, document.body].some((x) => /(hidden|clip)/.test(getComputedStyle(x).overflowY));
  const view = { top: docScrolls ? -doc.scrollTop : 0, left: 0, right: W, bottom: docScrolls ? doc.scrollHeight - doc.scrollTop : H };
  for (const el of document.querySelectorAll("button, a, img, p, h1, h2, h3, canvas, li, input")) {
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || Number(cs.opacity) < 0.05 || cs.display === "none") continue;
    if (el.closest("[aria-hidden=true]")) continue;
    let why = null;
    let a = el.parentElement;
    for (; a; a = a.parentElement) {
      const acs = getComputedStyle(a);
      if (scrolls(acs)) {
        // 스크롤 상자 안 — 상자 자체가 화면 밖으로 잘리면 닿을 수 없다
        const ar = a.getBoundingClientRect();
        if (outside(ar, view)) why = "스크롤 상자가 화면 밖: " + a.className.slice(0, 60);
        // 가운데 정렬 + 스크롤: 위로 넘친 것은 스크롤로도 못 올라간다
        else if (a.scrollTop === 0 && r.top < ar.top - 3 && a.scrollTop + r.top - ar.top < -3) why = "위로 넘쳐 못 올라감: " + a.className.slice(0, 60);
        break;
      }
      if (hides(acs) && outside(r, a.getBoundingClientRect())) { why = "상자에 잘림: " + a.className.slice(0, 60); break; }
    }
    if (!a && !why && outside(r, view)) why = "화면 밖";
    if (why) out.push({ el: el.tagName + " " + (el.innerText || el.alt || el.getAttribute("aria-label") || "").replace(/\\s+/g, " ").slice(0, 18), r: [r.left, r.top, r.right, r.bottom].map(Math.round), why });
  }
  return { n: out.length, page: { scrollH: doc.scrollHeight, H, docScrolls }, items: out.slice(0, 6) };
})()`;

await send("Page.enable");
await send("Runtime.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/progress*" }] });
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://localhost:6300/" });
await sleep(2500);
await ev(`fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:"fe",password:"1234"})}).then(r=>r.json()).then(j=>(localStorage.setItem("haon-number:auth",JSON.stringify(j)),true))`);

// 들어가 볼 화면 — [이름, 주소, 그다음 누를 것들] (숫자놀이 화면 — 한글나라 목록에서 바꿈, 2026-10-27)
// 오늘의 놀이 속 화면은 미리 보기로 바로 연다: /play?preview=c<장>d<날>&step=<몇 번째 놀이>&auto=1 (진도에 안 남고 판 고정)
const FLOWS = [
  ["home", "/", []],
  ["free", "/free", []],
  ["free-count", "/free", [["text", "하나씩 세기"]]],
  ["free-build", "/free", [["text", "블록 쌓기"]]],
  ["friends", "/friends", []],
  ["friend-modal", "/friends", [["text", "3삼"]]],
  ["write", "/write", []],
  ["write-board", "/write", [["sel", "button[aria-label='셋']", 0]]],
  ["parent", "/parent", []],
  ["play-ready", "/play", []],
  // 장 번호는 업체 목표 순서(1~10장 = A1~A10, 11~20장 = B1~B10)
  ["play-meet", "/play?preview=c1d1&auto=1", []],
  ["play-shape-names", "/play?preview=c2d1&auto=1", []],
  ["play-size", "/play?preview=c9d1&auto=1", []],
  ["play-meet-11", "/play?preview=c11d1&auto=1", []],
  ["play-count-20", "/play?preview=c11d4&step=2&auto=1", []],
  ["play-trace-19", "/play?preview=c14d2&step=3&auto=1", []],
  ["play-add", "/play?preview=c15d1&auto=1", []],
  ["play-how-many-20", "/play?preview=c16d2&auto=1", []],
  ["play-subtract", "/play?preview=c17d1&auto=1", []],
  ["play-build-20", "/play?preview=c18d2&auto=1", []],
  ["play-sort", "/play?preview=c19d1&auto=1", []],
  ["play-compare-num", "/play?preview=c20d1&auto=1", []],
];

const report = [];
for (const size of SIZES.split(",")) {
  const [w, h] = size.split("x").map(Number);
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  for (const [name, path, steps] of FLOWS.filter(([n]) => !ONLY || ONLY.split(",").includes(n))) {
    await send("Page.navigate", { url: `http://localhost:6300${path}` });
    await sleep(4500);
    for (const [kind, arg, nth] of steps) {
      if (kind === "sel") await click(arg, nth ?? 0);
      else await clickText(arg);
      await sleep(2600);
    }
    const r = await ev(AUDIT);
    report.push({ size, name, ...r });
    const s = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(new URL(`./${name}-${size}.png`, OUT), Buffer.from(s.data, "base64"));
    console.log(`${size} ${name}: 잘림 ${r?.n ?? "?"}${r?.items?.length ? " — " + r.items.map((x) => `${x.el}(${x.why.slice(0, 40)})`).join(" | ") : ""}`);
  }
}
writeFileSync(new URL(`./report.json`, OUT), JSON.stringify(report, null, 1));
console.log("오류", errors.length ? errors.slice(0, 5).join("\n") : "없음");
await ev(`localStorage.clear(), true`);
await send("Page.navigate", { url: "about:blank" });
await sleep(300);
await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
ws.close();
process.exit(0);
