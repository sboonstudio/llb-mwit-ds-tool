import { syncIntelligence } from '../src/lib/intelligence.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = 'file:../../infrastructure/data/nextjs/dev.db';

async function main() {
  console.log("Manual Sync Started...");
  try {
    const result = await syncIntelligence();
    console.log("Sync Result:", result);
  } catch (e) {
    console.error("Sync Failed:", e);
  }
}

main();
