# 📝 Git Process Log: Release v0.4.6-alpha & v0.4.6
**Date:** 2026-06-07
**Status:** Success ✅

## 1. Version Synchronization (Internal)
Executed `sync-version.ps1` to align version `0.4.6-alpha` across:
- `/VERSION`
- `/platform/apps/web/VERSION`
- `/platform/apps/web/package.json`
- `/platform/apps/web/src/lib/version.ts`

```powershell
powershell.exe -ExecutionPolicy Bypass -File learnlab-bridge/scripts/sync-version.ps1
```

## 2. Commit & Internal Tagging
- **Branch:** `develop` -> `main`
- **Commit:** `feat(intelligence): implement learning intelligence dashboard and sync (v0.4.6-alpha)`
- **Tag:** `v0.4.6-alpha` (Annotated)

```bash
git -C learnlab-bridge add .
git -C learnlab-bridge commit -m "feat(intelligence): implement learning intelligence dashboard and sync (v0.4.6-alpha)"
git -C learnlab-bridge checkout main
git -C learnlab-bridge merge develop
git -C learnlab-bridge tag -a v0.4.6-alpha -m "Release v0.4.6-alpha"
git -C learnlab-bridge push origin main v0.4.6-alpha
```

## 3. Public Export Synchronization (Clean Release)
Executed `sync-to-public.ps1` to synchronize from `main` to `public/export-mwit-ds` worktree.

**Actions performed by script:**
- Merge `main` into `public/export-mwit-ds`.
- Scrub internal docs and data (via `.public-ignore`).
- Inject clean version `0.4.6` (removing `-alpha`).
- Create clean tag `v0.4.6`.

```powershell
powershell.exe -ExecutionPolicy Bypass -File learnlab-bridge/scripts/sync-to-public.ps1
```

## 4. Public Remote Update
- **Repo:** `learnlab-bridge-export`
- **Remote:** `public` (https://git.mwit.ac.th/service/mwit-ds-tool.git)
- **Action:** Push branch and clean tag.

```bash
git -C learnlab-bridge-export push origin public/export-mwit-ds v0.4.6
```

## 5. Workspace Cleanup
- Restored temporary SQLite journal files.
- Verified all worktrees are in a "clean" state.

```bash
git -C learnlab-bridge restore platform/apps/web/prisma/prisma/dev.db-journal
```

## 6. Conflict Resolution (Post-Sync)
Due to automatic merge conflicts during `sync-to-public.ps1`, the following files were manually fixed to remove git conflict markers and ensure correct versioning (`0.4.6` instead of `0.4.6-alpha`):
- `platform/apps/web/package.json`
- `platform/apps/web/src/lib/version.ts`

```bash
git -C learnlab-bridge-export add platform/apps/web/package.json platform/apps/web/src/lib/version.ts
git -C learnlab-bridge-export commit -m "fix: resolve merge conflicts in package.json and version.ts"
git -C learnlab-bridge-export push origin public/export-mwit-ds
git -C learnlab-bridge-export push public public/export-mwit-ds
git -C learnlab-bridge-export push github public/export-mwit-ds:main --force
```

---
*This log is maintained for agent continuity and audit purposes.*
