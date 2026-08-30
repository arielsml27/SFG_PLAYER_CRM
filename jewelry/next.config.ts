import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // הפרויקט יושב בתוך ריפו שיש בו אפליקציה נוספת. בלי לקבע את השורש,
  // Turbopack מטפס עד ה-lockfile של הריפו ומושך קבצים של האפליקציה השנייה.
  turbopack: { root: path.resolve(process.cwd()) },
  outputFileTracingRoot: path.resolve(process.cwd()),
  // תמונות נוסעות בגוף ה-Server Action כ-data URL. ברירת המחדל של Next
  // היא 1MB — כלומר שלוש תמונות טלפון מוקטנות ומעלה נחתכות באמצע.
  experimental: { serverActions: { bodySizeLimit: "16mb" } },
};

export default nextConfig;
