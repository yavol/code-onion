#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-config/1password.env.example}"

if ! command -v op >/dev/null 2>&1; then
  echo "1Password CLI is not installed. Install it from https://1password.com/downloads/command-line"
  exit 1
fi

echo "1Password CLI: $(op --version)"

if ! op account list >/dev/null 2>&1 || ! op user get --me >/dev/null 2>&1; then
  cat <<'MSG'
1Password CLI is installed, but no account is signed in.

Recommended demo setup:
  1. Open /Applications/1Password.app and sign in.
  2. In 1Password, enable Developer > Connect with 1Password CLI.
  3. Re-run this script.

Manual CLI fallback:
  op account add --address <your-account>.1password.com --email <email> --signin
MSG
  exit 2
fi

echo "1Password account: signed in"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE"
  exit 3
fi

echo "Checking secret references in $ENV_FILE"
op run --env-file="$ENV_FILE" -- sh -c '
  test -n "${CODE_ONION_LOW_RISK_GITHUB_TOKEN:-}"
  test -n "${CODE_ONION_PRICING_GITHUB_TOKEN:-}"
  test -n "${CODE_ONION_PROVIDER_CHANGE_GITHUB_TOKEN:-}"
  test -n "${CODE_ONION_RECS_EVAL_TOKEN:-}"
  test -n "${CODE_ONION_STAGING_DEPLOY_TOKEN:-}"
  echo "All configured demo capability secrets resolved."
'
