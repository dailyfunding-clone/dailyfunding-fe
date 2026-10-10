# @dailyfunding/fo-web

데일리펀딩 클론의 고객용 웹. 웹 브라우저와 `fo-native` WebView 하이브리드(`ReactNativeWebView` 브릿지)에서 동일하게 동작한다.

## 기능

- 투자 상품 목록/상세 — 서버 필터 + 클라이언트 필터, SSE 실시간 진행률
- 투자 주문 — reauth 게이트, 멱등 키 주문, 이중탭/다중탭 방지, 실패 코드 → UX 매핑
- 장바구니, 예약 투자, 투자적합성 테스트
- 마이페이지 — 대시보드, 상환 캘린더, 내역, 예치금 충전/출금, 투자 등급, 포인트
- 대출 소개/신청, 한도 조회
- 콘텐츠 — 공지/FAQ/이벤트/뉴스/약관/공시
- 인증 — 로그인/회원가입/찾기, 앱 내 브릿지 네비게이션·reauth

## 스택

- Next.js 16 App Router (`cacheComponents`, React Compiler) + React 19 + TypeScript strict
- TanStack Query — 클라이언트 데이터/캐시. `@dailyfunding/api-client`(ky+effect, OpenAPI 타입)
- `@dailyfunding/bridge` — WebView 브릿지. `@dailyfunding/design-system` — 토큰/컴포넌트
- Sass(scss, CSS Modules 아님), zod 폼 검증, Vitest + Testing Library, Storybook

## 구조

```
src/
  app/                    라우트 (site)/auth + 전역 layout/loading/error/not-found
    (site)/investment/_components/  투자 도메인 UI·훅
      lib/                map-error, order-attempt-store (IndexedDB)
  apps/                   앱 셸 — providers, ui(site-header/footer, webview-bridge, vitals-reporter)
  entities/               콘텐츠 엔티티 (fetchers, query, pagination)
  features/               auth (AuthGate, ReauthProvider, useReauth)
  shared/
    api/                  api 클라이언트, 세션 갱신(401→refresh→retry), 포매터
    lib/                  스키마, app-navigate, 훅
    session/              useMe, useSignOut
    ui/                   AppLink, FilterRow
```

## 실행

```bash
pnpm --filter @dailyfunding/fo-web dev          # next dev (API는 /api/* → localhost:8000)
pnpm --filter @dailyfunding/fo-web build        # next build
pnpm --filter @dailyfunding/fo-web test         # vitest run
pnpm --filter @dailyfunding/fo-web typecheck    # tsc --noEmit
pnpm --filter @dailyfunding/fo-web lint         # eslint .
pnpm --filter @dailyfunding/fo-web storybook    # :6006
pnpm --filter @dailyfunding/api-client sync-schema  # BE 스키마 → schema.d.ts 재생성
```

## 주요 설계 결정

- **주문 정합성** — `useInvestOrder` 상태머신(`idle→reauth→submitting→confirming→done|failed`). 주문 시도는 IndexedDB(`df-invest-orders`)에 `{idempotencyKey, input, phase}`로 남아 리마운트/탭 간에도 같은 키·payload로 재개. 네트워크 실패만 동일 멱등 키 자동 재시도 1회, 4xx/5xx는 `mapError`로 사유 매핑 후 즉시 종료. 다중탭은 BroadcastChannel(`df-invest-order`)로 단일 소유자를 정하고 후속 탭은 결과를 확인(GET)만 한다.
- **실시간 진행률** — `useProductStream(ids)`: `GET /api/products/stream?ids=` SSE, 16ms 버퍼 배칭 → `setQueryData(["product-progress", id])`. 카드는 `ProductProgress`(memo)가 자기 필드만 구독. 재연결/오류 시 `/api/products?ids=` 스냅샷으로 갭 메우기, `visibilitychange` 중단/재개, EventSource 미지원 시 3초 폴링.
- **캐시 무효화** — 상품 목록 SSR은 `"use cache"` + `cacheLife("products")`(15s) + `cacheTag("products")`. 주문 성공 시 `"use server"` 액션 `revalidateProducts()`가 `updateTag("products")`로 즉시 만료. 주문 생성은 클라이언트→Django 직행이라 route handler 대신 server action 경로를 사용.
- **측정** — `VitalsReporter`가 CLS/FCP/INP/LCP를 `navigator.sendBeacon`으로 `POST /api/metrics/vitals` (`{name, value, path, ts}`) 전송.
- **브릿지** — 세션은 쿠키 기반 + 401 시 `/api/auth/refresh` 후 `ky.retry()`. 네이티브 주입 `__restoreSession` 대기는 브릿지 v2(hello/auth.getState) 전환과 함께 제거됨.

## 측정 결과

- `docs/results/vitals-baseline.json` — /investment 첫 화면 TTFB/FCP/LCP 베이스라인
- 루트 `docs/` — 프로젝트 계획, 인증 플로우
