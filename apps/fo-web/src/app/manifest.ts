import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  name: "데일리펀딩",
  short_name: "데일리펀딩",
  description: "온라인투자연계금융 플랫폼",
  start_url: "/",
  display: "standalone" as const,
  background_color: "#ffffff",
  theme_color: "#ffffff",
});

export default manifest;
