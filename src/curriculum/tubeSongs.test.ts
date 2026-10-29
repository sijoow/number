import assert from "node:assert/strict";
import { test } from "node:test";
import { numberOfTitle } from "../lib/songTitle.ts";
import { songHref, TUBE_SONGS, tubeKey } from "./tubeSongs.ts";

test("유튜브 노래 — 영상 번호 11자, 겹치지 않고, 이름이 있다", () => {
  assert.ok(TUBE_SONGS.length > 0);
  for (const t of TUBE_SONGS) {
    assert.match(t.id, /^[\w-]{11}$/);
    assert.ok(t.title.trim());
  }
  assert.equal(new Set(TUBE_SONGS.map((t) => t.id)).size, TUBE_SONGS.length);
  // 「일」은 일 친구가 노래 그림
  assert.equal(numberOfTitle(TUBE_SONGS.find((t) => t.id === "t3oy6Jrd5vc")?.title ?? ""), 1);
});

test("유튜브 노래 열쇠 — 폰 파일 번호와 안 겹치고, 노래 화면 주소로 바로 튼다", () => {
  assert.equal(tubeKey("t3oy6Jrd5vc"), "yt:t3oy6Jrd5vc");
  assert.equal(songHref(tubeKey("t3oy6Jrd5vc")), "/songs?play=yt%3At3oy6Jrd5vc");
  assert.equal(new URLSearchParams(songHref("1730000000000-0-ab12cd").split("?")[1]).get("play"), "1730000000000-0-ab12cd");
});
