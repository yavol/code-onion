<script lang="ts">
  import {
    ArrowLeft,
    Bot,
    Check,
    Clock3,
    Code2,
    GitPullRequest,
    KeyRound,
    LockKeyhole,
    MessageSquareText,
    ShieldCheck,
    SplitSquareHorizontal,
    X
  } from '@lucide/svelte';
  import { approvals, type ApprovalStatus } from '$lib/demoData';

  let approvalState = approvals;
  let releasePending: Record<string, boolean> = {};
  let releaseErrors: Record<string, string> = {};
  let releaseReceipts: Record<string, string> = {};

  $: waitingCount = approvalState.filter((approval) => approval.status === 'waiting').length;
  $: blockedCount = approvalState.filter((approval) => approval.status === 'blocked').length;
  $: releasedCount = approvalState.filter((approval) => approval.status === 'released').length;
  $: safeCount = approvalState.filter((approval) => approval.severity === 'safe').length;

  function approve(approvalId: string) {
    approvalState = approvalState.map((approval) =>
      approval.id === approvalId
        ? {
            ...approval,
            status: approval.severity === 'safe' ? 'released' : 'approved'
          }
        : approval
    );
  }

  async function release(approvalId: string) {
    const approval = approvalState.find((item) => item.id === approvalId);
    if (!approval || approval.capability === 'none') return;

    releasePending = { ...releasePending, [approvalId]: true };
    releaseErrors = { ...releaseErrors, [approvalId]: '' };

    try {
      const response = await fetch('/api/capability/release', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ capability: approval.capability })
      });
      const receipt = await response.json();

      if (!response.ok) {
        throw new Error(receipt.message || '1Password refused the capability release.');
      }

      approvalState = approvalState.map((item) =>
        item.id === approvalId ? { ...item, status: 'released' } : item
      );
      releaseReceipts = {
        ...releaseReceipts,
        [approvalId]: `${receipt.capability} released for one subprocess, TTL ${receipt.ttlSeconds}s`
      };
    } catch (error) {
      releaseErrors = {
        ...releaseErrors,
        [approvalId]: error instanceof Error ? error.message : 'Release failed.'
      };
    } finally {
      releasePending = { ...releasePending, [approvalId]: false };
    }
  }

  function block(approvalId: string) {
    approvalState = approvalState.map((approval) =>
      approval.id === approvalId ? { ...approval, status: 'blocked' } : approval
    );
  }

  function statusLabel(status: ApprovalStatus) {
    if (status === 'released') return 'credential released';
    if (status === 'approved') return 'policy approved';
    if (status === 'blocked') return 'blocked';
    return 'waiting';
  }
</script>

<svelte:head>
  <title>Code Onion Dashboard</title>
</svelte:head>

<main class="dashboard">
  <aside class="rail" aria-label="Dashboard navigation">
    <a class="back-link" href="/">
      <ArrowLeft size={16} />
      Slack
    </a>

    <div class="brand-mark">
      <ShieldCheck size={25} />
    </div>

    <nav>
      <a class="active" href="/dashboard">
        <GitPullRequest size={17} />
        Authority report
      </a>
      <a href="/dashboard">
        <KeyRound size={17} />
        Capabilities
      </a>
      <a href="/dashboard">
        <SplitSquareHorizontal size={17} />
        Suggested splits
      </a>
    </nav>
  </aside>

  <section class="content">
    <header class="hero">
      <div>
        <p class="eyebrow">Code Onion dashboard</p>
        <h1>Agent run #42</h1>
        <p class="subtitle">Fix checkout latency and clean up the FastTax pricing page copy.</p>
      </div>
      <div class="agent-card">
        <span><Bot size={18} /></span>
        <div>
          <strong>Code Onion Agent</strong>
          <p>Diff peeled into authority layers. Credentials release only after policy passes.</p>
        </div>
      </div>
    </header>

    <section class="metrics" aria-label="Run summary">
      <article>
        <span class="metric ok">{releasedCount}</span>
        <div>
          <strong>Released</strong>
          <p>1Password-backed capability available.</p>
        </div>
      </article>
      <article>
        <span class="metric warning">{waitingCount}</span>
        <div>
          <strong>Waiting</strong>
          <p>Stakeholder or metric approval required.</p>
        </div>
      </article>
      <article>
        <span class="metric danger">{blockedCount}</span>
        <div>
          <strong>Blocked</strong>
          <p>Protected test oracle or denied layer.</p>
        </div>
      </article>
      <article>
        <span class="metric neutral">{safeCount}</span>
        <div>
          <strong>Safe layer</strong>
          <p>Implementation-only change can land fast.</p>
        </div>
      </article>
    </section>

    <section class="split-plan">
      <div>
        <p class="eyebrow">Suggested split</p>
        <h2>This PR should not merge as one bundle.</h2>
      </div>
      <ol>
        <li>Safe PR: image normalization performance optimization.</li>
        <li>Pricing PR: Deluxe promo change for finance and product review.</li>
        <li>Provider PR: OCR vendor fallback for platform and security review.</li>
        <li>Recommendation PR: ANN threshold change with offline eval gates.</li>
        <li>Blocked change: restore the paid-customer integration assertion.</li>
      </ol>
    </section>

    <section class="approval-grid" aria-label="Authority layers">
      {#each approvalState as approval}
        <article class={`approval ${approval.severity} ${approval.status}`}>
          <div class="approval-top">
            <span class="layer">{approval.layer}</span>
            <span class="status">{statusLabel(approval.status)}</span>
          </div>

          <h3>{approval.title}</h3>
          <p>{approval.request}</p>
          <code>{approval.file}</code>

          <div class="requirements">
            {#each approval.required as item}
              <span>{item}</span>
            {/each}
          </div>

          <div class="capability">
            <Code2 size={15} />
            <span>{approval.capability}</span>
          </div>

          <div class="approval-actions">
            {#if approval.status === 'waiting'}
              <button class="approve" type="button" on:click={() => approve(approval.id)}>
                <Check size={15} />
                Approve
              </button>
              <button class="deny" type="button" on:click={() => block(approval.id)}>
                <X size={15} />
                Block
              </button>
            {:else if approval.status === 'approved'}
              <button class="receipt" type="button" on:click={() => release(approval.id)}>
                <KeyRound size={15} />
                {releasePending[approval.id] ? 'Releasing' : 'Release token'}
              </button>
            {:else if approval.status === 'released'}
              <button class="receipt" type="button">
                <ShieldCheck size={15} />
                Receipt
              </button>
            {:else}
              <button class="receipt muted" type="button">
                <Clock3 size={15} />
                Needs override
              </button>
            {/if}
          </div>

          {#if releaseReceipts[approval.id]}
            <p class="release-note">{releaseReceipts[approval.id]}</p>
          {/if}

          {#if releaseErrors[approval.id]}
            <p class="release-error">{releaseErrors[approval.id]}</p>
          {/if}
        </article>
      {/each}
    </section>
  </section>

  <aside class="activity" aria-label="Audit trail">
    <div class="activity-header">
      <p class="eyebrow">Audit trail</p>
      <h2>Live receipts</h2>
    </div>

    <div class="timeline">
      <article>
        <span class="dot ok"></span>
        <div>
          <strong>low-risk merge credential released</strong>
          <p>Capability: merge.implementation.performance. TTL: 5 minutes.</p>
        </div>
      </article>
      <article>
        <span class="dot warning"></span>
        <div>
          <strong>pricing merge withheld</strong>
          <p>Waiting for @finance and @product approval.</p>
        </div>
      </article>
      <article>
        <span class="dot warning"></span>
        <div>
          <strong>eval credential requested</strong>
          <p>Recommendation threshold change needs offline quality gates.</p>
        </div>
      </article>
      <article>
        <span class="dot danger"></span>
        <div>
          <strong>test oracle change blocked</strong>
          <p>No merge credential can be released while the assertion is deleted.</p>
        </div>
      </article>
    </div>

    <section class="slack-bridge">
      <div>
        <MessageSquareText size={17} />
        <strong>Slack bridge</strong>
      </div>
      <p>Post the authority report back to #agent-approvals after each decision.</p>
      <a href="/">Open FastTax Slack</a>
    </section>
  </aside>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    min-width: 320px;
    background:
      linear-gradient(90deg, rgba(19, 36, 28, 0.04) 1px, transparent 1px),
      linear-gradient(0deg, rgba(19, 36, 28, 0.04) 1px, transparent 1px),
      #efe7d8;
    background-size: 28px 28px;
    color: #1e211e;
    font-family:
      ui-serif,
      Georgia,
      Cambria,
      'Times New Roman',
      serif;
  }

  :global(html),
  :global(body) {
    height: 100%;
    overflow: hidden;
  }

  :global(button) {
    cursor: pointer;
    font: inherit;
  }

  .dashboard {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr) 340px;
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
  }

  .rail {
    display: flex;
    flex-direction: column;
    gap: 22px;
    min-height: 0;
    padding: 18px;
    background: #19241d;
    color: #edf2e9;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .back-link,
  .rail nav a,
  .slack-bridge a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: inherit;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.86rem;
    font-weight: 900;
    text-decoration: none;
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border-radius: 8px;
    background: #f2b93d;
    color: #1f241f;
    box-shadow: inset 0 -4px rgba(0, 0, 0, 0.18);
  }

  .rail nav {
    display: grid;
    gap: 8px;
  }

  .rail nav a {
    min-height: 38px;
    padding: 0 10px;
    border-radius: 8px;
    color: #dce8dc;
  }

  .rail nav a.active {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .content {
    min-width: 0;
    min-height: 0;
    padding: 28px;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;
  }

  .hero,
  .metrics,
  .agent-card,
  .approval-top,
  .capability,
  .approval-actions,
  .activity-header,
  .slack-bridge div,
  .timeline article {
    display: flex;
    align-items: center;
  }

  .hero {
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 20px;
  }

  .eyebrow {
    margin: 0 0 5px;
    color: #766a59;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  h1 {
    font-size: clamp(2rem, 4vw, 3.4rem);
    line-height: 0.95;
  }

  h2 {
    font-size: 1.25rem;
  }

  .subtitle {
    margin-top: 9px;
    color: #665f52;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
  }

  .agent-card {
    width: min(390px, 40%);
    gap: 12px;
    padding: 13px;
    border: 1px solid #d0c2ae;
    border-radius: 8px;
    background: #fff8eb;
  }

  .agent-card span {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: #1f3529;
    color: #fff4d6;
    flex: 0 0 auto;
  }

  .agent-card strong,
  .metric + div strong,
  .timeline strong,
  .slack-bridge strong {
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
  }

  .agent-card p,
  .metric + div p,
  .timeline p,
  .slack-bridge p,
  .approval p {
    color: #625a4e;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.84rem;
    line-height: 1.35;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
  }

  .metrics article {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 100%;
    padding: 13px;
    border: 1px solid #d2c4af;
    border-radius: 8px;
    background: #fffaf0;
  }

  .metric {
    display: inline-grid;
    place-items: center;
    min-width: 36px;
    height: 36px;
    border-radius: 8px;
    color: #fff;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-weight: 900;
  }

  .metric.ok,
  .dot.ok {
    background: #2f684d;
  }

  .metric.warning,
  .dot.warning {
    background: #a56719;
  }

  .metric.danger,
  .dot.danger {
    background: #a33c34;
  }

  .metric.neutral {
    background: #3f5c69;
  }

  .split-plan {
    display: grid;
    grid-template-columns: minmax(220px, 0.4fr) 1fr;
    gap: 16px;
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid #cdbda6;
    border-radius: 8px;
    background: #f9f1e3;
  }

  .split-plan ol {
    margin: 0;
    padding-left: 22px;
    color: #3a362f;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    line-height: 1.55;
  }

  .approval-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .approval {
    display: grid;
    gap: 9px;
    padding: 14px;
    border: 1px solid #d4c5af;
    border-left-width: 5px;
    border-radius: 8px;
    background: #fffaf0;
  }

  .approval.safe {
    border-left-color: #2f684d;
  }

  .approval.review {
    border-left-color: #bc7624;
  }

  .approval.blocked {
    border-left-color: #b74338;
  }

  .approval-top {
    justify-content: space-between;
    gap: 8px;
  }

  .layer,
  .status {
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .layer {
    color: #765936;
  }

  .status {
    color: #fff;
    background: #715d44;
    border-radius: 999px;
    padding: 4px 7px;
    white-space: nowrap;
  }

  .approval.released .status {
    background: #2f684d;
  }

  .approval.approved .status {
    background: #426575;
  }

  .approval.blocked .status {
    background: #a33c34;
  }

  .approval h3 {
    color: #1f241f;
    font-size: 1rem;
  }

  .approval code {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid #e0d4c2;
    border-radius: 7px;
    background: #f4ead9;
    color: #463b2c;
    font-family:
      'SFMono-Regular',
      Consolas,
      'Liberation Mono',
      monospace;
    font-size: 0.73rem;
    padding: 7px;
  }

  .requirements {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .requirements span {
    border-radius: 999px;
    background: #e7dbc5;
    color: #5e4932;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.73rem;
    font-weight: 800;
    padding: 4px 8px;
  }

  .capability {
    gap: 6px;
    min-width: 0;
    color: #35624d;
    font-family:
      'SFMono-Regular',
      Consolas,
      'Liberation Mono',
      monospace;
    font-size: 0.74rem;
  }

  .capability span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .approval-actions {
    gap: 7px;
  }

  .approval-actions button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    border: 0;
    border-radius: 7px;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.78rem;
    font-weight: 900;
    padding: 0 10px;
  }

  .approve {
    background: #2f684d;
    color: #fff;
  }

  .deny {
    background: #ead7d1;
    color: #87382e;
  }

  .receipt {
    background: #1f3529;
    color: #fff7df;
  }

  .receipt.muted {
    background: #e5d7c4;
    color: #756654;
  }

  .release-note,
  .release-error {
    border-radius: 7px;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.78rem;
    font-weight: 800;
    padding: 7px 9px;
  }

  .release-note {
    background: #dcebdc;
    color: #28523c;
  }

  .release-error {
    background: #f1d7cf;
    color: #88362d;
  }

  .activity {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 14px;
    min-width: 0;
    min-height: 0;
    padding: 22px;
    border-left: 1px solid #d1c1aa;
    background: #e7ddcc;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }

  .activity-header {
    align-items: flex-start;
    justify-content: space-between;
  }

  .timeline {
    display: grid;
    align-content: start;
    gap: 13px;
    min-height: 0;
  }

  .timeline article {
    align-items: flex-start;
    gap: 10px;
  }

  .dot {
    width: 10px;
    height: 10px;
    margin-top: 5px;
    border-radius: 999px;
    flex: 0 0 auto;
  }

  .slack-bridge {
    display: grid;
    gap: 10px;
    border-radius: 8px;
    border: 1px solid #d0c1aa;
    background: #fbf4e8;
    padding: 13px;
  }

  .slack-bridge div {
    gap: 8px;
  }

  .slack-bridge a {
    justify-content: center;
    min-height: 34px;
    border-radius: 7px;
    background: #f0b73e;
    color: #211f17;
  }

  @media (max-width: 1180px) {
    .dashboard {
      grid-template-columns: 220px minmax(0, 1fr);
    }

    .activity {
      display: none;
    }
  }

  @media (max-width: 880px) {
    .dashboard {
      grid-template-columns: 1fr;
      height: 100dvh;
      min-height: 0;
    }

    .rail {
      display: none;
    }

    .content {
      padding: 18px;
    }

    .hero {
      align-items: flex-start;
      flex-direction: column;
    }

    .agent-card {
      width: 100%;
    }

    .metrics,
    .approval-grid,
    .split-plan {
      grid-template-columns: 1fr;
    }
  }
</style>
