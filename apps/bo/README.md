# @dailyfunding/bo

데일리펀딩 클론의 운영자용 백오피스. Next.js App Router — 상품/배치/예치금/등급/대출/콘텐츠/시드 관리.

## 스크린샷

전체 화면 스크린샷: [`docs/screenshots/bo/`](../../../docs/screenshots/bo/)

## 구조

```
src/app/
  admin/
    products/           상품 등록·상태 전이
    batch/              상환 실행·배치 수동 트리거
    deposit-holds/      예치금 보류 처리
    grade-requests/     투자자 등급 변경 심사
    loan-applications/  대출 신청 심사
    contents/           공지/이벤트/FAQ/약관 관리
    seed/               데모 데이터 시드
  auth/                 운영자 로그인
```

## 실행

```bash
pnpm --filter @dailyfunding/bo dev        # next dev (기본 :3001)
pnpm --filter @dailyfunding/bo build      # next build
pnpm --filter @dailyfunding/bo test       # vitest
pnpm --filter @dailyfunding/bo typecheck  # tsc --noEmit
```
