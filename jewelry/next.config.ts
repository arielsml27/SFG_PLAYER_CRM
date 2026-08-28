import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // הפרויקט יושב בתוך ריפו שיש בו אפליקציה נוספת. בלי לקבע את השורש,
  // Turbopack מטפס עד ה-lockfile של הריפו ומושך קבצים של האפליקציה השנייה.
  turbopack: { root: path.resolve(process.cwd()) },
  outputFileTracingRoot: path.resolve(process.cwd()),
};

export default nextConfig;
