import { error, json } from '@sveltejs/kit';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

type CapabilityConfig = {
  env: string;
  label: string;
  ttlSeconds: number;
};

const CAPABILITIES: Record<string, CapabilityConfig> = {
  'merge.implementation.performance': {
    env: 'CODE_ONION_LOW_RISK_GITHUB_TOKEN',
    label: 'low-risk merge credential',
    ttlSeconds: 300
  },
  'merge.money.pricing': {
    env: 'CODE_ONION_PRICING_GITHUB_TOKEN',
    label: 'pricing merge credential',
    ttlSeconds: 300
  },
  'merge.vendor.api_provider': {
    env: 'CODE_ONION_PROVIDER_CHANGE_GITHUB_TOKEN',
    label: 'provider-change merge credential',
    ttlSeconds: 300
  },
  'run.product_quality.recommendation_eval': {
    env: 'CODE_ONION_RECS_EVAL_TOKEN',
    label: 'recommendation eval credential',
    ttlSeconds: 900
  },
  'deploy.staging': {
    env: 'CODE_ONION_STAGING_DEPLOY_TOKEN',
    label: 'staging deploy credential',
    ttlSeconds: 300
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

export async function POST({ request }) {
  const body = await request.json().catch(() => ({}));
  const capability = String(body.capability ?? '');
  const config = CAPABILITIES[capability];

  if (!config) {
    throw error(403, `No releasable 1Password capability is configured for ${capability || 'empty request'}.`);
  }

  const shellScript = `test -n "\${${config.env}:-}" && printf 'capability available\\n'`;

  try {
    await execFileAsync('op', ['run', `--env-file=${envFilePath()}`, '--', 'sh', '-c', shellScript], {
      timeout: 15_000,
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
    ttlSeconds: config.ttlSeconds,
    subprocessOnly: true,
    secretExposedToModel: false,
    command: `op run --env-file=config/1password.env.example -- sh -c 'test -n "$${config.env}"'`
  });
}
