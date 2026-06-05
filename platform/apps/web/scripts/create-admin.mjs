import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import readline from 'readline';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // 1. Load Dotenv if available (optional in Docker)
  try {
    const { default: dotenv } = await import('dotenv');
    const envPath = path.join(__dirname, '../../../.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  } catch (e) {
    // Ignore if dotenv is missing
  }

  // 2. Detect environment and Database Path
  const isDocker = fs.existsSync('/.dockerenv') || process.env.NODE_ENV === 'production';
  let dbPath;
  
  if (isDocker) {
    dbPath = '/app/data/dev.db';
  } else {
    const infraPath = path.resolve(__dirname, '..', '..', '..', '..', 'infrastructure', 'data', 'nextjs', 'dev.db');
    const prismaPath = path.resolve(__dirname, '..', 'prisma', 'dev.db');
    dbPath = fs.existsSync(infraPath) ? infraPath : prismaPath;
  }

  console.log(`Using database at: ${dbPath}`);

  if (!isDocker && !fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  let email = process.argv[2];
  let password = process.argv[3];
  const isSilent = process.argv.includes('--silent');

  if (!email || !password) {
    if (isSilent) {
      // Use defaults from .env or constants if silent and no args
      email = process.env.INITIAL_ADMIN_EMAIL || 'admin@sboon.org';
      password = process.env.INITIAL_ADMIN_PASSWORD || 'admin543';
    } else {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      const question = (query) => new Promise((resolve) => rl.question(query, resolve));

      console.log('\n--- Admin Creation (Interactive Mode) ---');
      if (!email) email = await question('Enter Admin Email: ');
      if (!password) password = await question('Enter Admin Password: ');
      console.log('-----------------------------------------\n');
      rl.close();
    }
  }

  if (!email || !password) {
    console.error('Error: Email and password are required.');
    process.exit(1);
  }

  let betterSqlite;
  try {
    betterSqlite = new Database(dbPath);
    
    // Ensure table exists just in case migrations haven't run or are in progress
    betterSqlite.exec(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "name" TEXT,
        "password" TEXT,
        "role" TEXT DEFAULT 'STUDENT',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    `);

    const adminCheck = betterSqlite.prepare('SELECT count(*) as count FROM User WHERE role = ?').get('ADMIN');
    const adminCount = adminCheck ? adminCheck.count : 0;

    // RULE: If there is at least one ADMIN in the system, we DO NOT need to auto-provision or touch admin@sboon.org
    if (adminCount > 0 && isSilent) {
        console.log(`>>> ${adminCount} administrator(s) already exist. Skipping auto-provisioning for safety.`);
    } else {
        // Check if the target user already exists
        const existingUser = betterSqlite.prepare('SELECT id, role FROM User WHERE email = ?').get(email);

        if (existingUser) {
            if (existingUser.role === 'ADMIN') {
                console.log(`>>> User ${email} is already an administrator. Skipping.`);
            } else {
                // User exists but is not an admin - Promotion logic
                let confirmPromotion = isSilent && adminCount === 0; // Auto-confirm ONLY if NO admins exist and in silent mode
                
                if (!isSilent) {
                    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                    const answer = await new Promise((resolve) => rl.question(`User ${email} exists with role '${existingUser.role}'. Promote to ADMIN? (y/N): `, resolve));
                    confirmPromotion = answer.toLowerCase() === 'y';
                    rl.close();
                }

                if (confirmPromotion) {
                    console.log(`>>> Promoting ${email} to ADMIN...`);
                    betterSqlite.prepare('UPDATE User SET role = ?, updatedAt = ? WHERE email = ?')
                        .run('ADMIN', new Date().toISOString(), email);
                    console.log(`User ${email} promoted successfully.`);
                } else {
                    console.log('>>> Promotion skipped/cancelled (Current Admins: ' + adminCount + ').');
                }
            }
        } else {
            // User does not exist - Creation logic
            if (adminCount === 0 || !isSilent) {
                console.log(`>>> User ${email} not found. Creating new ADMIN account...`);
                const hashedPassword = await bcrypt.hash(password, 10);
                const now = new Date().toISOString();
                const id = `cli-${Math.random().toString(36).substr(2, 9)}`;
                
                betterSqlite.prepare('INSERT INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
                    .run(id, email, 'System Admin', hashedPassword, 'ADMIN', now, now);
                
                console.log(`Admin user created: ${email}`);
            }
        }
    }

    // 2. Display Top 5 Admins
    const topAdmins = betterSqlite.prepare('SELECT email, name, createdAt FROM User WHERE role = ? ORDER BY createdAt DESC LIMIT 5').all('ADMIN');
    
    console.log('\n--- Current Administrators (Top 5) ---');
    if (topAdmins.length === 0) {
      console.log('(No administrators found)');
    } else {
      topAdmins.forEach((admin, index) => {
        let dateStr = 'N/A';
        if (admin.createdAt) {
          try {
            // Handle both string ISO dates and numeric timestamps/Date objects
            const d = new Date(admin.createdAt);
            if (!isNaN(d.getTime())) {
              dateStr = d.toISOString().split('T')[0];
            } else {
              dateStr = String(admin.createdAt).split(' ')[0];
            }
          } catch (e) {
            dateStr = 'Error';
          }
        }
        console.log(`${index + 1}. ${admin.email.padEnd(25)} | ${(admin.name || 'N/A').padEnd(12)} | ${dateStr}`);
      });
    }
    console.log('--------------------------------------\n');
  } catch (err) {
    console.error('Database Error:', err.message);
    process.exit(1);
  } finally {
    if (betterSqlite) betterSqlite.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
