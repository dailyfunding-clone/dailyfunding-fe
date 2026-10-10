export default {
  resolve: { alias: { "@": new URL("../../apps/fo-native/src", import.meta.url).pathname } },
  test: { include: ["packages/bridge/tests/**/*.test.ts", "apps/fo-native/tests/**/*.test.ts"] },
};
