# Git Hooks

This repository uses `core.hooksPath=.githooks`.

The installed hooks keep `.env` in sync with the current repository root when you switch branches or merge:

- `post-checkout`
- `post-merge`

They dispatch to:

- `scripts/sync-env.ps1` on Windows
- `scripts/sync-env.sh` on Linux and macOS
