# @dailyfunding/fo-native

데일리펀딩 클론의 모바일 앱. Expo Router 기반 하이브리드 — 탭 셸(홈/투자/마이)은 네이티브, 상세 플로우는 `fo-web` WebView 브릿지(`ReactNativeWebView` postMessage)로 제공한다.

## 스크린샷

전체 화면 스크린샷: [`docs/screenshots/fo-native/`](../../../docs/screenshots/fo-native/)

## 구조

```
src/
  app/                  Expo Router — (tabs)/index·investment·mypage, webview, auth, +native-intent
  features/
    auth/               세션 토큰(SecureStore), generation 카운터, PIN, reauth
    webview/            브릿지 채널 — auth.exchange/appCode, nav, title
    deeplink/           URL scheme/유니버설 링크 처리
    network/            네트워크 상태
    updates/            expo-updates OTA
```

## 실행

```bash
pnpm --filter @dailyfunding/fo-native dev        # expo start (dev client)
pnpm --filter @dailyfunding/fo-native android    # expo run:android
pnpm --filter @dailyfunding/fo-native test       # vitest
pnpm --filter @dailyfunding/fo-native typecheck  # tsc --noEmit
pnpm --filter @dailyfunding/fo-native lint       # expo lint
```

`EXPO_PUBLIC_WEB_BASE_URL`이 WebView가 로드할 fo-web 주소를 정한다. Android 에뮬레이터에서는 `http://10.0.2.2:3000`.
