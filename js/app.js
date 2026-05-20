function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Global investigation state (shared across panes) ──
let scenario, iocs = [], notes = [], cmdLog = [], hintCount = 0;
let timerSec = 0, timerInt = null;
let guessSelected = null, guessSubmitted = false;
let activePanel = 'playbook';

// ── Pane management ──
const PANES = [];
let activePaneIdx = 0;

function currentPane() { return PANES[activePaneIdx]; }

function createPane(name) {
  const idx = PANES.length;

  const outEl = document.createElement('div');
  outEl.className = 'terminal-out';
  outEl.style.display = 'none';
  document.getElementById('pane-outputs').appendChild(outEl);

  const pane = {
    idx,
    name,
    outEl,
    term: createTerminal(outEl),
    cmdHistory: [],
    histIdx: -1,
    liveProcess: null,
  };
  PANES.push(pane);
  renderPaneTabs();
  return pane;
}

function renderPaneTabs() {
  const bar = document.getElementById('pane-tabbar');
  const addBtn = document.getElementById('pane-add-btn');
  // clear existing tab buttons
  bar.querySelectorAll('.pane-tab').forEach(b => b.remove());

  PANES.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'pane-tab' + (i === activePaneIdx ? ' active' : '');
    btn.dataset.idx = i;
    btn.innerHTML =
      `<span>${p.name}</span>` +
      (i > 0 ? `<span class="pane-close" onclick="event.stopPropagation();closePane(${i})">×</span>` : '');
    btn.addEventListener('click', () => switchPane(i));
    bar.insertBefore(btn, addBtn);
  });

  addBtn.style.display = PANES.length >= 3 ? 'none' : '';
}

function switchPane(idx) {
  PANES[activePaneIdx].outEl.style.display = 'none';
  activePaneIdx = idx;
  PANES[idx].outEl.style.display = '';
  renderPaneTabs();
  const inp = PANES[idx].outEl.querySelector('.terminal-inline-input');
  if (inp) inp.focus();
}

function addPane() {
  if (PANES.length >= 3) return;
  const pane = createPane('bash');
  switchPane(pane.idx);
  boot(pane);
}

function closePane(idx) {
  if (PANES.length <= 1 || idx === 0) return;
  if (PANES[idx].liveProcess) stopLive(PANES[idx]);
  PANES[idx].outEl.remove();
  PANES.splice(idx, 1);
  PANES.forEach((p, i) => { p.idx = i; });
  activePaneIdx = Math.min(activePaneIdx, PANES.length - 1);
  renderPaneTabs();
  PANES[activePaneIdx].outEl.style.display = '';
}

// ── Live process management ──
function startLive(pane, renderFn, intervalMs) {
  stopLive(pane);
  const container = pane.term.createLiveContainer();
  const update = () => pane.term.renderLive(container, renderFn());
  update();
  const iv = setInterval(update, intervalMs);
  pane.liveProcess = { iv, container };
}

function stopLive(pane) {
  if (!pane.liveProcess) return;
  clearInterval(pane.liveProcess.iv);
  pane.liveProcess = null;
}

// ── Keyboard handler (per-pane closure) ──
function makeOnKey(pane) {
  return function onKey(e) {
    const input = e.currentTarget;

    // Ctrl+C — kill live process or echo ^C
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      if (pane.liveProcess) {
        stopLive(pane);
        pane.term.appendLine('<span class="red">^C</span>');
        pane.term.createInputLine(makeOnKey(pane));
      } else {
        pane.term.freezeInputLine(input.value + '^C');
        pane.term.createInputLine(makeOnKey(pane));
      }
      return;
    }
    // Ctrl+L — clear screen
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      if (pane.liveProcess) stopLive(pane);
      pane.term.clear();
      pane.term.createInputLine(makeOnKey(pane));
      return;
    }

    if (e.key === 'Enter') { runCmdOnPane(input.value, pane); return; }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (pane.histIdx < pane.cmdHistory.length - 1) {
        pane.histIdx++;
        input.value = pane.cmdHistory[pane.histIdx];
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (pane.histIdx > 0) { pane.histIdx--; input.value = pane.cmdHistory[pane.histIdx]; }
      else { pane.histIdx = -1; input.value = ''; }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.toLowerCase();
      const match = ALL_CMD_NAMES.find(c => c.startsWith(v));
      if (match) input.value = match;
      return;
    }
  };
}

// ── Global runCmd (used by sidebar buttons and quickbar — always acts on active pane) ──
function runCmd(raw) {
  runCmdOnPane(raw, currentPane());
}

// ── Core command runner ──
async function runCmdOnPane(rawInput, pane) {
  const raw = rawInput.trim();
  const t = pane.term;

  if (!raw) {
    t.freezeInputLine('');
    t.createInputLine(makeOnKey(pane));
    return;
  }

  // Kill live process before running a new command
  if (pane.liveProcess) stopLive(pane);

  t.freezeInputLine(raw);
  pane.cmdHistory.unshift(raw);
  pane.histIdx = -1;
  cmdLog.push(raw);
  updateSidebar();

  const parts = raw.toLowerCase().split(/\s+/);
  const c = parts[0];
  const args = parts.slice(1);

  try {
    // ── clear ──
    if (c === 'clear') { t.clear(); return; }

    // ── playbook / man ──
    if (c === 'playbook' || c === 'man') {
      const type = args[0];
      if (type && GUIDES[type]) {
        showPlaybook(type);
        await t.printLines(['<span class="dim">playbook aberto no painel lateral.</span>', '']);
      } else {
        showPlaybook(null);
        await t.printLines(['<span class="dim">playbook geral aberto no painel.</span>', '']);
      }
      return;
    }

    // ── hint ──
    if (c === 'hint') {
      hintCount++;
      const h = scenario.hints[(hintCount - 1) % scenario.hints.length];
      await t.printLines([
        '',
        `<span class="yellow">dica [${hintCount}/${scenario.hints.length}]:</span> <span class="dim">${h}</span>`,
        '',
      ]);
      updateSidebar();
      return;
    }

    // ── note ──
    if (c === 'note') {
      if (args[0] === 'adicionar' || args[0] === 'add') {
        const txt = raw.split(/\s+/).slice(2).join(' ');
        if (!txt) { await t.printLines(['<span class="red">uso: note adicionar &lt;texto&gt;</span>']); return; }
        notes.push(txt);
        renderPanel(activePanel);
        await t.printLines(['<span class="green">nota adicionada.</span>', '']);
      } else { switchPanel('notes'); }
      updateSidebar();
      return;
    }
    if (c === 'notes') { switchPanel('notes'); await t.printLines(['<span class="dim">painel de notas aberto.</span>']); return; }
    if (c === 'ioc')   { switchPanel('ioc');   await t.printLines(['<span class="dim">painel de IoC aberto.</span>']); return; }

    // ── report / timeline / score / history ──
    if (c === 'report')   { await cmdReport(t);   return; }
    if (c === 'timeline') { await cmdTimeline(t); return; }
    if (c === 'score')    { await cmdScore(t);    return; }
    if (c === 'history')  { await cmdHistoryPrint(t, pane); return; }

    // ── builtins ──
    if (c === 'whoami') { await t.printLines(['<span class="green">root</span>']); return; }
    if (c === 'uname')  { await t.printLines(['<span class="blue">Linux forensics-lab 6.1.0-amd64 #1 SMP x86_64 GNU/Linux</span>']); return; }
    if (c === 'pwd')    { await t.printLines(['/root']); return; }
    if (c === 'ls') {
      await t.printLines(CMDS.lsPath(scenario, args[0] || ''));
      return;
    }

    // ── cat ──
    if (c === 'cat') {
      const lines = handleCat(args, scenario);
      await t.printLines(lines, 0, 18);
      autoIoc(c, args.join(' '));
      updateSidebar();
      return;
    }

    // ── find ──
    if (c === 'find') {
      const lines = CMDS.find(scenario, args);
      await t.printLines(lines, 0, 18);
      if (scenario.check === 'cryptominer') addIoc('binário xmrig encontrado em /tmp/.xmr/');
      updateSidebar();
      return;
    }

    // ── ps ──
    if (c === 'ps') {
      await t.printLines(CMDS.psaux(scenario), 0, 15);
      if (scenario.check === 'cryptominer') addIoc('processo xmrig rodando de /tmp/.xmr/ (path suspeito)');
      updateSidebar();
      return;
    }

    // ── LIVE commands — top/htop/nethogs/iftop/nload ──
    if (c === 'top' || c === 'htop') {
      await t.printLines([
        '',
        `<span class="dim">top - iniciando monitoramento... (Ctrl+C para sair)</span>`,
        '',
      ]);
      startLive(pane, () => CMDS.liveTop(scenario), 2500);
      return; // NÃO cria novo prompt — live fica rodando
    }
    if (c === 'nethogs') {
      await t.printLines(['', '<span class="dim">nethogs — monitorando eth0... (Ctrl+C para sair)</span>', '']);
      startLive(pane, () => CMDS.liveNethogs(scenario), 2000);
      return;
    }
    if (c === 'iftop') {
      await t.appendLine('');
      await t.appendLine('<span class="dim">iftop: listening on eth0... (Ctrl+C para sair)</span>');
      await new Promise(r => setTimeout(r, 1200));
      startLive(pane, () => CMDS.liveIftop(scenario), 2000);
      return;
    }
    if (c === 'nload') {
      await t.appendLine('');
      await t.appendLine('<span class="dim">nload — calculando médias em eth0... (Ctrl+C para sair)</span>');
      await new Promise(r => setTimeout(r, 1000));
      startLive(pane, () => CMDS.liveNload(scenario), 2000);
      return;
    }

    // ── tcpdump — delay realista ──
    if (c === 'tcpdump') {
      await t.printLines([
        '',
        '<span class="dim">tcpdump: listening on eth0, link-type EN10MB, snapshot length 262144 bytes</span>',
      ]);
      await new Promise(r => setTimeout(r, 1800));
      maybeAddIoc('tcpdump');
      await t.printLines(CMDS.tcpdump(scenario), 0, 40);
      autoIoc(c, '');
      updateSidebar();
      return;
    }

    // ── Delegate to CMDS ──
    let lines = null;
    if (c === 'status')                      lines = CMDS.status(scenario);
    else if (c === 'netstat')              { lines = CMDS.netstat(scenario); maybeAddIoc('netstat'); }
    else if (c === 'ss')                     lines = CMDS.ss(scenario);
    else if (c === 'vmstat')                 lines = CMDS.vmstat(scenario);
    else if (c === 'iostat')                 lines = CMDS.iostat(scenario);
    else if (c === 'dmesg')               { lines = CMDS.dmesg(scenario); maybeAddIoc('dmesg'); }
    else if (c === 'tail' || c === 'grep')   lines = handleLog(raw, args);
    else if (c === 'iptables')               lines = CMDS.iptables(scenario);
    else if (c === 'nmap')                   lines = CMDS.nmap();
    else if (c === 'whois')               { lines = CMDS.whois(scenario, args); addIoc(`IP ${args[0] || scenario.whois_ip} investigado via whois`); }
    else if (c === 'geoip')               { lines = CMDS.geoip(scenario, args);  addIoc(`geolocalização: ${args[0] || scenario.whois_ip}`); }
    else if (c === 'abuse')               { lines = CMDS.abuse(scenario, args);  addIoc(`abuse score verificado: ${args[0] || scenario.whois_ip}`); }
    else if (c === 'dig' || c === 'host')    lines = CMDS.dig(scenario, args);
    else if (c === 'bgp')                    lines = CMDS.bgp(scenario, args);
    else if (c === 'traceroute' || c === 'tracert') lines = CMDS.traceroute(scenario, args);
    else if (c === 'uptime')                 lines = CMDS.uptime(scenario);
    else if (c === 'df')                     lines = CMDS.df();
    else if (c === 'free')                   lines = CMDS.free(scenario);
    else if (c === 'help')                   lines = CMDS.help();
    else {
      lines = [`<span class="red">comando não encontrado: ${esc(c)}</span> <span class="dim">— use <span class="green">help</span> para ver opções</span>`, ''];
    }

    if (lines) {
      await t.printLines(lines, 0, 18);
      autoIoc(c, '');
    }
    updateSidebar();

  } finally {
    // Only create new prompt if no live process is running
    if (!pane.liveProcess) {
      t.createInputLine(makeOnKey(pane));
    }
  }
}

// ── cat handler ──
function handleCat(args, sc) {
  const path = args.join(' ');
  if (path.includes('crontab'))          return CMDS.crontab(sc);
  if (path.includes('passwd'))           return CMDS.passwd();
  if (path.includes('cpuinfo'))          return CMDS.cpuinfo(sc);
  if (path.includes('config.json'))      return CMDS.xmrConfig(sc);
  if (path.includes('nginx') || path.includes('access')) { autoIoc('nginx_log', ''); return CMDS.nginx_log(sc); }
  if (path.includes('auth'))             { autoIoc('auth_log', ''); return CMDS.auth_log(sc); }
  if (path.includes('syslog') || path.includes('messages')) return CMDS.syslog(sc);
  if (path.includes('shadow'))           return ['<span class="red">cat: /etc/shadow: Permission denied</span>', ''];
  if (!path)                             return ['<span class="red">uso: cat &lt;arquivo&gt;</span>', ''];
  return [`<span class="red">cat: ${esc(path)}: No such file or directory</span>`, ''];
}

// ── Log handler (tail/grep) ──
function handleLog(raw, args) {
  const joined = args.join(' ');
  if (joined.includes('nginx') || joined.includes('access')) {
    autoIoc('nginx_log', '');
    return CMDS.nginx_log(scenario);
  }
  if (joined.includes('auth')) {
    autoIoc('auth_log', '');
    return CMDS.auth_log(scenario);
  }
  if (joined.includes('syslog') || joined.includes('messages')) {
    return CMDS.syslog(scenario);
  }
  return [`<span class="red">arquivo não encontrado: ${esc(joined)}</span>`, ''];
}

function maybeAddIoc(cmd) {
  const sc = scenario;
  if (cmd === 'netstat') {
    if (['ddos', 'syn', 'amp'].includes(sc.check)) addIoc('conexões de múltiplos IPs externos suspeitos detectadas');
    if (sc.check === 'slowloris')   addIoc('1000+ conexões do mesmo IP/bloco na porta 80');
    if (sc.check === 'cryptominer') addIoc('conexão de saída para porta 3333 (mining pool)');
    if (sc.check === 'brute')       addIoc('múltiplas conexões na porta 22 (SSH)');
  }
  if (cmd === 'tcpdump') {
    if (['ddos', 'syn', 'amp'].includes(sc.check)) addIoc('padrão anômalo de pacotes capturado no tcpdump');
    if (sc.check === 'http')        addIoc('requisições HTTP repetitivas com mesmo User-Agent');
    if (sc.check === 'cryptominer') addIoc('protocolo stratum mining detectado na saída');
  }
  if (cmd === 'dmesg') {
    if (['ddos', 'syn', 'amp'].includes(sc.check)) addIoc('erros de rede registrados no kernel');
  }
}

function autoIoc(cmd, path) {
  const sc = scenario;
  if ((cmd === 'auth_log' || path.includes('auth')) && sc.check === 'brute')       addIoc('847 tentativas de login SSH em 120s do mesmo IP');
  if ((cmd === 'auth_log' || path.includes('auth')) && sc.check === 'cryptominer') addIoc('login SSH suspeito 4 dias atrás às 03:47');
  if ((cmd === 'nginx_log' || path.includes('nginx')) && sc.check === 'http')       addIoc('14.200 req/s com User-Agents idênticos — padrão botnet');
  if ((cmd === 'top' || cmd === 'htop') && sc.check === 'cryptominer')              addIoc('processo xmrig com 97% CPU (PID 9871)');
  if ((cmd === 'nload' || cmd === 'iftop') && ['ddos', 'amp'].includes(sc.check))   addIoc('largura de banda de entrada > 30 Gbps');
  if (cmd === 'cat' && path.includes('crontab') && sc.check === 'cryptominer')      addIoc('entrada maliciosa no crontab: xmrig reinicia a cada minuto');
}

// ── Boot sequence ──
async function boot(pane) {
  const lines = [
    '',
    '<span class="green">OpenSSH_9.3p1</span> <span class="dim">Debian-3ubuntu0.1</span>',
    '<span class="dim">Connecting to 192.168.0.10 port 22...</span>',
    `<span class="dim">Warning: Permanently added '192.168.0.10' (ED25519) to known hosts.</span>`,
    `<span class="dim">root@192.168.0.10's password: ••••••••••</span>`,
    '',
    '<span class="green bold">Welcome to forensics-lab</span>',
    `<span class="dim">Ubuntu 22.04.3 LTS | kernel 6.1.0-amd64 | uptime ${scenario.status.uptime}</span>`,
    '',
    `<span class="yellow bold">⚠  ALERTA RECEBIDO — ${new Date().toLocaleTimeString('pt-BR')}</span>`,
    '<span class="dim">Anomalia detectada no servidor. Investigue e submeta seu diagnóstico.</span>',
    '',
    '<span class="dim">use </span><span class="green">help</span><span class="dim"> para comandos  |  </span><span class="green">playbook</span><span class="dim"> para guia  |  </span><span class="green">hint</span><span class="dim"> se travar</span>',
    '<span class="dim">dica: abra uma nova aba (+) para monitorar em paralelo enquanto investiga</span>',
    '',
  ];
  await pane.term.printLines(lines, 0, 50);
  document.getElementById('ssh-alert').textContent = '⚠ anomalia detectada';
  updateSidebar();
  pane.term.createInputLine(makeOnKey(pane));
}

// ── Init ──
function init() {
  scenario = pickScenario();
  const pane0 = createPane('bash');
  switchPane(0);
  buildGuessBtns();
  renderPanel('playbook');
  startTimer();
  boot(pane0);
}

// ── Report / Timeline / Score / History ──
async function cmdReport(t) {
  const used = scenario.score_cmds.filter(c => cmdLog.some(l => l.includes(c.split(' ')[0])));
  const pct = Math.round((used.length / scenario.score_cmds.length) * 100);
  const lines = [
    '',
    `<span class="blue bold">RELATÓRIO DE INCIDENTE — ${new Date().toLocaleString('pt-BR')}</span>`,
    '<span class="dim">──────────────────────────────────────────────────────</span>',
    `  <span class="dim">duração:</span>          <span class="blue">${document.getElementById('top-timer').textContent}</span>`,
    `  <span class="dim">comandos:</span>         <span class="blue">${cmdLog.length}</span>`,
    `  <span class="dim">cobertura:</span>        <span class="${pct > 70 ? 'green' : pct > 40 ? 'yellow' : 'red'}">${pct}%</span>`,
    `  <span class="dim">IoCs:</span>             <span class="red">${iocs.length}</span>`,
    `  <span class="dim">anotações:</span>        <span class="blue">${notes.length}</span>`,
    `  <span class="dim">dicas usadas:</span>     <span class="yellow">${hintCount}</span>`,
    '',
    '<span class="dim">IoCs detectados:</span>',
    ...(iocs.length > 0 ? iocs.map(i => `  <span class="red">• ${i}</span>`) : ['  <span class="dim">nenhum</span>']),
    '',
    '<span class="dim">Anotações:</span>',
    ...(notes.length > 0 ? notes.map((n, i) => `  <span class="dim">[${i + 1}]</span> ${n}`) : ['  <span class="dim">nenhuma</span>']),
    '',
    guessSubmitted ? '  <span class="dim">diagnóstico submetido.</span>' : '  <span class="yellow">diagnóstico pendente — submeta no painel lateral</span>',
    '',
  ];
  await t.printLines(lines, 0, 18);
}

async function cmdTimeline(t) {
  const lines = ['', '<span class="dim">cronologia de comandos:</span>'];
  cmdLog.forEach((c, i) => lines.push(`<span class="dim">[${String(i + 1).padStart(2, '0')}]</span> <span class="blue">${c}</span>`));
  lines.push('');
  await t.printLines(lines, 0, 20);
}

async function cmdScore(t) {
  const used = scenario.score_cmds.filter(c => cmdLog.some(l => l.includes(c.split(' ')[0])));
  const missing = scenario.score_cmds.filter(c => !cmdLog.some(l => l.includes(c.split(' ')[0])));
  const pct = Math.round((used.length / scenario.score_cmds.length) * 100);
  const lines = [
    '',
    `<span class="${pct > 70 ? 'green' : pct > 40 ? 'yellow' : 'red'}">${pct}% de cobertura</span> <span class="dim">(${used.length}/${scenario.score_cmds.length} comandos-chave)</span>`,
    '',
    ...(used.length > 0   ? ['<span class="dim">usados:</span>',   ...used.map(c   => `  <span class="green">✓ ${c}</span>`)] : []),
    ...(missing.length > 0 ? ['<span class="dim">faltando:</span>', ...missing.map(c => `  <span class="yellow">○ ${c}</span>`)] : []),
    '',
  ];
  await t.printLines(lines, 0, 20);
}

async function cmdHistoryPrint(t, pane) {
  const lines = [''];
  [...pane.cmdHistory].forEach((c, i) => lines.push(`<span class="dim">${String(i + 1).padStart(4)}</span>  ${c}`));
  lines.push('');
  await t.printLines(lines, 0, 15);
}

// ── IoC & Notes ──
function addIoc(text) {
  if (!iocs.includes(text)) {
    iocs.push(text);
    renderPanel(activePanel);
    updateSidebar();
  }
}

// ── Sidebar ──
function updateSidebar() {
  document.getElementById('sb-timer').textContent    = document.getElementById('top-timer').textContent;
  document.getElementById('sb-cmds').textContent     = cmdLog.length;
  document.getElementById('sb-iocs').textContent     = iocs.length;
  document.getElementById('sb-hints').textContent    = hintCount;
  document.getElementById('sb-uptime').textContent   = scenario.status.uptime;
  document.getElementById('sb-status').innerHTML     = scenario.status.srv;

  const used = scenario.score_cmds.filter(c => cmdLog.some(l => l.includes(c.split(' ')[0])));
  const pct = Math.round((used.length / scenario.score_cmds.length) * 100);
  const covEl = document.getElementById('sb-coverage');
  covEl.textContent = pct + '%';
  covEl.className = 'm-val ' + (pct > 70 ? 'green' : pct > 40 ? 'yellow' : '');

  const nb = document.getElementById('notes-badge');
  nb.style.display = notes.length > 0 ? '' : 'none';
  nb.textContent = notes.length;

  const ib = document.getElementById('ioc-badge');
  ib.style.display = iocs.length > 0 ? '' : 'none';
  ib.textContent = iocs.length;
}

// ── Panel rendering ──
function switchPanel(tab) {
  activePanel = tab;
  ['playbook', 'notes', 'ioc'].forEach(t => {
    document.getElementById(`sptab-${t}`)?.classList.toggle('active', t === tab);
  });
  renderPanel(tab);
}

function renderPanel(tab) {
  const el = document.getElementById('sp-content');
  if (tab === 'playbook')     el.innerHTML = buildPlaybookHtml(null);
  else if (tab === 'notes')   el.innerHTML = buildNotesHtml();
  else if (tab === 'ioc')     el.innerHTML = buildIocHtml();
}

function showPlaybook(type) {
  switchPanel('playbook');
  document.getElementById('sp-content').innerHTML = buildPlaybookHtml(type);
}

function buildPlaybookHtml(type) {
  const guide = type && GUIDES[type] ? GUIDES[type] : null;
  if (guide) {
    return `
      <div class="pb-head">${guide.title}</div>
      ${guide.tips.map(t => `<div class="pb-tip ${t.c}">${t.t}</div>`).join('')}
      <div class="pb-sep"></div>
      <div class="pb-sub">execute <code>playbook</code> sem argumento para voltar ao guia geral</div>
      <div class="pb-sub">tipos: ddos | syn | http | amp | slowloris | brute | cryptominer | none</div>
    `;
  }
  return `
    <div class="pb-head">guia de investigação forense</div>
    <div class="pb-tip hi">Você recebeu um alerta. Algo pode estar errado. Investigue.</div>
    <div class="pb-tip">1. <code>status</code> e <code>top</code> — baseline do sistema (CPU, load, memória)</div>
    <div class="pb-tip">2. <code>netstat -an</code> e <code>ss -s</code> — estado das conexões TCP/UDP</div>
    <div class="pb-tip">3. <code>tcpdump</code>, <code>iftop</code>, <code>nload</code> — análise de tráfego</div>
    <div class="pb-tip">4. Logs: <code>tail /var/log/auth.log</code>, <code>nginx/access.log</code>, <code>syslog</code></div>
    <div class="pb-tip">5. Sistema de arquivos: <code>ps aux</code>, <code>cat /etc/crontab</code>, <code>ls /tmp</code>, <code>find /tmp -type f</code></div>
    <div class="pb-tip">6. Investigue IPs com <code>whois</code>, <code>geoip</code>, <code>abuse</code></div>
    <div class="pb-tip">7. Submeta seu diagnóstico quando tiver evidências suficientes</div>
    <div class="pb-sep"></div>
    <div class="pb-sub">use <code>playbook &lt;tipo&gt;</code> para guia detalhado:</div>
    <div class="pb-sub">ddos | syn | http | amp | slowloris | brute | cryptominer | none</div>
    <div class="pb-sep"></div>
    <div class="pb-sub">dica: abra outra aba (+) para rodar <code>top</code> em paralelo</div>
  `;
}

function buildNotesHtml() {
  return `
    <div class="note-add">
      <input id="note-input" placeholder="nova anotação..." onkeydown="if(event.key==='Enter')addNoteFromInput(this)">
      <button onclick="addNoteFromInput(this.previousElementSibling)">+</button>
    </div>
    ${notes.length === 0
      ? '<div class="dim" style="font-size:11px">nenhuma anotação. escreva acima ou use: note adicionar &lt;texto&gt;</div>'
      : notes.map((n, i) => `<div class="note-item"><span class="note-num">[${i + 1}]</span> ${n}</div>`).join('')
    }
  `;
}

function buildIocHtml() {
  return iocs.length === 0
    ? '<div class="ioc-empty">nenhum IoC detectado ainda.<br>Continue investigando.</div>'
    : iocs.map(i => `<div class="ioc-item">• ${i}</div>`).join('');
}

function addNoteFromInput(inp) {
  if (!inp || !inp.value.trim()) return;
  notes.push(inp.value.trim());
  inp.value = '';
  renderPanel('notes');
  if (!document.getElementById('tab-panel').classList.contains('hidden')) {
    document.getElementById('panel-wrap').innerHTML =
      document.getElementById('sp-content').innerHTML +
      document.getElementById('sp-guess').innerHTML;
  }
  updateSidebar();
}

// ── Guess / Diagnóstico ──
function buildGuessBtns() {
  const el = document.getElementById('sp-guess');
  el.innerHTML = `
    <div class="sp-guess-title">seu diagnóstico — submeta quando tiver evidências:</div>
    <div class="guess-btns" id="guess-btns">
      ${GUESS_OPTIONS.map(o => `<button class="gbtn" data-k="${o.k}" onclick="selectGuess('${o.k}')">${o.l}</button>`).join('')}
    </div>
    <div class="submit-row">
      <button class="submit-btn" id="submit-btn" onclick="submitGuess()">submeter diagnóstico</button>
      <span class="guess-feedback" id="guess-feedback"></span>
    </div>
  `;
}

function selectGuess(k) {
  if (guessSubmitted) return;
  guessSelected = k;
  document.querySelectorAll('.gbtn').forEach(b => b.classList.toggle('sel', b.dataset.k === k));
}

function submitGuess() {
  if (!guessSelected || guessSubmitted) return;
  guessSubmitted = true;
  clearInterval(timerInt);

  const correct = guessSelected === scenario.check;
  document.querySelectorAll('.gbtn').forEach(b => {
    if (b.dataset.k === scenario.check) b.classList.add('correct');
    else if (b.dataset.k === guessSelected && !correct) b.classList.add('wrong');
    b.classList.remove('sel');
  });

  const used = scenario.score_cmds.filter(c => cmdLog.some(l => l.includes(c.split(' ')[0])));
  const pct = Math.round((used.length / scenario.score_cmds.length) * 100);
  const fb = document.getElementById('guess-feedback');
  fb.innerHTML = correct
    ? `<span class="green">✓ correto! cobertura: ${pct}%</span>`
    : `<span class="red">✗ era: ${scenario.label} | cobertura: ${pct}%</span>`;

  document.getElementById('submit-btn').disabled = true;

  const t = currentPane().term;
  t.printLines([
    '',
    correct
      ? `<span class="green bold">✓ DIAGNÓSTICO CORRETO!</span> <span class="dim">era: </span><span class="blue">${scenario.label}</span>`
      : `<span class="red bold">✗ DIAGNÓSTICO INCORRETO.</span> <span class="dim">era: </span><span class="blue">${scenario.label}</span>`,
    `<span class="dim">tempo: ${document.getElementById('top-timer').textContent} | cobertura de evidências: ${pct}%</span>`,
    !correct ? `<span class="dim">use <span class="green">playbook ${scenario.check}</span> para entender os sinais</span>` : '',
    '',
  ], 0, 30);

  updateSidebar();
}

// ── New session ──
function newSession() {
  scenario = pickScenario();
  iocs = []; notes = []; cmdLog = []; hintCount = 0;
  guessSelected = null; guessSubmitted = false;
  timerSec = 0;
  clearInterval(timerInt);

  // Keep only first pane, close others
  while (PANES.length > 1) closePane(PANES.length - 1);
  stopLive(PANES[0]);
  PANES[0].cmdHistory = [];
  PANES[0].histIdx = -1;
  PANES[0].term.clear();
  activePaneIdx = 0;
  renderPaneTabs();

  buildGuessBtns();
  renderPanel(activePanel);
  updateSidebar();
  startTimer();
  boot(PANES[0]);
}

// ── Timer ──
function startTimer() {
  timerInt = setInterval(() => {
    timerSec++;
    const m = String(Math.floor(timerSec / 60)).padStart(2, '0');
    const s = String(timerSec % 60).padStart(2, '0');
    const t = `${m}:${s}`;
    document.getElementById('top-timer').textContent = t;
    document.getElementById('sb-timer').textContent = t;
  }, 1000);
}

// ── UI helpers ──
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

function showTab(tab) {
  document.getElementById('tab-terminal').classList.toggle('hidden', tab !== 'terminal');
  document.getElementById('tab-panel').classList.toggle('hidden', tab !== 'panel');
  document.getElementById('ttab-terminal').classList.toggle('active', tab === 'terminal');
  document.getElementById('ttab-panel').classList.toggle('active', tab === 'panel');
  if (tab === 'panel') {
    const pw = document.getElementById('panel-wrap');
    pw.innerHTML = document.getElementById('sp-content').innerHTML + document.getElementById('sp-guess').innerHTML;
  }
  if (tab === 'terminal') {
    const inp = currentPane().outEl.querySelector('.terminal-inline-input');
    if (inp) inp.focus();
  }
}

function promptWhois() {
  const ip = prompt('whois — IP para consultar:', scenario.whois_ip);
  if (ip) runCmd('whois ' + ip.trim());
}
function promptGeoip() {
  const ip = prompt('geoip — IP para localizar:', scenario.whois_ip);
  if (ip) runCmd('geoip ' + ip.trim());
}
function promptAbuse() {
  const ip = prompt('abuse — IP para verificar reputação:', scenario.whois_ip);
  if (ip) runCmd('abuse ' + ip.trim());
}
function promptDig() {
  const host = prompt('dig — hostname ou IP:', 'forensics-lab.local');
  if (host) runCmd('dig ' + host.trim());
}

// ── Start ──
window.addEventListener('DOMContentLoaded', init);
