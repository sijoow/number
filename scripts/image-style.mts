/**
 * 넘버블록스 그림체 문구 — scripts/image-prompts.mts 가 그림마다 붙인다.
 * 근거: docs/numberblocks-style.md(2026-10-27 조사 — 공식·팬 자료 + refs 인물구성도 확대 관찰). 6절 "프롬프트 요령"을 그대로 옮겼다.
 * 숫자 친구 생김새는 src/curriculum/friends.ts 의 LOOK, 블록 배치는 image-prompts 의 formOf.
 */

/** 모든 그림 — 렌더·재질·빛 */
export const STYLE =
  "Numberblocks-style 3D CG preschool animation still, exactly like the reference images: toy-like matte plastic look with softly rounded edges, bright solid colours, bright soft daylight, gentle soft shadows, no black outlines, no textures.";

/** 숫자 친구가 나오는 그림 — 몸 만듦새(조사 1절) */
export const CHAR =
  "Each Numberblock is made of equal cubes with thin visible seams between them, in its own solid colours exactly as described (most are one colour; Seven is a rainbow, Nine has three greys, Ten is white with red edges), big round cartoon eyes and a small mouth on the front of the top cube, no nose, no ears, thin darker stubby arms from the sides and two short legs under the bottom cube, no LEGO studs, no human fingers unless it wears gloves.";

/** 숫자 친구 머리 위 숫자(넘버링) — 친구 그림에만 */
export const numberAbove = (n: number) => `A small black rounded numeral "${n}" floats just above its head (not on the body).`;

export const AS_REF = "Match this character in the reference images exactly: same colours, same face, same accessories, and exactly the right number of cubes — count them.";

export const NO_TEXT = "No logos, no watermarks, no other text or letters.";

export const CUTOUT = "Centred with a small margin, fully transparent background, no ground, no shadow.";

/** 넘버랜드 — 조사 3절의 색(진한 하늘 → 연하늘, 흰 구름, 겹겹 연두 언덕 + 흰 안개 띠, 라임 잔디) */
export const SCENE = "Numberland setting: sky-blue sky fading lighter toward the horizon, puffy white clouds, smooth layered lime-green hills with a soft white mist band, minimal detail.";

/** 세는 물건 — 영어 이름(프롬프트용). 넘버블록스 세계의 소품처럼 매끈하고 단순하게 */
export const THING_EN: Record<string, string> = {
  apple: "red apple",
  strawberry: "red strawberry",
  banana: "yellow banana",
  cookie: "round cookie",
  balloon: "red balloon",
  star: "yellow star",
  ball: "football",
  car: "little red toy car",
  flower: "pink flower",
  fish: "little orange fish",
  chick: "little yellow chick",
  butterfly: "colourful butterfly",
};

/** 첫 화면 메뉴 아이콘 — 숫자 친구가 그 놀이를 하는 모습 */
export const MENU_SCENE: Record<string, string> = {
  free: "Numberblocks One and Two playing happily together on a little slide, small icon.",
  games: "Numberblocks One and Two playing a board game together, One holding up a big white toy die with red dots, small icon.",
  friends: "Numberblocks One, Two and Three standing side by side waving, small icon.",
  write: "Numberblock Three holding a big yellow pencil, small icon.",
};

/** 놀이터 카드 장면 — 숫자 친구가 그 놀이를 하는 모습 */
export const GAME_SCENE: Record<string, string> = {
  count: "Numberblock Three pointing at three red apples one by one, counting.",
  "how-many": "Numberblock Two looking curiously at a small group of strawberries.",
  "find-num": "Numberblock Four listening carefully with one hand behind its eye, happy.",
  build: "Numberblock Five stacking plain toy cubes into a tower.",
  clap: "Numberblock Six clapping its hands, cheerful.",
  compare: "Numberblocks Two and Five standing next to each other, comparing heights.",
  "next-num": "Numberblocks One, Two and Three standing in a row on a path, with an empty space next to Three.",
  shape: "Numberblock Four next to a big circle, a triangle and a square floating in the air.",
  pattern: "Numberblock Seven arranging a row of alternating red and blue balls on the grass.",
  join: "Numberblock Two jumping on top of Numberblock One to join together, magical sparkle.",
  // 크기·빼기·나누기는 처음에 레퍼런스의 1~10 줄 세우기가 뒤에 같이 그려져 카드끼리 구분이 안 됐다 → "그 친구만"(2026-10-27 다시 뽑음)
  size: "Only Numberblock Four in the scene, standing next to a big red triangle and a small red triangle on the grass, pointing at the big one. No other Numberblocks anywhere.",
  add: "Numberblock Two and Numberblock One standing on either side of a big chunky plus-sign shaped toy, happy.",
  subtract: "Only Numberblock Two in the scene, waving goodbye to one single cube with a happy face that floats up and away like a balloon. No other Numberblocks anywhere.",
  sort: "Only Numberblock Five in the scene, putting colourful toy shapes into two baskets on the grass — red shapes into a red basket and blue shapes into a blue basket. No other Numberblocks anywhere.",
};
