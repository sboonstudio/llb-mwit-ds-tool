import fs from "fs";
import path from "path";

/**
 * Reads the project version.
 * Prioritizes the NEXT_PUBLIC_APP_VERSION environment variable set at build time.
 * Falls back to reading the VERSION file from the filesystem.
 */
export function getProjectVersion(): string {
  // Try environment variable first (Build time injection)
  if (process.env.NEXT_PUBLIC_APP_VERSION) {
    return process.env.NEXT_PUBLIC_APP_VERSION;
  }

  // Fallback to runtime filesystem read (Local dev or edge cases)
  try {
    const versionPath = path.resolve(process.cwd(), "VERSION");
    
    if (fs.existsSync(versionPath)) {
        return fs.readFileSync(versionPath, "utf8").trim();
    }
  } catch (error) {
    console.error("Failed to read VERSION file:", error);
  }

<<<<<<< HEAD
  return "0.4.5"; // Final fallback
=======
  return "0.4.6-alpha"; // Final fallback
>>>>>>> main
}

