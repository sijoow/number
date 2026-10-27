// 여러 화면을 크기별로 찍는다 — node shot-pages.mjs <포트> <폴더> <경로,경로,…> [크기들 1280x800,390x844,844x390]
// /api/progress 는 막아서(실패 처리) 테스트 기록이 서버로 가지 않게 한다. fe 로 로그인(마스터).
import { mkdirSync, writeFileSync } from "node:fs";
const [PORT = "9343", DIR = "shots", PATHS = "/", SIZES = "1280x800,390x844,844x390"] = process.argv.slice(2);
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
await send("Page.enable");
await send("Runtime.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/progress*" }] });
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://localhost:6300/" });
await sleep(2000);
await ev(`fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:"fe",password:"1234"})}).then(r=>r.json()).then(j=>(localStorage.setItem("haon-number:auth",JSON.stringify(j)),true))`);
for (const size of SIZES.split(",")) {
  const [w, h] = size.split("x").map(Number);
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: w < 600 ? 2 : 1, mobile: w < 900 });
  for (const p of PATHS.split(",")) {
    await send("Page.navigate", { url: `http://localhost:6300${p}` });
    await sleep(5500);
    const s = await send("Page.captureScreenshot", { format: "png" });
    const name = `${p.replace(/[^a-z0-9]+/gi, "_") || "home"}-${size}`;
    writeFileSync(new URL(`./${name}.png`, OUT), Buffer.from(s.data, "base64"));
    console.log("찍음", name);
  }
}
console.log("오류", errors.length ? errors.join("\n") : "없음");
await ev(`localStorage.clear(), true`);
await send("Page.navigate", { url: "about:blank" });
await sleep(300);
await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
ws.close();
process.exit(0);
