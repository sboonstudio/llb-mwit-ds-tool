import fs from "fs";
import path from "path";

/**
 * Reads the project version from the VERSION file.
 * In Docker/Production, VERSION is in /app/VERSION.
 * In Local Dev, VERSION is synced to platform/apps/web/VERSION.
 */
export function getProjectVersion(): string {
  try {
    const versionPath = path.resolve(process.cwd(), "VERSION");
    
    if (fs.existsSync(versionPath)) {
        return fs.readFileSync(versionPath, "utf8").trim();
    }
    
    return "0.4.1-alpha"; // Fallback
  } catch (error) {
    console.error("Failed to read VERSION file:", error);
    return "Unknown";
  }
}
