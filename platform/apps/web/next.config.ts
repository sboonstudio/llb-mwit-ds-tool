import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Read version from VERSION file at build time
let projectVersion = "Unknown";
try {
  const versionPath = path.resolve(process.cwd(), "VERSION");
  if (fs.existsSync(versionPath)) {
    projectVersion = fs.readFileSync(versionPath, "utf8").trim();
  }
} catch (e) {
  console.warn("Failed to read VERSION during build");
}

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    instrumentationHook: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: projectVersion,
  }
};

export default nextConfig;
