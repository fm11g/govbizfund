# 오늘의 정책자금 홈페이지 (today-fund-site)

정적 HTML/CSS/JS 사이트입니다. GitHub Pages(또는 아무 정적 호스팅)에 이 폴더를 그대로 올리면 됩니다.
게시판 · 메뉴는 관리자 페이지(`today-fund-admin`)가 이 저장소에 직접 커밋합니다.

## 페이지

| 파일 | 내용 |
|---|---|
| `index.html` | 메인 — 히어로(이번 달 안내 · 승인 현황) · 자금 종류 · 일반대출 vs 정책자금 · 실적 · 후기 · AI 분석 · 절차 · 선택 이유 · 정책자금 소식 · 신청 불가 조건 · 상담 폼 |
| `about.html` · `ceo.html` · `vision.html` | 회사소개 · 인사말 · 비전 |
| `business.html` | 정책자금 종류 안내 — 5가지 자금 비교표 · 상황별 추천 자금 · 자금별 소개 · 진행 절차 |
| `fund-operating.html` · `fund-facility.html` · `fund-export.html` · `fund-refinance.html` · `fund-startup.html` | 자금별 상세 (핵심 조건 → 안내 → 컨설팅 효과 → 지원 세부표 → 운용 기관 → 상담 폼) |
| `contact.html` | 문의하기 — 연락처 · 상담 폼 · FAQ |
| `cases.html` | 자금 확보 사례 — `js/cases.js` 가 `data/cases.json`(관리자 「자금 확보 사례」)으로 그림. 메인 슬라이드 · 자금별 페이지 하단에도 자동 반영 |
| `notice.html` · `fund-info.html` | 정책자금 소식 — 공지사항 · 정책자금 정보 (data/notice.json 을 읽어 그림) |
| `notice-{번호}.html` | 게시글 상세 (관리자가 생성) |
| `privacy.html` · `complete.html` | 개인정보처리방침 · 신청 완료(전환 추적용, noindex) |

## 처음 설정 — `js/config.js` 하나만 고치면 됩니다

- 전화 · 이메일 · 카카오 연결은 넣지 않습니다. 상담은 신청서(Supabase DB)로만 받습니다.
- `company` — 푸터 사업자 정보, 인사말 서명, 개인정보처리방침 책임자 이름
- `supabase.url` · `supabase.anonKey` — 상담 폼 저장 (관리자 README 의 SQL 실행 후 **anon 키**만 입력)

그 밖에 바꿀 곳
- 도메인: 각 html 의 canonical/og 주소(`https://todaypolicyfund.co.kr`), `robots.txt`, `sitemap.xml`
- 광고 픽셀(GA4 · 메타 · 당근): 각 html `<head>` 의 주석 위치. 상담 폼이 `gtag`/`fbq`/`karrotPixel` 이 있으면 전환 이벤트를 보냅니다.
- 자금 확보 사례(`cases.html` · 메인 `#successCases` · 자금 페이지 `#fundCases`), 승인 현황 티커(`#mainHero .mh-tk`), 실적 숫자(`#fundStats`)는 공개 전 실제 사례·수치로 확인하세요
- 연매출 4억 미만 차단: 폼 선택지(비활성) + `js/fund-form.js` 의 `ALLOWED_SALES` + DB `fund_requests_insert` 3중으로 막습니다. 기준을 바꾸면 세 곳을 함께 고치세요.

## 유입 추적 · 숏폼 공장 연동

| 파일 | 역할 |
|---|---|
| `go.html` | 숏폼 추적 링크 `go.html?c=코드&ch=yt|ytc|ig|igc|igp` → `data/shorts.json` 에서 그 숏폼 정보글을 찾아 이동 (`c=today` = 가장 최근 숏폼, 못 찾으면 메인 신청폼). 검색 제외(noindex · robots) |
| `data/shorts.json` | 코드 → 목적지. 관리자 `/api/integration/shorts` 가 커밋 (직접 수정 X) |
| `js/site.js` 맨 위 `TF_TRACK` | 첫 유입 · 마지막 유입을 30일 보관. 채널 판정: `ch` → `utm_source` → 리퍼러(검색·유튜브·인스타·카카오…) → 직접 방문. 숏폼 정보글(`body data-short-code`)로 검색 유입되면 그 코드 + 채널 `seo` |
| `js/fund-form.js` | 신청 시 `track_code · channel · landing_page · first_touch · last_touch` 를 함께 저장 |

정보글(`notice-N.html`)은 관리자가 만듭니다 — 숏폼 공장이 보낸 글은 처음에 목차, 아래에 FAQ · 쇼츠 영상 · 구조화 데이터(Article · Breadcrumb · FAQPage · VideoObject)가 붙습니다.
`notice-7.html` 은 공장 자동 발행 글 **예시**(코드 261119a1b2)입니다. 실제 운영 전에 관리자에서 숨기거나 삭제하세요.

## 구조 규칙

- 각 섹션은 `id` 하나를 스코프로 자기 `<style>` 을 가집니다 (전역 디자인 CSS 없음, container query 단위 사용, 애니메이션도 섹션 안에서만)
- 공통 틀만 `css/layout.css` (#siteHeader · #subVisual · #siteFooter · #quickDock), 리셋은 `css/base.css`
- `js/site.js` — 헤더/모바일 메뉴/푸터/퀵 버튼/서브 탭을 `data/site-menu.json` 으로 그립니다
- `js/fund-form.js` — `[data-fund-form]` 상담 폼 검증 · 저장 · 완료 페이지 이동. 게시글 상세의 `[data-fund-form-mount]` 자리에는 `partials/fund-form.html` 을 불러와 붙입니다
- `js/board.js` — `[data-board-list]` 게시판, `[data-board-preview]` 메인 미리보기
