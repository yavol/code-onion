import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Daytona, type Sandbox } from '@daytona/sdk';

const FAST_TAX_REPO_URL = 'https://github.com/yavol/fast-tax.git';
const DEFAULT_CODEX_PACKAGE = '@openai/codex@0.142.3';
const DEFAULT_CLONE_PATH = 'fast-tax';

type CliOptions = {
  keep: boolean;
  repoUrl: string;
  clonePath: string;
  codexPackage: string;
};

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const equals = line.indexOf('=');
    if (equals === -1) {
      continue;
    }

    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    keep: false,
    repoUrl: FAST_TAX_REPO_URL,
    clonePath: DEFAULT_CLONE_PATH,
    codexPackage: process.env.CODEX_NPM_PACKAGE ?? DEFAULT_CODEX_PACKAGE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--keep') {
      options.keep = true;
      continue;
    }

    if (arg === '--repo' && next) {
      options.repoUrl = next;
      index += 1;
      continue;
    }

    if (arg === '--path' && next) {
      options.clonePath = next;
      index += 1;
      continue;
    }

    if (arg === '--codex-package' && next) {
      options.codexPackage = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return options;
}

function requireDaytonaApiKey(): string {
  const apiKey = process.env.DAYTONA_API_KEY ?? process.env.DAYTONA_API;
  if (!apiKey) {
    throw new Error('Missing DAYTONA_API or DAYTONA_API_KEY in the environment');
  }
  return apiKey;
}

async function runCommand(
  sandbox: Sandbox,
  label: string,
  command: string,
  options: { cwd?: string; timeoutSeconds?: number; env?: Record<string, string> } = {},
): Promise<string> {
  console.log(`\n[daytona] ${label}`);
  const result = await sandbox.process.executeCommand(
    command,
    options.cwd,
    options.env,
    options.timeoutSeconds,
  );

  const output = result.result.trim();
  if (output) {
    console.log(output);
  }

  if (result.exitCode !== 0) {
    throw new Error(`${label} failed with exit code ${result.exitCode}`);
  }

  return result.result;
}

async function main(): Promise<void> {
  const agentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const repoRoot = path.resolve(agentRoot, '..');

  loadEnvFile(path.join(repoRoot, '.env.local'));
  loadEnvFile(path.join(agentRoot, '.env.local'));

  const options = parseArgs(process.argv.slice(2));
  const apiKey = requireDaytonaApiKey();
  const target = process.env.DAYTONA_TARGET;
  const sandboxName = `code-onion-fast-tax-${Date.now().toString(36)}`;

  const daytona = new Daytona({
    apiKey,
    target,
  });

  let sandbox: Sandbox | undefined;

  try {
    console.log('[daytona] creating sandbox');
    sandbox = await daytona.create(
      {
        name: sandboxName,
        language: 'typescript',
        ephemeral: !options.keep,
        autoStopInterval: 10,
        labels: {
          project: 'code-onion',
          purpose: 'fast-tax-codex-smoke',
        },
      },
      { timeout: 180 },
    );

    console.log(`[daytona] sandbox ${sandbox.id} started`);

    await runCommand(
      sandbox,
      'check base toolchain',
      'node --version && npm --version && git --version',
      { timeoutSeconds: 60 },
    );

    console.log(`\n[daytona] cloning ${options.repoUrl} into ${options.clonePath}`);
    await sandbox.git.clone(options.repoUrl, options.clonePath);

    await runCommand(
      sandbox,
      'install Codex CLI',
      [
        'set -euo pipefail',
        `CODEX_PACKAGE=${JSON.stringify(options.codexPackage)}`,
        'mkdir -p "$HOME/.codex-cli"',
        'npm install --prefix "$HOME/.codex-cli" "$CODEX_PACKAGE"',
        'CODEX_BIN="$HOME/.codex-cli/node_modules/.bin/codex"',
        '"$CODEX_BIN" --version',
      ].join('\n'),
      { timeoutSeconds: 240 },
    );

    await runCommand(
      sandbox,
      'list cloned Fast Tax files',
      [
        'set -euo pipefail',
        'pwd',
        'git rev-parse --short HEAD',
        'find . -maxdepth 2 -type f | sort | sed "s#^./##" | head -120',
      ].join('\n'),
      { cwd: options.clonePath, timeoutSeconds: 60 },
    );

    console.log('\n[daytona] smoke check complete; Codex was installed but not prompted');
  } finally {
    if (sandbox && !options.keep) {
      console.log(`[daytona] deleting sandbox ${sandbox.id}`);
      await sandbox.delete(120);
    } else if (sandbox) {
      console.log(`[daytona] keeping sandbox ${sandbox.id}`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[daytona] failed: ${message}`);
  process.exitCode = 1;
});
