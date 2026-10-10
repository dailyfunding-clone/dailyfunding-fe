import { TabWebView, WebViewPrewarm } from "@/features/webview";

const HomeTabScreen = () => (
  <>
    <TabWebView path="/" />
    <WebViewPrewarm />
  </>
);

export default HomeTabScreen;
