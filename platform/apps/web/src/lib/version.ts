import fs from "fs";
import path from "path";

/**
 * Reads the project version from the VERSION file at the repo root.
 * This is meant to be used in Server Components or during build time.
 */
export function getProjectVersion(): string {
  try {
    // Navigate from platform/apps/web/src/lib to the root
    const versionPath = path.resolve(process.cwd(), "..", "..", "..", "VERSION");
    
    // In Docker/Production, process.cwd() is /app
    // and VERSION is copied to /app/VERSION in the Dockerfile
    const dockerVersionPath = path.resolve(process.cwd(), "VERSION");
    
    let finalPath = versionPath;
    if (fs.existsSync(dockerVersionPath)) {
        finalPath = dockerVersionPath;
    }

    const version = fs.readFileSync(finalPath, "utf8");
    return version.trim();
  } catch (error) {
    console.error("Failed to read VERSION file:", error);
    return "Unknown";
  }
}
