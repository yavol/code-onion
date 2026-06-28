# 1Password Demo Setup

This repo uses 1Password as the capability release layer for the Code Onion demo.

Code Onion decides policy from the diff. 1Password does not decide whether a pricing, provider, recommendation, test, or performance change is allowed. 1Password only supplies the credential for the approved action, scoped to the subprocess that needs it.

## What was installed

The machine has:

- 1Password CLI: `op`
- 1Password desktop app: `/Applications/1Password.app`

## Personal-account simulation

A personal 1Password account is enough for the hackathon demo, but it will not prove real enterprise group enforcement.

For the demo:

- Code Onion simulates stakeholder identity and approvals: `@finance`, `@product`, `@platform`, `@security`, `@qa`, `@checkout`, and `@release`.
- 1Password stores separate capability secrets.
- Code Onion releases a capability only after its local policy state says approvals and tests passed.
- The agent never receives the raw secret directly; Code Onion invokes the action through `op run`.

This keeps the message honest: Code Onion is the policy engine, 1Password is the authority release layer.

## Create the demo vault

In 1Password, create a vault named:

```text
Code Onion Demo
```

Create these items and fields:

| Item | Field | Purpose |
| --- | --- | --- |
| `code-onion-low-risk-merge` | `GITHUB_TOKEN` | Low-risk implementation merge capability |
| `code-onion-pricing-merge` | `GITHUB_TOKEN` | Pricing merge capability after finance/product approval |
| `code-onion-provider-change` | `GITHUB_TOKEN` | API provider change capability |
| `code-onion-recs-eval` | `EVAL_TOKEN` | Recommendation offline eval capability |
| `code-onion-staging-deploy` | `DEPLOY_TOKEN` | Staging deploy capability |

For a first local demo, these can be dummy tokens except the low-risk merge token if you want a real GitHub merge. Later, replace dummy values with fine-grained GitHub tokens or deploy tokens.

## Enable CLI access

Preferred path:

1. Open `/Applications/1Password.app`.
2. Sign in to the personal account.
3. Enable the 1Password CLI integration in the app developer settings.
4. Run:

```bash
op account list
op whoami
```

Manual fallback:

```bash
op account add --address <your-account>.1password.com --email <email> --signin
```

## Verify secret references

The committed env file contains only secret references:

```bash
config/1password.env.example
```

After creating the vault/items, verify resolution:

```bash
./scripts/check-1password.sh
```

The script only checks that references resolve. It does not print secret values.

## How Code Onion should invoke capabilities

Low-risk merge:

```bash
op run --env-file=config/1password.env.example -- sh -c 'GITHUB_TOKEN="$CODE_ONION_LOW_RISK_GITHUB_TOKEN" gh pr merge "$PR_NUMBER" --squash --delete-branch'
```

Pricing merge:

```bash
op run --env-file=config/1password.env.example -- sh -c 'GITHUB_TOKEN="$CODE_ONION_PRICING_GITHUB_TOKEN" gh pr merge "$PR_NUMBER" --squash --delete-branch'
```

Recommendation eval:

```bash
op run --env-file=config/1password.env.example -- sh -c './scripts/run-recs-eval --token "$CODE_ONION_RECS_EVAL_TOKEN"'
```

The demo UI should show `released`, `withheld`, or `blocked`. It should never show the raw token.

## Demo rule of thumb

- Safe implementation performance change: release low-risk merge credential after tests.
- Product price change: withhold pricing merge credential until `@finance` and `@product` approve.
- API provider switch: withhold provider credential until `@platform` and `@security` approve.
- ANN threshold change: release eval credential, then require metric gates before merge.
- Deleted or weakened integration test: block by default; no normal merge credential is released.
