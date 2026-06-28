import { error, json } from '@sveltejs/kit';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ONE_PASSWORD_APP = '/Applications/1Password.app/Contents/MacOS/1Password';

type CapabilityConfig = {
  env: string;
  label: string;
  receiptType: 'approval_receipt' | 'action_credential';
  action?: 'merge_pr' | 'resolve_only';
  ttlSeconds?: number;
};

const CAPABILITIES: Record<string, CapabilityConfig> = {
  'merge.implementation.performance': {
    env: 'CODE_ONION_LOW_RISK_GITHUB_TOKEN',
    label: 'low-risk merge credential',
    receiptType: 'action_credential',
    action: 'merge_pr',
    ttlSeconds: 300
  },
  'merge.money.pricing': {
    env: 'CODE_ONION_PRICING_GITHUB_TOKEN',
    label: 'pricing merge credential',
    receiptType: 'action_credential',
    action: 'merge_pr',
    ttlSeconds: 300
  },
  'merge.vendor.api_provider': {
    env: 'CODE_ONION_PROVIDER_CHANGE_GITHUB_TOKEN',
    label: 'provider-change merge credential',
    receiptType: 'action_credential',
    action: 'merge_pr',
    ttlSeconds: 300
  },
  'run.product_quality.recommendation_eval': {
    env: 'CODE_ONION_RECS_EVAL_TOKEN',
    label: 'recommendation eval credential',
    receiptType: 'action_credential',
    ttlSeconds: 900
  },
  'deploy.staging': {
    env: 'CODE_ONION_STAGING_DEPLOY_TOKEN',
    label: 'staging deploy credential',
    receiptType: 'action_credential',
    ttlSeconds: 300
  },
  'approve.product': {
    env: 'CODE_ONION_PRODUCT_APPROVAL_RECEIPT',
    label: 'product demo approval receipt',
    receiptType: 'approval_receipt'
  },
  'approve.finance': {
    env: 'CODE_ONION_FINANCE_APPROVAL_RECEIPT',
    label: 'finance demo approval receipt',
    receiptType: 'approval_receipt'
  },
  'approve.qa_override': {
    env: 'CODE_ONION_QA_OVERRIDE_RECEIPT',
    label: 'QA override demo approval receipt',
    receiptType: 'approval_receipt'
  }
};

function envFilePath() {
  const candidates = [
    resolve(process.cwd(), '..', 'config', '1password.env.example'),
    resolve(process.cwd(), 'config', '1password.env.example')
  ];

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw error(500, '1Password env reference file was not found.');
  }

  return found;
}

async function requestVisible1PasswordGate() {
  if (existsSync(ONE_PASSWORD_APP)) {
    await execFileAsync(ONE_PASSWORD_APP, ['--lock'], {
      timeout: 5_000,
      maxBuffer: 1024 * 20
    }).catch(() => undefined);
  }

  await execFileAsync('open', ['-a', '1Password'], {
    timeout: 5_000,
    maxBuffer: 1024 * 20
  }).catch(() => undefined);

  await execFileAsync('op', ['signin'], {
    timeout: 120_000,
    maxBuffer: 1024 * 20
  });
}

export async function POST({ request }) {
  const body = await request.json().catch(() => ({}));
  const capability = String(body.capability ?? '');
  const config = CAPABILITIES[capability];

  if (!config) {
    throw error(403, `No releasable 1Password capability is configured for ${capability || 'empty request'}.`);
  }

  const targetRepo = String(body.targetRepo ?? 'yavol/fast-tax');
  if (targetRepo !== 'yavol/fast-tax') {
    throw error(403, `Target repo ${targetRepo} is not allowed for this demo.`);
  }

  const prNumber = Number.parseInt(String(body.prNumber ?? ''), 10);
  const shouldMergePr = config.action === 'merge_pr' && Number.isInteger(prNumber) && prNumber > 0;

  const shellScript =
    shouldMergePr
      ? `set -euo pipefail
test -n "\${${config.env}:-}"
GH_TOKEN="\${${config.env}}" gh pr merge "$PR_NUMBER" --repo "$TARGET_REPO" --squash --delete-branch`
      : `test -n "\${${config.env}:-}" && printf 'capability available\\n'`;

  try {
    await requestVisible1PasswordGate();
    await execFileAsync('op', ['run', `--env-file=${envFilePath()}`, '--', 'sh', '-c', shellScript], {
      env: {
        ...process.env,
        PR_NUMBER: String(prNumber || ''),
        TARGET_REPO: targetRepo
      },
      timeout: 120_000,
      maxBuffer: 1024 * 20
    });
  } catch (cause) {
    console.error('1Password capability release failed', cause);
    throw error(502, `1Password did not release ${capability}.`);
  }

  return json({
    capability,
    label: config.label,
    releasedAt: new Date().toISOString(),
    receiptType: config.receiptType,
    ...(config.ttlSeconds ? { ttlSeconds: config.ttlSeconds } : {}),
    ...(config.action === 'merge_pr'
      ? {
          targetRepo,
          prNumber: shouldMergePr ? prNumber : null,
          merged: shouldMergePr,
          mergeCommandExecuted: shouldMergePr
        }
      : {}),
    subprocessOnly: true,
    secretExposedToModel: false,
    nativeAppLockRequested: true,
    reauthenticationRequested: true,
    command:
      shouldMergePr
        ? `op run --env-file=config/1password.env.example -- sh -c 'GH_TOKEN="$${config.env}" gh pr merge ${prNumber} --repo ${targetRepo} --squash --delete-branch'`
        : `op run --env-file=config/1password.env.example -- sh -c 'test -n "$${config.env}"'`
  });
}
