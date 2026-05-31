# Server API Secrets for AI Agents

This folder stores templates and local-only files for server API keys and
agent configuration.

## Files

- `server-api.env.example` - environment variable template
- `agent-server-access.json.example` - agent access policy template
- `server-api.env.local` - local/server-only file for real secret values
- `agent-server-access.json.local` - local/server-only policy file

The `.local` files must never be committed. They are ignored by `.gitignore`.

## Local Setup

Copy the templates and fill real values only on the target machine or server:

```powershell
Copy-Item 02-product\llb-main-core\security\secrets\server-api.env.example 02-product\llb-main-core\security\secrets\server-api.env.local
Copy-Item 02-product\llb-main-core\security\secrets\agent-server-access.json.example 02-product\llb-main-core\security\secrets\agent-server-access.json.local
```

The repository-level Compose workflow reads environment from the repository
root `.env`; product-specific secret examples remain here for operations
reference.

Values that belong in a secret store or local-only file:

- API key or bearer token
- key id / service account id
- webhook secret
- private/internal endpoint values

## Safety Rules

- Do not put real keys in `*.example` files.
- Do not commit `*.local`, `.env`, database, cookie, token, or log files.
- Use separate keys for `dev`, `staging`, and `prod`.
- Keep key scopes as narrow as the agent needs.
- Rotate keys immediately if exposure is suspected.
