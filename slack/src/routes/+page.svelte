<script lang="ts">
  import {
    AtSign,
    Bell,
    ChevronDown,
    Circle,
    FileDiff,
    Hash,
    LayoutDashboard,
    LockKeyhole,
    MoreHorizontal,
    Paperclip,
    Plus,
    Search,
    Send,
    ShieldCheck
  } from '@lucide/svelte';
  import { channels, personas, seedMessages, type Message } from '$lib/demoData';

  let selectedChannelId = 'agent-approvals';
  let selectedPersonaId = 'agent';
  let searchText = '';
  let composer = '';
  let composerEl: HTMLTextAreaElement;
  let messages: Message[] = seedMessages;

  $: selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? channels[0];
  $: selectedPersona = personas.find((persona) => persona.id === selectedPersonaId) ?? personas[0];
  $: channelMessages = messages.filter((message) => message.channelId === selectedChannelId);
  $: filteredChannels = channels.filter((channel) =>
    `${channel.name} ${channel.topic} ${channel.layer}`.toLowerCase().includes(searchText.toLowerCase())
  );

  function sendMessage() {
    const text = (composer || composerEl?.value || '').trim();
    if (!text) return;

    const now = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date());

    messages = [
      ...messages,
      {
        id: Math.max(...messages.map((message) => message.id)) + 1,
        channelId: selectedChannelId,
        author: selectedPersona.name,
        role: selectedPersona.role,
        avatar: selectedPersona.avatar,
        time: now,
        body: text,
        kind: selectedPersona.id === 'agent' ? 'agent' : 'normal',
        tags: selectedPersona.id === 'agent' ? ['draft'] : undefined
      }
    ];

    composer = '';
    if (composerEl) composerEl.value = '';
  }
</script>

<svelte:head>
  <title>FastTax Slack Demo</title>
</svelte:head>

<main class="shell">
  <aside class="workspace-rail" aria-label="Workspaces">
    <a class="workspace active" href="/" aria-label="FastTax Slack workspace">FT</a>
    <a class="workspace muted" href="/dashboard" aria-label="Code Onion dashboard">
      <ShieldCheck size={18} strokeWidth={2.3} />
    </a>
    <button class="round-button" aria-label="Add workspace">
      <Plus size={17} />
    </button>
  </aside>

  <aside class="sidebar" aria-label="FastTax channels">
    <div class="team-block">
      <div>
        <p class="eyebrow">Workspace</p>
        <h1>FastTax</h1>
      </div>
      <button class="icon-button" aria-label="Workspace menu">
        <ChevronDown size={18} />
      </button>
    </div>

    <label class="search-box" for="channel-search">
      <Search size={16} />
      <input id="channel-search" bind:value={searchText} placeholder="Search channels" />
    </label>

    <section class="nav-section">
      <div class="section-title">
        <span>Channels</span>
        <button class="mini-button" aria-label="Create channel">
          <Plus size={14} />
        </button>
      </div>

      <div class="channel-list">
        {#each filteredChannels as channel}
          <button
            class:current={channel.id === selectedChannelId}
            class="channel-row"
            type="button"
            on:click={() => (selectedChannelId = channel.id)}
          >
            <span class="channel-main">
              {#if channel.status === 'locked'}
                <LockKeyhole size={14} />
              {:else}
                <Hash size={14} />
              {/if}
              <span>{channel.name}</span>
            </span>
            {#if channel.unread}
              <span class="unread">{channel.unread}</span>
            {/if}
          </button>
        {/each}
      </div>
    </section>

    <section class="nav-section compact">
      <div class="section-title">
        <span>Direct messages</span>
      </div>
      {#each personas.slice(1) as persona}
        <button class="dm-row" type="button">
          <span class="avatar tiny" style={`--avatar:${persona.color}`}>{persona.avatar}</span>
          <span>{persona.name}</span>
          <span class="presence"><Circle size={8} /></span>
        </button>
      {/each}
    </section>
  </aside>

  <section class="conversation" aria-label={`${selectedChannel.name} messages`}>
    <header class="topbar">
      <div class="channel-heading">
        <div class="channel-title">
          {#if selectedChannel.status === 'locked'}
            <LockKeyhole size={18} />
          {:else}
            <Hash size={19} />
          {/if}
          <h2>{selectedChannel.name}</h2>
        </div>
        <p>{selectedChannel.topic}</p>
      </div>

      <div class="top-actions">
        <a class="dashboard-link" href="/dashboard">
          <LayoutDashboard size={16} />
          Code Onion
        </a>
        <label class="persona-picker" for="persona">
          <span>Acting as</span>
          <select id="persona" bind:value={selectedPersonaId}>
            {#each personas as persona}
              <option value={persona.id}>{persona.name} ({persona.role})</option>
            {/each}
          </select>
        </label>
        <button class="icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button class="icon-button" aria-label="More actions">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </header>

    <div class="messages" aria-live="polite">
      {#each channelMessages as message}
        <article class:agent={message.kind === 'agent'} class:report={message.kind === 'report'} class="message">
          <span class="avatar" style={`--avatar:${message.avatar === 'CO' ? '#244c3b' : '#6b5441'}`}>
            {message.avatar}
          </span>
          <div class="message-body">
            <div class="message-meta">
              <strong>{message.author}</strong>
              <span>{message.role}</span>
              <time>{message.time}</time>
            </div>
            <p>{message.body}</p>

            {#if message.tags?.length}
              <div class="tags">
                {#each message.tags as tag}
                  <span>{tag}</span>
                {/each}
              </div>
            {/if}

            {#if message.reactions?.length}
              <div class="reactions">
                {#each message.reactions as reaction}
                  <button type="button">{reaction.emoji} {reaction.count}</button>
                {/each}
              </div>
            {/if}
          </div>
        </article>
      {/each}
    </div>

    <form class="composer" on:submit|preventDefault={sendMessage}>
      <div class="composer-tools">
        <button type="button" aria-label="Attach file">
          <Paperclip size={17} />
        </button>
        <button type="button" aria-label="Mention">
          <AtSign size={17} />
        </button>
        <button type="button" aria-label="Insert authority report">
          <FileDiff size={17} />
        </button>
      </div>
      <textarea
        bind:this={composerEl}
        bind:value={composer}
        rows="2"
        placeholder={`Message #${selectedChannel.name} as ${selectedPersona.name}`}
        on:keydown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) sendMessage();
        }}
      ></textarea>
      <button class="send-button" type="button" aria-label="Send message" on:click={sendMessage}>
        <Send size={18} />
      </button>
    </form>
  </section>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    min-width: 320px;
    background: #f4f1ea;
    color: #1e211e;
    font-family:
      ui-serif,
      Georgia,
      Cambria,
      'Times New Roman',
      serif;
  }

  :global(button),
  :global(input),
  :global(textarea),
  :global(select) {
    font: inherit;
  }

  :global(button) {
    cursor: pointer;
  }

  .shell {
    display: grid;
    grid-template-columns: 72px 292px minmax(0, 1fr);
    height: 100vh;
    min-height: 720px;
    overflow: hidden;
  }

  .workspace-rail {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    padding: 18px 12px;
    background: #19241d;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
  }

  .workspace,
  .round-button,
  .icon-button,
  .mini-button {
    display: inline-grid;
    place-items: center;
    border: 0;
  }

  .workspace {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: #e9dfc9;
    color: #1e241f;
    font-weight: 900;
    letter-spacing: 0;
    text-decoration: none;
    box-shadow: inset 0 -3px rgba(0, 0, 0, 0.16);
  }

  .workspace.active {
    outline: 3px solid #ffcf53;
    outline-offset: 2px;
  }

  .workspace.muted {
    background: #2e3d34;
    color: #dfe8dd;
  }

  .round-button {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #e6ecdf;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
    padding: 18px 14px;
    background: #233329;
    color: #edf2e9;
    border-right: 1px solid #17251d;
  }

  .team-block,
  .section-title,
  .topbar,
  .top-actions,
  .channel-title,
  .composer-tools,
  .message-meta {
    display: flex;
    align-items: center;
  }

  .team-block {
    justify-content: space-between;
    gap: 16px;
  }

  .eyebrow {
    margin: 0 0 4px;
    color: #9eb0a4;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    font-size: 1.55rem;
    line-height: 1;
  }

  h2 {
    font-size: 1.28rem;
    line-height: 1.15;
  }

  .icon-button,
  .mini-button {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.09);
    color: inherit;
  }

  .mini-button {
    width: 25px;
    height: 25px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 11px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.09);
    color: #b8c5b8;
  }

  .search-box input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #f7faf4;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.92rem;
  }

  .search-box input::placeholder {
    color: #adb9ae;
  }

  .nav-section {
    display: grid;
    gap: 9px;
  }

  .nav-section.compact {
    margin-top: auto;
  }

  .section-title {
    justify-content: space-between;
    padding: 0 4px;
    color: #c4d0c5;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .channel-list {
    display: grid;
    gap: 3px;
  }

  .channel-row,
  .dm-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 34px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #e3eadf;
    text-align: left;
  }

  .channel-row {
    padding: 0 8px;
  }

  .channel-row.current {
    background: #f3b93f;
    color: #1c211d;
    font-weight: 900;
  }

  .channel-main {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 8px;
  }

  .channel-main span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .unread {
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: #e45241;
    color: #fff;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.76rem;
    font-weight: 900;
    text-align: center;
    line-height: 20px;
  }

  .dm-row {
    justify-content: flex-start;
    gap: 8px;
    padding: 3px 7px;
    color: #dce5dc;
  }

  .presence {
    margin-left: auto;
    color: #89d18a;
    fill: currentColor;
  }

  .conversation {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-width: 0;
    background: rgba(255, 253, 247, 0.9);
  }

  .topbar {
    justify-content: space-between;
    gap: 22px;
    padding: 17px 22px 14px;
    border-bottom: 1px solid #ddd4c3;
    background: rgba(255, 253, 247, 0.96);
  }

  .channel-heading {
    min-width: 0;
  }

  .channel-title {
    gap: 8px;
  }

  .channel-heading p {
    max-width: 820px;
    margin-top: 5px;
    color: #665f52;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .top-actions {
    gap: 9px;
    flex-shrink: 0;
  }

  .dashboard-link,
  .persona-picker {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    border: 1px solid #d5c9b5;
    border-radius: 8px;
    background: #fffaf0;
    color: #1f241f;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.8rem;
    font-weight: 900;
    text-decoration: none;
  }

  .dashboard-link {
    padding: 0 11px;
    white-space: nowrap;
  }

  .persona-picker {
    min-width: 258px;
    padding: 7px 9px;
    color: #615b50;
    font-size: 0.76rem;
    text-transform: uppercase;
  }

  .persona-picker select {
    min-width: 0;
    flex: 1;
    border: 0;
    outline: 0;
    background: transparent;
    color: #1f241f;
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: none;
  }

  .conversation .icon-button {
    background: #eee5d3;
    color: #2e332e;
  }

  .messages {
    min-height: 0;
    overflow: auto;
    padding: 14px 18px 22px;
  }

  .message {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 11px;
    padding: 11px 10px;
    border-radius: 8px;
  }

  .message:hover {
    background: #f3eadc;
  }

  .message.report {
    border: 1px solid #d7c8aa;
    background: #fff7e6;
    box-shadow: 0 10px 30px rgba(77, 58, 30, 0.08);
  }

  .message.agent:not(.report) {
    background: rgba(36, 76, 59, 0.07);
  }

  .avatar {
    display: inline-grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: var(--avatar);
    color: #fffdf6;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.78rem;
    font-weight: 900;
  }

  .avatar.tiny {
    width: 24px;
    height: 24px;
    font-size: 0.66rem;
  }

  .message-body {
    min-width: 0;
  }

  .message-meta {
    gap: 8px;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
  }

  .message-meta strong {
    color: #1e241f;
    font-size: 0.95rem;
  }

  .message-meta span,
  .message-meta time {
    color: #777067;
    font-size: 0.78rem;
  }

  .message-body p {
    max-width: 86ch;
    margin-top: 4px;
    color: #282821;
    font-size: 0.98rem;
    line-height: 1.43;
  }

  .tags,
  .reactions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 9px;
  }

  .tags span {
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

  .reactions button {
    border: 1px solid #d9cfbd;
    border-radius: 999px;
    background: #fffbf2;
    color: #39372f;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.74rem;
    font-weight: 800;
    padding: 3px 8px;
  }

  .composer {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
    align-items: end;
    margin: 0 18px 18px;
    padding: 10px;
    border: 1px solid #d2c6b4;
    border-radius: 8px;
    background: #fffdf8;
    box-shadow: 0 16px 40px rgba(53, 42, 27, 0.13);
  }

  .composer-tools {
    gap: 5px;
    align-self: stretch;
    padding-top: 3px;
  }

  .composer-tools button,
  .send-button {
    display: inline-grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 7px;
    background: #eee5d4;
    color: #454238;
  }

  .composer textarea {
    width: 100%;
    min-height: 44px;
    max-height: 110px;
    border: 0;
    outline: 0;
    resize: vertical;
    background: transparent;
    color: #1d211e;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 0.94rem;
    line-height: 1.4;
  }

  .send-button {
    background: #244c3b;
    color: #fff;
  }

  @media (max-width: 900px) {
    .shell {
      grid-template-columns: 64px minmax(0, 1fr);
    }

    .sidebar {
      display: none;
    }

    .topbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .top-actions {
      width: 100%;
      flex-wrap: wrap;
    }

    .persona-picker {
      min-width: min(100%, 320px);
    }
  }

  @media (max-width: 640px) {
    .shell {
      grid-template-columns: 1fr;
      height: auto;
      min-height: 100vh;
      overflow: visible;
    }

    .workspace-rail {
      display: none;
    }

    .conversation {
      min-height: 100vh;
    }

    .composer {
      position: sticky;
      bottom: 0;
      margin: 0;
      border-radius: 0;
    }
  }
</style>
