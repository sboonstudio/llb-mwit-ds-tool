# llbridge-web

`llbridge-web` is the initial LearnLab Bridge web portal. It uses NextAuth
credentials, Prisma 7, SQLite, and redirects authenticated users to JupyterHub,
which starts an isolated JupyterLab container per user.

## Local Development

```bash
npm install
npm run db:migrate
npm run dev
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks
`npm.ps1`:

```powershell
npm.cmd run db:migrate
npm.cmd run dev
```

Open `http://127.0.0.1:3000`.

## Verification

```bash
npm run lint
npm run build
```

## Docker Compose

Run from the repository root:

```powershell
docker compose --env-file .env -f docker-compose.yml up -d --build
```

Default URLs:

- Web portal: `http://127.0.0.1:3000`
- JupyterHub: `http://127.0.0.1:8000`

## JupyterHub Workspaces

Docker Compose runs JupyterHub with DockerSpawner. When an authenticated
LearnLab Bridge user opens JupyterLab, the web portal sends a short-lived signed
launch token to JupyterHub. JupyterHub then starts one JupyterLab container for
that user.

- user workspace is mounted read-write as `/home/jovyan/work`
- shared starter content is mounted read-only as `/home/jovyan/shared`

Other users' folders are not mounted into the user's JupyterLab container.

## Database Storage

Docker Compose stores the SQLite database outside the container image:

- host path: `infrastructure/data/nextjs/dev.db`
- container path: `/app/data/dev.db`

The Next.js container runs `scripts/migrate-sqlite.mjs` on startup so a new or
empty external database receives the Prisma migrations before the app starts.
