# 인증 플로우

## 라우트 맵

### 웹

| 경로                     | 역할                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `/auth/signin`           | 통합 로그인. 이메일 + 비밀번호. 유형 구분 없음                                                                          |
| `/auth/signin/pin`       | 간편비밀번호 로그인. 이메일 + 6자리 화면 키패드 → `POST /api/auth/login/pin`                                            |
| `/auth/signup`           | 회원 유형 선택 (개인/법인)                                                                                              |
| `/auth/signup/personal`  | 개인 가입                                                                                                               |
| `/auth/signup/corporate` | 법인 가입                                                                                                               |
| `/auth/signup/borrower`  | 대출자 가입. `POST /api/auth/signup/borrower`, 약관 7종(`credit_inquiry`+`loan_terms` 추가). 완료 시 연결계좌 등록 안내 |
| `/auth/find-id`          | 아이디 찾기. 본인인증 정보(이름/생년월일/휴대폰) → 마스킹된 이메일                                                      |
| `/auth/find-password`    | 비밀번호 재설정. 이메일 → 재설정 토큰 발급 → 새 비밀번호                                                                |

### 네이티브

| 진입              | 동작                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| `/auth` 시작 화면 | `로그인` → WebView `/auth/signin`, `가입하기` → WebView `/auth/signup` |
| `/auth/pin`       | 개인 간편비밀번호 등록. 네이티브 라우트 (WebView 아님)                 |

WebView 라우팅은 `nav.push`/`nav.replace` 브리지가 `/webview?path=<path>`로 감쌈.
네이티브 라우트(`auth/pin` 등)는 `nav.native` 메시지로 `router.push(route)` 직접 호출.

## 가입 스텝

유형 선택(`/auth/signup`) 이후 공통 2스텝. `memberType` prop으로 분기.

| 스텝         | 개인                     | 법인                                |
| ------------ | ------------------------ | ----------------------------------- |
| 1. 계정 정보 | 이메일 + 비밀번호 + 확인 | 동일                                |
| 2. 본인인증  | 전화번호 입력·인증       | 전화번호 인증 + 사업자등록번호 인증 |

### 상태 규칙

- 스텝 입력값은 전부 클라이언트 상태. 서버 제출은 마지막에 일괄 수행.
- 본인인증 실패 시 1단계 입력값 폐기, 스텝 1로 리셋.
- 가입 완료 후 개인만 PIN 유도 → 네이티브 `/auth/pin`. 법인은 완료 화면으로.

## 서버 연동

| 동작            | 엔드포인트                       | 비고                                                                                                                                                                        |
| --------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 가입 제출       | `POST /api/auth/signup`          | `agreements`는 `[{term, agreed}]` 배열. 필수: service/investment/privacy/credit_info/electronic_finance. `member_type`(personal/corporate) + `business_number`(법인) 영속화 |
| 본인인증        | `POST /api/auth/identity/verify` | mock CI 발급. `email`로 비로그인 호출 가능                                                                                                                                  |
| 사업자번호 인증 | 없음                             | 클라이언트 형식 검증(`\d{10}`) 후 signup 시 `business_number`로 저장                                                                                                        |
| 로그인          | `POST /api/auth/login`           | httpOnly 쿠키 + body에 `access_token`/`refresh_token`                                                                                                                       |
| 리프레시        | `POST /api/auth/refresh`         | 쿠키 또는 body `refresh` 둘 다 수락                                                                                                                                         |
| PIN 등록        | `POST /api/auth/pin`             | Bearer access_token                                                                                                                                                         |

## 네이티브 세션

로그인 성공 시 WebView → 네이티브 토큰 이전:

1. 웹이 `POST /api/auth/app-code` 호출 (쿠키 인증) → 일회용 `code` 수신
2. `bridge.exchangeAuthCode(code, next?)` 전송 — `next`는 교환 후 push할 네이티브 라우트 (예: `/auth/pin`)
3. 네이티브가 `POST {WEB_BASE_URL}/api/auth/app-code/exchange` 호출
4. 응답 body의 `refresh_token`/`access_token` → `SecureStore` 저장
5. `router.replace("/")` → index 게이트가 토큰 확인 후 홈 WebView

`auth.signOut` 메시지는 `refresh_token`/`access_token` 삭제 후 `/auth`로 이동.
웹 로그아웃 버튼은 `POST /api/auth/logout` (쿠키 삭제 + refresh blacklist) → `bridge.signOut()`.
`clearSession()`은 삭제 전 `unregisterPushToken()`으로 서버 푸시 토큰을 해지하고,
캐시된 reauth 토큰·대기 중인 reauth 요청을 함께 폐기한다. SecureStore 키는 `STORAGE_KEYS` 상수로 관리.

웹앱 베이스 URL은 `EXPO_PUBLIC_WEB_BASE_URL` (eas.json 프로파일별 env) 로 주입,
미설정 시 dev 폴백 (iOS `localhost:3000`, Android `10.0.2.2:3000`).

## 세션 복원

앱 재시작 시 index 게이트가 `POST /api/auth/refresh`를 body `refresh`로 호출해 유효성 검증.
401/403이면 세션 폐기, 그 외 실패(5xx·네트워크)는 세션을 유지한 채 "unknown"으로 보고.
성공 시 회전된 토큰을 SecureStore에 저장하고, WebView 로드 전 JS를 주입해
`POST /api/auth/refresh`를 WebView 쿠키 컨텍스트에서 한 번 더 호출 — 웹 세션 쿠키 복원.
주입된 fetch는 `window.__restoreSession` promise로 노출 — `apiFetch`가 이를 await하므로
인증 필요 API와 복원 요청의 경합 없음. `Bearer access_token` (PIN 등록처럼 네이티브 직접 호출)도 지원.

앱 코드 발급(`auth.appCode`)과 PIN 검증(`reauth`, `pin`)은 401 시
`validateStoredSession()`으로 액세스 토큰을 한 번 갱신 후 1회 재시도한다.
reauth 대기는 60초 타임아웃과 signout 해소로 래치되지 않는다.

## 미구현/보류

- 사업자번호 인증은 모의 (`POST /api/auth/business-number/verify` — 10자리 형식 검증 +
  예약번호 거부). 실제 국세청 연동 없음
- `로그인 유지` 미체크 시 세션 쿠키(브라우저 종료 시 만료). 체크 시 persistent (refresh 14d)
