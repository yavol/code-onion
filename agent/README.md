# Daytona Agent Runner

This package contains the Daytona smoke runner for the Code Onion demo.

It creates a Daytona TypeScript sandbox, clones the public Fast Tax repo, installs the Codex CLI inside that sandbox, prints the Codex version, and lists the cloned files. It does not send a prompt to Codex or ask Codex to modify anything.

## Environment

Put the Daytona API key in the repository root `.env.local`:

```bash
DAYTONA_API=...
```

`DAYTONA_API_KEY` also works. Optional settings:

```bash
DAYTONA_TARGET=us
CODEX_NPM_PACKAGE=@openai/codex@0.142.3
```

## Run

```bash
cd agent
npm install
npm run fast-tax:sandbox
```

By default the runner deletes the sandbox after the smoke check. Use `-- --keep` to leave it running for inspection.
