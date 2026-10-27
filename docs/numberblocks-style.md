# 넘버블록스 그림체 조사 (2026-10-27)

숫자놀이 그림(힉스필드 생성)의 기준. `[n]` = 아래 출처, **[관찰]** = refs 두 장을 확대해 본 것, **[추론]** = 근거가 약한 것.
그림 프롬프트 문구는 `scripts/image-style.mts`, 친구 생김새는 `src/curriculum/friends.ts` 의 `look` 이 이 문서를 따른다.

## 1. 그림체

- **3D CG 유아 애니메이션** [9][18] — Alphablocks Ltd(Joe Elliot × Blue Zoo) [10]. "얼굴·팔·다리가 있고 머리 위에 숫자가 뜬 알록달록한 블록" [6], 블록 수 = 숫자 [1].
- **재질·빛** [관찰]: 모서리가 살짝 둥근 큐브, 블록 사이 가는 이음선(하나씩 셀 수 있게), 반무광~새틴 교구 플라스틱(하이라이트 약함), 밝고 부드러운 낮빛, 부드러운 바닥 그림자. **검은 외곽선 없음**, 무늬 없는 단색 면.
- **얼굴** [관찰]: 맨 위 블록(네모 배열이면 윗줄) 앞면. 흰자가 큰 동그란 눈 + 검은 동공, 눈 테두리는 몸색의 진한 톤. 코·귀 없음, 작은 분홍·빨강 입.
- **팔다리**: 위쪽 블록 옆에서 나온 가는 튜브 팔, 맨 아래 블록 밑 짧은 다리 둘 [관찰]. 몸보다 어두운 톤(일: 빨강→진빨강) [11]. 손가락은 거의 없음 [11] — **오·십만 다섯 손가락 큰 장갑** [1][4].
- **넘버링**: 머리 위에 뜬 검은 숫자 = 블록 수 [9][4](십은 '1''0' 둘 [1]). 서체 공식 자료 없음 — 레퍼런스에선 둥근 산세리프, 머리보다 작게 [관찰].
- **합체·분리**: 위로 올라타면 다음 수로 변신(일+이→삼) [1][6], 나뉘면 작은 친구들이 된다(이십→십 둘) [5]. → 앱의 「모아 보기」가 이 장면.

## 2. 숫자 친구 0~10

| # | 색 | 기본 배열 | 시그니처 | 눈 | 성격 |
|---|---|---|---|---|---|
| 0 | 몸 없음 | — | 입과 검은 '0'만 [11] | — | "아무것도 없는 수" [4] |
| 1 | 밝은 빨강 [1] | 1칸 | — | 큰 외눈 [1] | 가장 작고 용감 [1] |
| 2 | 주황 [1] | 세로 2 | 반짝이 댄스 구두 [1], 동그란 안경(보라) [6][12] | 동그란 안경 | 춤 "one-two" [1] |
| 3 | 밝은 노랑 [1] | 세로 3 | 빨간 세 갈래 모자(three-pointed hat) [1], 저글링 공 3개, 가운데 블록 빨간 단추 3개 [11] | 주황 테 [관찰] | 공연가 "1, 2, 3, 나를 봐!" [1] |
| 4 | 초록 [1] | **2×2**(세로도) [5][11] | 네모 눈썹 4개 [1] | 네모 눈 [11] | 정사각형이라 신남 [1] |
| 5 | 파랑·청록 [1][11] | 세로 5 | 별 모양 눈 하나(자기 오른눈), 왼손 남색 큰 장갑 [1][6][11] | 별 눈 | 밴드 리더, 하이파이브 [1] |
| 6 | 남보라(indigo) [1] | **2×3** [5] | 주사위 점 — 2×3 이면 블록마다 점 하나, 세로면 블록마다 주사위 눈 [11] | 눈마다 속눈썹 3개 [11] | 주사위·라임 [1] |
| 7 | 무지개 [1] | 세로 7 | 머리 위 무지개 줄무늬 7개 — 아래 빨강부터 위 보라 머리까지 [1][11][4] | 노란 테 [관찰] | 행운 [1] |
| 8 | 분홍·자홍 [1][11] | **2×4**(세로도) [5][11] | 문어 다리 8개(팔 6·다리 2), 보라 ∞ 모양 가면 [1][4][11] | 가면 | "옥토블록!" [1] |
| 9 | 회색 3단(위가 진함) [1] | **3×3** [1] | 손수건 9장, 재채기하면 가운데 블록이 튀어나감 [1] | **네모 눈 + 긴 눈썹(안경 아님)** [11] | 크고 힘센 정사각 [1] |
| 10 | 흰색 + 빨간 모서리 [1] | 세로 10 [4] | 로켓 변신 [1], 장갑 [4] | 빨간 별 눈 [1][5] | 10부터 카운트다운 [1] |

**공식 색값은 없다.** 인물구성2 에서 뽑은 근사값(조명·JPEG 영향) [관찰]:
일 `#D30C18` · 이 `#FE9329` · 삼 `#E1CE12` · 사 `#41D100` · 오 `#2DBDD8` · 육 `#5729BF` · 팔 `#EB28A0` ·
칠(아래→위) `#EF1410 #FE8D09 #F0EB1A #44D901 #50D7F7 #6C1AE9` + 연보라 머리 · 구(위→아래) `#898D90 → #A5AAAD → #C4C8C9` · 십 `#EFEFEF` + 테두리 `#EF3E3E`

**레퍼런스와 다르게 알고 있던 것**: 구는 안경이 아니라 굵은 테의 네모 눈(안경다리 그리지 말 것) · 삼의 '왕관'은 공식으로 세 갈래 모자 · 육의 보라는 공식 이름 indigo · 사·육·팔·구는 네모 배열과 세로 기둥 둘 다 맞는 모습.

## 3. 넘버랜드·넘버블롭

- 넘버랜드는 행성 [9] — 해 비치는 들판·울타리 정원·해바라기 [7], 별밤 숲·호수 징검돌 [8], 숫자 행성들(칠은 무지개 행성) [5], 친구들을 닮은 나무 [4].
- 색 [관찰 B]: 진한 하늘색 → 연하늘 하늘, 흰 뭉게구름, 겹겹 연두 언덕 + 흰 안개 띠, 라임색 잔디. 디테일 최소. (인물구성도 바탕은 연민트 단색)
- **넘버블롭**: 동글동글한 작은 친구들 [4] — 입 다문 것·벌린 것 두 가지 [22]. 인물구성도 아래쪽의 색 공(작은 눈 둘 + 넓은 입) [관찰].

## 4. 로고 — 앱에는 넣지 않는다

"Number" 는 글자마다 다른 색(N 빨강·u 주황·m 노랑·b 초록·e 하늘·r 보라), "BLOCKS" 는 파란 큐브 타일 위 흰 글자, O 자리에 일 [관찰][13].
이름과 로고는 Alphablocks Ltd 상표 [4] — 집에서만 써도 앱 화면에 공식 로고는 넣지 않는다. 인물구성2 의 "응군팩토리 :)" 는 남의 워터마크라 생성용 레퍼런스에서 지운다(`refs/gen/`).

## 5. 한국어판

- 공식 유튜브 「넘버블록스 - 한국 - 공식 채널」(구독 약 36만) [14][15], 2023-03 한국어판 출시 [16]. 정식 표기는 **넘버블록스**(넘버블럭스는 팬 표기) [17][21].
- **캐릭터 이름은 한자어** — 공식 한국어 페이지 "넘버블록 일·이·삼…십" [2], 에피소드 "1 일", "58. 십오" [14], 국내 도서 「넘버블록 일부터 십까지」 [19]. 고유어는 구호("하나 둘 셋 - 가자!") [3]·수량에만.
- 공식 용어: 넘버랜드·넘버블롭 [3]. 방송: EBS 방영은 확인 안 됨 [17][21], LG U+ 아이들나라 블록스 시리즈 330편(2024-06) [18].
- 나무위키는 한국 공식 채널의 제목·가사 오역을 지적한다 [17].
- **앱도 친구 이름은 일·이·삼** — 2026-10-27 사용자 결정(카드 소개도 한자어 읽기, 7절). 셀 때·몇 개·숫자 찾기는 하나·둘·셋, 만나기에서 "삼! 셋이라고도 해."로 두 읽기를 같이.

## 6. 프롬프트 요령

넣을 말: ① 3D CG preschool animation still, toy-like matte plastic cubes with softly rounded edges ② made of exactly N cubes, visible seams(2×2·2×3 배열은 따로 적기) ③ one solid colour per character ④ big round eyes and small mouth on the front of the top cube, no nose, no ears ⑤ thin dark stubby arms, two short legs under the bottom cube ⑥ small black numeral floating above the head ⑦ 표의 시그니처 ⑧ bright soft daylight, sky-blue sky, white clouds, lime-green hills, no outlines.

흔한 실수(생성 뒤 꼭 확인): 블록 개수가 틀림(세어 볼 것) · 레고 돌기·나뭇결 · 이음선이 사라져 매끈한 막대 · 모두에게 사람 손가락 · 숫자가 몸 위에 쓰이거나 색이 들어감 · 칠 무지개 순서 뒤집힘 · 2D 납작 그림·검은 외곽선 · 로고·워터마크 글자를 베낌.

## 7. 친구 성격 — 사용자가 찾은 국내 카드 소개(`refs/card-intro`, 2026-10-27)

넘버블록 카드 상품 페이지 캡처 4장(1~20 자기소개). 앱에는 원문을 옮기지 않고 4살 눈높이 한 줄로 줄였다(`src/curriculum/friends.ts` INTRO).

| # | 카드 소개 요지 | 앱의 한 줄 |
|---|---|---|
| 1 | 가장 작지만 용감, 새 생각을 많이 하고 제일 먼저 나서서 계획 | 나는 제일 작지만 용감해! 뭐든 제일 먼저 해 볼래. |
| 2 | 단짝이 필요, 둘이면 뭐든 함께, 마법 댄스 슈즈 | 나는 짝꿍이 좋아! 둘이서 신나게 춤추자! |
| 3 | 만능 재주꾼, "하나, 둘, 셋, 나를 봐!" 저글링·묘기·마술 | 나는 재주꾼이야! 하나, 둘, 셋, 나를 봐! |
| 4 | 바위처럼 단단, 늘 남을 도울 준비, 정사각형일 때 제일 힘이 셈 | 나는 바위처럼 단단한 네모야! 도움이 필요하면 불러 줘. |
| 5 | 친절한 대장, 늘 하이파이브, 손가락 5개로 다섯까지 세기 | 하이파이브! 손가락 다섯 개를 활짝 펴 볼까? |
| 6 | 게임의 천재, 마법 주사위, 시 짓기·만들기, 1×6·2×3·3×2 로 변신 | 나는 주사위 놀이가 좋아! 같이 굴려 볼래? |
| 7 | 행운, 무지개를 만나 일곱 가지 색 | 나는 행운을 가져다줘! 무지개처럼 일곱 가지 색이야. |
| 8 | 슈퍼 히어로 옥토블록, 팔(다리?) 8개, 무엇이든 빨리 | 나는 슈퍼 히어로 옥토블록! 팔이 여덟 개야! |
| 9 | 4처럼 정사각형이 좋음, 재채기하면 가운데 블록이 튀어나와 8, 3등분도 | 나는 커다란 네모야! 에취! 재채기하면 가운데 블록이 쏙! |
| 10 | 로켓으로 변신, 변신을 제일 많이, 별 모양 반짝 | 나는 로켓으로 변신해! 열, 아홉, 여덟, 발사! |

11~20(축구 선수 11, 직사각형 12, 장난꾸러기 13, 스케이트 14, 계단 모양 비밀요원 15, 파티 16, 미술가 17, 초스피드 18, 신기한 모양 19, 댄스 20)도 캡처에 있다 — 범위를 20까지 넓힐 때 쓴다.

**이름 읽기**: 카드 소개는 숫자로 "넘버블록 1이야 · 2야 · 3이야 · 4야 · 9야 · 10이야"라고 적는다 — 붙은 조사(이야/야)가 일·이·삼·사·구·십 받침에 맞으니 **한자어로 읽는 이름**이다(공식 한국어판과 같다, 5절).

## 출처

1. https://www.blocksuniverse.tv/numberblocks/how-it-works
2. https://www.blocksuniverse.tv/numberblocks/how-it-works-ko
3. https://www.blocksuniverse.tv/numberblocks/apps-ko
4. https://www.children.alabama.gov/wp-content/uploads/2023/05/NB_1-10_Guide-Alabama.pdf (hand2mind × Alphablocks, 2021)
5. https://www.tvokids.com/transcript/5004515/preschool/numberblocks/videos/rockets-and-rekenreks
6. https://www.tvokids.com/transcript/125266/preschool/numberblocks/videos/numberblock-castle · https://tvokids.com/transcript/130465/preschool/numberblocks/videos/numberblocks-express
7. https://www.tvokids.com/transcript/5004513/preschool/numberblocks/videos/tall-sun
8. https://www.tvokids.com/transcript/5004503/preschool/numberblocks/videos/leap-blob
9. https://en.wikipedia.org/wiki/Numberblocks
10. https://www.awn.com/news/blue-zoo-animations-numberblocks-launching-cbeebies
11. numberblocks.fandom.com 검색 발췌 — /wiki/1, Four_(character), Six_(character), Zero_(character), File:9.png, File:SevenWeirdL.PNG, File:8Thign2.JPG, File:FiveT.JPG
12. https://thetoyinsider.com/numberblocks-one-and-two-playful-pals-review · https://en.everybodywiki.com/Numberblocks (검색 발췌)
13. https://1000logos.net/numberblocks-logo/
14. https://www.youtube.com/channel/UCR9zv3dquE6GURdKGJkVz-g
15. https://playboard.co/en/channel/UCR9zv3dquE6GURdKGJkVz-g
16. https://www.blocksuniverse.tv/blocksnews/numberblocks-bursts-into-5-new-international-language-markets-as-blocks-youtube-channels-hit-10m
17. https://namu.wiki/w/Numberblocks
18. https://www.lg.co.kr/media/release/27817 · https://www.smarttoday.co.kr/ko-kr/articles/53490
19. https://www.wendybook.com/category/series/detail/2608
20. https://apps.apple.com/kr/app/id1445555400
21. https://dubdb.fandom.com/wiki/넘버블럭스 (검색 발췌)
22. https://cogstoysandgames.ie/products/numberblocks-numberblob-counters
