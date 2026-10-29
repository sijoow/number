import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanTitle, clockOf, numberOfTitle } from "./songTitle.ts";

test("노래 이름 — 확장자·트랙 번호·가수 이름을 뗀다", () => {
  assert.equal(cleanTitle("일.mp3"), "일");
  assert.equal(cleanTitle("01. 일.mp3"), "일");
  assert.equal(cleanTitle("01 - 오.m4a"), "오");
  assert.equal(cleanTitle("03 삼.mp3"), "삼");
  assert.equal(cleanTitle("넘버블럭스 - 영.mp3"), "영");
  assert.equal(cleanTitle("나의 모든 것 - 넘버블럭스 - 한국.mp3"), "나의 모든 것");
  assert.equal(cleanTitle("Numberblocks - One Wonderful World.mp4"), "One Wonderful World");
  // 숫자로 시작하는 노래 이름은 그대로
  assert.equal(cleanTitle("3-2-1 발사.mp3"), "3-2-1 발사");
  assert.equal(cleanTitle("10 little numbers.mp3"), "10 little numbers");
  assert.equal(cleanTitle("넘버블럭스.mp3"), "넘버블럭스");
});

test("노래 이름이 숫자면 그 숫자 친구", () => {
  assert.equal(numberOfTitle("일"), 1);
  assert.equal(numberOfTitle("오"), 5);
  assert.equal(numberOfTitle("영"), 0);
  assert.equal(numberOfTitle("십이"), 12);
  assert.equal(numberOfTitle("셋"), 3);
  assert.equal(numberOfTitle("7"), 7);
  assert.equal(numberOfTitle("나의 모든 것"), null);
  assert.equal(numberOfTitle("넘버블럭스 급행"), null);
  assert.equal(numberOfTitle("21"), null);
});

test("재생 시간", () => {
  assert.equal(clockOf(225), "3:45");
  assert.equal(clockOf(58.6), "0:59");
  assert.equal(clockOf(0), "");
  assert.equal(clockOf(Number.NaN), "");
});
