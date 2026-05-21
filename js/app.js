function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Global investigation state ─────────────────
let scenario, iocs = [], notes = [], labNotes = [], cmdLog = [], hintCount = 0;
let timelineRevealed = new Set(['none']);
let timerSec = 0, timerInt = null;
let sessionCreds = null;

// ── Window management ───────────────────────────
const WINDOWS = [];
let focusedWinId = null;
let winZCounter = 100;
let winOpenCount = 0;

// ── Popup window state (txtv / filemgr) ─────────
let txtMaximized = false, txtPrevStyle = '';
let fmgMaximized = false, fmgPrevStyle = '';

function getFocusedWin() { return WINDOWS.find(w => w.id === focusedWinId) || null; }
function currentPane() {
  const win = getFocusedWin();
  return win ? win.panes[win.activePaneIdx] : null;
}
function runCmd(raw) {
  const p = currentPane();
  if (p) runCmdOnPane(raw, p);
}

// ── Session Credentials ─────────────────────────
function generateCreds() {
  const ips  = ['192.168.1.10','192.168.0.10','10.0.0.50','172.16.0.5','10.10.14.2','192.168.100.5'];
  const w1   = ['root','kali','lab','sec','cyber','hack'][Math.floor(Math.random()*6)];
  const w2   = ['2024','2025','lab','secure','pwned','test'][Math.floor(Math.random()*6)];
  const num  = Math.floor(Math.random()*90)+10;
  const sym  = ['!','#','@','$','%'][Math.floor(Math.random()*5)];
  return { ip: ips[Math.floor(Math.random()*ips.length)], user: 'root', password: `${w1}${num}${w2}${sym}` };
}

function buildAccessTxtLines() {
  const c = sessionCreds;
  const ts = new Date().toLocaleString('pt-BR');
  return [
    '=== ACESSO AO SERVIDOR ===',
    '',
    `Host:         ${c.ip}`,
    `User:         ${c.user}`,
    `Password:     ${c.password}`,
    `Port:         22`,
    '',
    '─'.repeat(38),
    '',
    `Alerta recebido:  ${ts}`,
    `Investigador:     root@kali`,
    `Classificação:    CONFIDENCIAL`,
    '',
    '─'.repeat(38),
    '',
    'DESCRIÇÃO:',
    'Anomalia detectada no servidor de produção.',
    'Investigue e identifique a ameaça.',
    '',
    `Conectar via: ssh ${c.user}@${c.ip}`,
  ];
}

// ── Wallpaper ───────────────────────────────────
const WALLPAPERS = [
  'backgrounds/kali-net.jpg','backgrounds/kali-cubes.jpg','backgrounds/kali-prompt.jpg',
  'backgrounds/kali-cubes-purple.jpg','backgrounds/kali-glitch.jpg','backgrounds/kali-mesh.png',
  'backgrounds/kali-cubes2.jpg','backgrounds/kali-red-sticker.jpg',
  'backgrounds/kali-hack.jpg','backgrounds/kali-rings.png',
];
function setRandomWallpaper() {
  const wp = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)];
  document.getElementById('desktop').style.backgroundImage = `url('${wp}')`;
  scheduleSave();
}
function changeWallpaper() { setRandomWallpaper(); }

// ── Clock ───────────────────────────────────────
function startClock() {
  function tick() {
    document.getElementById('kp-clock').textContent = new Date().toLocaleTimeString('pt-BR');
  }
  tick();
  setInterval(tick, 1000);
}

// ── Toast ───────────────────────────────────────
function showToast(title, body, type = 'warn') {
  const container = document.getElementById('toast-container');
  const div = document.createElement('div');
  div.className = `toast toast-${type}`;
  div.innerHTML = `<div class="toast-title">${title}</div><div class="toast-body">${esc(body)}</div>`;
  container.appendChild(div);
  setTimeout(() => {
    div.classList.add('removing');
    setTimeout(() => div.remove(), 220);
  }, 4500);
}

// ── Context Menu ────────────────────────────────
function showCtxMenu(e) {
  e.preventDefault();
  const m = document.getElementById('ctx-menu');
  m.classList.remove('hidden');
  m.style.left = Math.min(e.clientX, window.innerWidth  - m.offsetWidth  - 6) + 'px';
  m.style.top  = Math.min(e.clientY, window.innerHeight - m.offsetHeight - 6) + 'px';
}
function hideCtxMenu() { document.getElementById('ctx-menu').classList.add('hidden'); }
document.addEventListener('click', (e) => {
  if (!e.target.closest('.ctx-menu'))   hideCtxMenu();
  if (!e.target.closest('.app-launcher') && !e.target.closest('#kp-applications')) closeAppLauncher();
});

// ── App Launcher ────────────────────────────────
function toggleAppLauncher(e) {
  e?.stopPropagation();
  const el = document.getElementById('app-launcher');
  const btn = document.getElementById('kp-applications');
  const hidden = el.classList.toggle('hidden');
  btn.classList.toggle('active', !hidden);
}
function closeAppLauncher() {
  document.getElementById('app-launcher').classList.add('hidden');
  document.getElementById('kp-applications').classList.remove('active');
}

// ── Floating window helpers ──────────────────────
function _showTxtWindow() {
  const win = document.getElementById('txtv-window');
  const ws  = document.getElementById('workspace');
  if (win.style.display !== 'flex') {
    const w = Math.min(680, ws.offsetWidth - 80);
    const h = Math.min(500, ws.offsetHeight - 80);
    win.style.width  = w + 'px';
    win.style.height = h + 'px';
    win.style.left   = Math.max(10, (ws.offsetWidth  - w) / 2) + 'px';
    win.style.top    = Math.max(10, (ws.offsetHeight - h) / 2 - 20) + 'px';
    win.classList.remove('win-anim');
    void win.offsetWidth;
    win.classList.add('win-anim');
  }
  win.classList.remove('closing');
  win.style.display = 'flex';
  win.style.zIndex  = ++winZCounter;
}

function _showFmgWindow() {
  const win = document.getElementById('filemgr-window');
  const ws  = document.getElementById('workspace');
  if (win.style.display !== 'flex') {
    const w = Math.min(560, ws.offsetWidth - 80);
    const h = Math.min(380, ws.offsetHeight - 80);
    win.style.width  = w + 'px';
    win.style.height = h + 'px';
    win.style.left   = Math.max(10, (ws.offsetWidth  - w) / 2 + 30) + 'px';
    win.style.top    = Math.max(10, (ws.offsetHeight - h) / 2 + 20) + 'px';
    win.classList.remove('win-anim');
    void win.offsetWidth;
    win.classList.add('win-anim');
  }
  win.classList.remove('closing');
  win.style.display = 'flex';
  win.style.zIndex  = ++winZCounter;
}

// ── File Viewer ─────────────────────────────────
function openFileTxt(type) {
  let title = '', content = '';
  if (type === 'access') {
    title = 'access.txt';
    content = buildAccessTxtLines().join('\n');
  } else if (type === 'notes') {
    title = 'notes.txt';
    content = '=== SUAS NOTAS ===\n\n';
    if (notes.length) content += notes.map((n, i) => `[${i+1}] ${n}`).join('\n') + '\n';
    else              content += '(nenhuma nota ainda)\n';
    if (labNotes.length) {
      content += '\n=== LAB TIMELINE ===\n\n' + labNotes.join('\n') + '\n';
    }
  } else if (type === 'ioc') {
    title = 'ioc.txt';
    content = '=== INDICATORS OF COMPROMISE ===\n\n';
    content += iocs.length ? iocs.map(i => '• ' + i).join('\n') : '(nenhum IoC detectado ainda)';
    content += '\n';
  } else if (type === 'playbook') {
    title = 'playbook.txt';
    content = buildPlaybookText();
  }
  document.getElementById('txtv-title').textContent = `Mousepad — ${title}`;
  document.getElementById('txtv-fname').textContent = title;
  document.getElementById('txtv-body').textContent = content;
  _showTxtWindow();
}

function buildPlaybookText() {
  const sc = scenario;
  if (!sc) return 'Nenhum cenário ativo.';
  const g = (typeof GUIDES !== 'undefined') && GUIDES[sc.check];
  let txt = '=== GUIA DE INVESTIGAÇÃO ===\n\n';
  if (g) {
    txt += g.title.toUpperCase() + '\n\n';
    g.tips.forEach((t, i) => { txt += `[${i+1}] ${t.t}\n`; });
  } else {
    txt  = '=== PLAYBOOK — FORENSE GERAL ===\n\n';
    txt += '1. status, top — baseline (CPU, load, mem)\n';
    txt += '2. netstat -an, ss -s — conexões TCP/UDP\n';
    txt += '3. tcpdump, iftop, nload — tráfego\n';
    txt += '4. tail -f /var/log/auth.log\n';
    txt += '5. ps aux, cat /etc/crontab, ls /tmp\n';
    txt += '6. whois, geoip, abuse — reputação de IPs\n';
  }
  return txt;
}

function closeTxtViewer() {
  const win = document.getElementById('txtv-window');
  win.classList.add('closing');
  setTimeout(() => { win.style.display = 'none'; win.classList.remove('closing'); }, 150);
}
function minimizeTxtViewer() { closeTxtViewer(); }
function maximizeTxtViewer() {
  const win     = document.getElementById('txtv-window');
  const panel   = document.getElementById('top-panel');
  const taskbar = document.getElementById('taskbar');
  if (txtMaximized) {
    win.style.cssText = txtPrevStyle;
    txtMaximized = false;
  } else {
    txtPrevStyle = win.style.cssText;
    win.style.left        = '0';
    win.style.top         = '0';
    win.style.width       = '100%';
    win.style.height      = '100%';
    win.style.zIndex      = ++winZCounter;
    win.style.resize      = 'none';
    win.style.borderRadius = '0';
    txtMaximized = true;
  }
}

// ── File Manager ────────────────────────────────
function openInvestigationFolder() { _showFmgWindow(); }
function closeFileMgr() {
  const win = document.getElementById('filemgr-window');
  win.classList.add('closing');
  setTimeout(() => { win.style.display = 'none'; win.classList.remove('closing'); }, 150);
}
function minimizeFileMgr() { closeFileMgr(); }
function maximizeFileMgr() {
  const win     = document.getElementById('filemgr-window');
  const panel   = document.getElementById('top-panel');
  const taskbar = document.getElementById('taskbar');
  if (fmgMaximized) {
    win.style.cssText = fmgPrevStyle;
    fmgMaximized = false;
  } else {
    fmgPrevStyle = win.style.cssText;
    win.style.left        = '0';
    win.style.top         = '0';
    win.style.width       = '100%';
    win.style.height      = '100%';
    win.style.zIndex      = ++winZCounter;
    win.style.resize      = 'none';
    win.style.borderRadius = '0';
    fmgMaximized = true;
  }
}

// ── Show Desktop ────────────────────────────────
function showDesktop() {
  WINDOWS.forEach(w => {
    if (!w.minimized) { w.el.style.display = 'none'; w.minimized = true; }
  });
  updateTaskbar();
}

// ── Window Management ───────────────────────────
function openTerminalWindow() {
  const idx  = winOpenCount++;
  const id   = 'win-' + idx;
  const offX = 80 + (idx % 5) * 32;
  const offY = 40 + (idx % 5) * 24;

  const el = document.createElement('div');
  el.className = 'term-window';
  el.id = id;
  el.style.cssText = `left:${offX}px; top:${offY}px; width:760px; height:460px; z-index:${++winZCounter}`;

  el.innerHTML = `
    <div class="tw-titlebar" id="tb-${id}">
      <span class="tw-title" id="tw-title-${id}">root@kali: ~</span>
      <div class="win-btns">
        <span class="win-btn wbtn-min"   title="Minimizar">&#8722;</span>
        <span class="win-btn wbtn-max"   title="Maximizar">&#9633;</span>
        <span class="win-btn wbtn-close" title="Fechar">&#10005;</span>
      </div>
    </div>
    <div class="tw-pane-bar" id="tw-panebar-${id}">
      <button class="tw-pane-add" title="Novo terminal (+)">+</button>
    </div>
    <div class="tw-body" id="tw-body-${id}"></div>
  `;

  document.getElementById('win-layer').appendChild(el);

  const win = {
    id, el,
    bodyEl:    document.getElementById(`tw-body-${id}`),
    paneBarEl: document.getElementById(`tw-panebar-${id}`),
    titleEl:   document.getElementById(`tw-title-${id}`),
    panes: [],
    activePaneIdx: 0,
    minimized: false,
    maximized: false,
    prevStyle: '',
  };
  WINDOWS.push(win);

  // Window control buttons
  el.querySelector('.wbtn-close').onclick = () => closeTermWindow(id);
  el.querySelector('.wbtn-min').onclick   = () => minimizeWindow(id);
  el.querySelector('.wbtn-max').onclick   = () => maximizeWindow(id);

  // Add pane button
  el.querySelector('.tw-pane-add').onclick = () => addPaneToWin(id);

  // Drag from titlebar
  const tb = document.getElementById('tb-' + id);
  tb.addEventListener('pointerdown', e => {
    if (e.target.closest('.win-btns')) return;
    e.preventDefault();
    const ox = el.offsetLeft, oy = el.offsetTop;
    const sx = e.clientX,     sy = e.clientY;
    const move = ev => {
      el.style.left = Math.max(0,  ox + ev.clientX - sx) + 'px';
      el.style.top  = Math.max(28, oy + ev.clientY - sy) + 'px';
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup',   up);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup',   up);
    focusWin(id);
  });

  // Focus on click anywhere in window
  el.addEventListener('mousedown', () => focusWin(id));

  focusWin(id);
  createPaneInWin(win);
  updateTaskbar();
  scheduleSave();
  return win;
}

function focusWin(id) {
  focusedWinId = id;
  WINDOWS.forEach(w => w.el.classList.toggle('focused', w.id === id));
  const win = WINDOWS.find(w => w.id === id);
  if (win) win.el.style.zIndex = ++winZCounter;
}

function closeTermWindow(id) {
  const win = WINDOWS.find(w => w.id === id);
  if (!win) return;
  win.panes.forEach(p => { if (p.liveProcess) stopLive(p); });
  WINDOWS.splice(WINDOWS.indexOf(win), 1);
  if (focusedWinId === id) {
    focusedWinId = WINDOWS.length ? WINDOWS[WINDOWS.length - 1].id : null;
    if (focusedWinId) focusWin(focusedWinId);
  }
  updateTaskbar();
  scheduleSave();
  win.el.classList.add('closing');
  setTimeout(() => win.el.remove(), 150);
}

function minimizeWindow(id) {
  const win = WINDOWS.find(w => w.id === id);
  if (!win) return;
  win.el.style.display = 'none';
  win.minimized = true;
  updateTaskbar();
  scheduleSave();
}

function maximizeWindow(id) {
  const win = WINDOWS.find(w => w.id === id);
  if (!win) return;
  if (win.maximized) {
    win.el.style.cssText = win.prevStyle;
    win.maximized = false;
  } else {
    win.prevStyle = win.el.style.cssText;
    const panel = document.getElementById('top-panel');
    const taskbar = document.getElementById('taskbar');
    win.el.style.cssText = `left:0; top:0; width:100%; height:100%; z-index:${++winZCounter}; resize:none; border-radius:0; border:none; box-shadow:none`;
    win.maximized = true;
  }
  focusWin(id);
  scheduleSave();
}

function taskbarClickWin(id) {
  const win = WINDOWS.find(w => w.id === id);
  if (!win) return;
  if (win.minimized) {
    win.el.style.display = '';
    win.minimized = false;
    focusWin(id);
  } else if (focusedWinId === id) {
    minimizeWindow(id);
  } else {
    focusWin(id);
  }
  updateTaskbar();
}

function updateTaskbar() {
  const bar = document.getElementById('kt-apps');
  bar.innerHTML = '';
  WINDOWS.forEach(win => {
    const pane = win.panes[win.activePaneIdx];
    const label = pane?.sshConnected
      ? `root@forensics-lab`
      : `Terminal`;
    const btn = document.createElement('button');
    btn.className = 'kt-app-btn' + (win.id === focusedWinId ? ' active' : '') + (win.minimized ? ' minimized' : '');
    btn.id = 'kt-btn-' + win.id;
    btn.innerHTML = `<span class="kt-app-icon">⬛</span>${label}`;
    btn.onclick = () => taskbarClickWin(win.id);
    bar.appendChild(btn);
  });
}

// ── Pane Management ─────────────────────────────
function createPaneInWin(win) {
  if (win.panes.length >= 3) return;
  const paneIdx = win.panes.length;

  const outEl = document.createElement('div');
  outEl.className = 'terminal-out';
  outEl.style.display = paneIdx === win.activePaneIdx ? '' : 'none';
  win.bodyEl.appendChild(outEl);

  const pane = {
    idx: paneIdx, name: 'bash', outEl, win,
    cwd: '/root', cmdHistory: [], histIdx: -1,
    liveProcess: null,
    sshConnected: false, sshAttempts: 0,
    passwordMode: false, passwordBuffer: '',
    confirmPending: null,
  };

  const getPrompt = () => {
    if (pane.passwordMode)  return { pre: null, prompt: '' };
    if (!pane.sshConnected) {
      const localDir = pane.cwd === '/root' ? '~' : pane.cwd;
      return {
        pre:    `<span class="kp-bracket">┌──(</span><span class="kp-user">root㉿kali</span><span class="kp-bracket">)-[</span><span class="kp-path">${localDir}</span><span class="kp-bracket">]</span>`,
        prompt: `<span class="kp-arrow">└─</span><span class="kp-hash"># </span>`,
      };
    }
    const dir = pane.cwd === '/root' ? '~' : pane.cwd;
    return `<span class="fp-user">root</span><span class="fp-at">@</span><span class="fp-host">forensics-lab</span><span class="fp-colon">:</span><span class="fp-path">${dir}</span><span class="fp-hash"># </span>`;
  };

  pane.term = createTerminal(outEl, getPrompt);
  win.panes.push(pane);
  renderWinPaneTabs(win);
  bootKali(pane);
  return pane;
}

function addPaneToWin(id) {
  const win = WINDOWS.find(w => w.id === id);
  if (!win || win.panes.length >= 3) return;
  const newPane = createPaneInWin(win);
  if (newPane) switchPaneInWin(win, newPane.idx);
}

function switchPaneInWin(win, idx) {
  win.panes[win.activePaneIdx].outEl.style.display = 'none';
  win.activePaneIdx = idx;
  win.panes[idx].outEl.style.display = '';
  renderWinPaneTabs(win);
  const inp = win.panes[idx].outEl.querySelector('.terminal-inline-input');
  if (inp) inp.focus();
  updateTaskbar();
}

function closePaneInWin(win, idx) {
  if (win.panes.length <= 1) { closeTermWindow(win.id); return; }
  if (win.panes[idx].liveProcess) stopLive(win.panes[idx]);
  win.panes[idx].outEl.remove();
  win.panes.splice(idx, 1);
  win.panes.forEach((p, i) => { p.idx = i; });
  win.activePaneIdx = Math.min(win.activePaneIdx, win.panes.length - 1);
  renderWinPaneTabs(win);
  win.panes[win.activePaneIdx].outEl.style.display = '';
}

function renderWinPaneTabs(win) {
  const bar    = win.paneBarEl;
  const addBtn = bar.querySelector('.tw-pane-add');
  bar.querySelectorAll('.tw-pane-tab').forEach(b => b.remove());

  win.panes.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'tw-pane-tab' + (i === win.activePaneIdx ? ' active' : '');
    btn.innerHTML = `<span>${p.sshConnected ? 'forensics-lab' : 'bash'}</span>` +
      (win.panes.length > 1 ? `<span class="tw-pane-close" data-idx="${i}">×</span>` : '');
    btn.addEventListener('click', e => {
      if (e.target.classList.contains('tw-pane-close')) {
        closePaneInWin(win, parseInt(e.target.dataset.idx));
      } else {
        switchPaneInWin(win, i);
      }
    });
    bar.insertBefore(btn, addBtn);
  });

  addBtn.style.display = win.panes.length >= 3 ? 'none' : '';
}

// ── Live process ────────────────────────────────
function startLive(pane, renderFn, intervalMs) {
  stopLive(pane);
  const container = pane.term.createLiveContainer();
  const update = () => pane.term.renderLive(container, renderFn());
  update();

  function liveKeyHandler(e) {
    if (currentPane() !== pane) return;
    const isCtrlC = e.ctrlKey && e.key === 'c';
    const isQ = e.key === 'q' || e.key === 'Q';
    if (isCtrlC || isQ) {
      e.preventDefault();
      stopLive(pane);
      pane.term.appendLine(`<span class="dim">${isCtrlC ? '^C' : 'q'}</span>`);
      pane.term.createInputLine(makeOnKey(pane));
    }
  }

  document.addEventListener('keydown', liveKeyHandler);
  pane.liveProcess = { iv: setInterval(update, intervalMs), container, liveKeyHandler };
}
function stopLive(pane) {
  if (!pane.liveProcess) return;
  clearInterval(pane.liveProcess.iv);
  if (pane.liveProcess.liveKeyHandler) document.removeEventListener('keydown', pane.liveProcess.liveKeyHandler);
  pane.liveProcess = null;
}

// ── Keyboard Handler ────────────────────────────
function makeOnKey(pane) {
  return function onKey(e) {
    const input = e.currentTarget;
    const t = pane.term;

    // ── Password input (visible, browser handles chars/backspace natively) ──
    if (pane.passwordMode) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const pwd = input.value;
        t.freezeInputLine(pwd);   // prompt is empty (passwordMode still true)
        pane.passwordMode = false;
        handlePasswordInput(pwd, pane);
      }
      return; // let all other keys (chars, backspace) be handled by the browser
    }

    // ── Confirm-pending (e.g. new-session) ──
    if (pane.confirmPending) {
      if (e.key === 'Enter') {
        const val = input.value.trim().toLowerCase();
        const action = pane.confirmPending;
        pane.confirmPending = null;
        t.freezeInputLine(val || '');
        handleConfirmInput(val, action, pane);
      }
      return;
    }

    // ── Normal shortcuts ──
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      if (pane.liveProcess) { stopLive(pane); t.appendLine('<span class="dim">^C</span>'); }
      else { t.freezeInputLine(input.value + '^C'); }
      t.createInputLine(makeOnKey(pane));
      return;
    }
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      if (pane.liveProcess) stopLive(pane);
      t.clear(); t.createInputLine(makeOnKey(pane));
      return;
    }
    if (e.ctrlKey && e.key === 'd') {
      if (pane.sshConnected) {
        e.preventDefault();
        if (pane.liveProcess) stopLive(pane);
        pane.sshConnected = false;
        pane.cwd = '/root';
        if (pane.win?.titleEl) pane.win.titleEl.textContent = 'root@kali: ~';
        renderWinPaneTabs(pane.win);
        updateTaskbar();
        t.appendLine('<span class="dim">logout</span>');
        t.appendLine('');
        t.appendLine(`<span class="dim">Connection to ${sessionCreds.ip} closed.</span>`);
        t.appendLine('');
        t.createInputLine(makeOnKey(pane));
      }
      return;
    }

    if (e.key === 'Enter')     { runCmdOnPane(input.value, pane); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); if (pane.histIdx < pane.cmdHistory.length-1) input.value = pane.cmdHistory[++pane.histIdx]; return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); pane.histIdx > 0 ? (input.value = pane.cmdHistory[--pane.histIdx]) : (pane.histIdx=-1, input.value=''); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.toLowerCase();
      const match = (typeof ALL_CMD_NAMES !== 'undefined') && ALL_CMD_NAMES.find(c => c.startsWith(v));
      if (match) input.value = match;
    }
  };
}

// ── Confirm handler ─────────────────────────────
async function handleConfirmInput(val, action, pane) {
  const t = pane.term;
  if (['s','sim','y','yes'].includes(val)) {
    if (action === 'new-session') {
      await t.printLines(['<span class="dim">encerrando sessão...</span>', ''], 0, 30);
      setTimeout(() => doNewSession(), 600);
    }
  } else {
    await t.printLines(['<span class="dim">operação cancelada.</span>', '']);
    t.createInputLine(makeOnKey(pane));
  }
}

// ── Password validation ─────────────────────────
async function handlePasswordInput(pwd, pane) {
  const t = pane.term;
  pane.sshAttempts = (pane.sshAttempts || 0) + 1;

  if (pwd === sessionCreds.password) {
    pane.sshAttempts = 0;
    await doBootSSH(pane);
    t.createInputLine(makeOnKey(pane));
  } else if (pane.sshAttempts >= 3) {
    await t.printLines([
      `<span class="red">${sessionCreds.user}@${sessionCreds.ip}: Permission denied (publickey,password).</span>`,
      '',
    ], 0, 30);
    pane.sshAttempts = 0;
    t.createInputLine(makeOnKey(pane));
  } else {
    await t.printLines([`<span class="red">Permission denied, please try again.</span>`]);
    await t.appendLine(`<span class="dim">${sessionCreds.user}@${sessionCreds.ip}'s password: </span>`);
    pane.passwordMode = true;
    pane.passwordBuffer = '';
    t.createInputLine(makeOnKey(pane));
  }
  scheduleSave();
}

// ── Core command runner ─────────────────────────
async function runCmdOnPane(rawInput, pane) {
  const raw = rawInput.trim();
  const t   = pane.term;

  if (!raw) {
    t.freezeInputLine('');
    t.createInputLine(makeOnKey(pane));
    return;
  }

  if (pane.liveProcess) stopLive(pane);
  t.freezeInputLine(raw);
  pane.cmdHistory.unshift(raw);
  pane.histIdx = -1;

  const parts = raw.toLowerCase().split(/\s+/);
  const c     = parts[0];
  const args  = parts.slice(1);

  try {
    if (c === 'clear') { t.clear(); return; }

    if (c === 'reboot' || c === 'new-session' || c === 'reset') {
      await t.printLines([
        '',
        `<span class="yellow">Broadcast message from root@forensics-lab (pts/0):</span>`,
        `<span class="yellow">The system is going down for reboot NOW!</span>`,
        '',
        `<span class="dim">Connection to ${sessionCreds?.ip || '10.0.0.1'} closed.</span>`,
        '',
      ], 0, 40);
      await new Promise(r => setTimeout(r, 1200));
      showLoginScreen(() => doNewSession());
      return;
    }

    // ── PRE-SSH: kali local shell ──
    if (!pane.sshConnected) {
      await handleKaliCmd(c, args, raw, pane);
      return;
    }

    // ── POST-SSH: full forensics shell ──
    cmdLog.push(raw);

    // Pipe support
    if (raw.includes(' | ')) {
      const segments = raw.split(' | ');
      let lines = getCmdLines(segments[0].trim(), pane);
      if (!lines) {
        await t.printLines([`<span class="red">pipe: comando não reconhecido: ${esc(segments[0].trim().split(' ')[0])}</span>`, '']);
        return;
      }
      for (let i = 1; i < segments.length; i++) lines = applyPipeFilter(segments[i].trim(), lines);
      await t.printLines(lines.length ? lines : ['<span class="dim">(sem resultados)</span>', ''], 0, 40);
      return;
    }

    if (c === 'hint') {
      hintCount++;
      const h = scenario.hints[(hintCount - 1) % scenario.hints.length];
      await t.printLines(['', `<span class="yellow">dica [${hintCount}/${scenario.hints.length}]:</span> <span class="dim">${h}</span>`, '']);
      return;
    }

    if (c === 'note') {
      const txt = raw.slice(5).trim().replace(/^["']|["']$/g, '');
      if (txt) { notes.push(txt); await t.printLines([`<span class="green">nota adicionada →</span> <span class="dim">${esc(txt)}</span>`, '']); }
      else       await t.printLines(['<span class="dim">uso: note "texto da nota"</span>', '']);
      return;
    }

    if (c === 'notes') {
      const lines = ['', '<span class="blue bold">suas notas:</span>'];
      if (notes.length) notes.forEach((n, i) => lines.push(`  <span class="dim">[${i+1}]</span> ${n}`));
      else              lines.push('  <span class="dim">(nenhuma)</span>');
      if (labNotes.length) { lines.push('', '<span class="blue bold">lab timeline:</span>'); labNotes.forEach(n => lines.push(`  <span class="dim">${n}</span>`)); }
      lines.push('');
      await t.printLines(lines, 0, 18);
      return;
    }

    if (c === 'ioc') {
      const lines = ['', '<span class="red bold">indicators of compromise:</span>'];
      if (iocs.length) iocs.forEach(i => lines.push(`  <span class="red">•</span> ${i}`));
      else             lines.push('  <span class="dim">(nenhum detectado)</span>');
      lines.push('');
      await t.printLines(lines, 0, 18);
      return;
    }

    if (c === 'report')   { await cmdReport(t);             return; }
    if (c === 'timeline') { await cmdTimeline(t);           return; }
    if (c === 'score')    { await cmdScore(t);              return; }
    if (c === 'history')  { await cmdHistoryPrint(t, pane); return; }

    if (c === 'playbook' || c === 'man') {
      const type  = args[0];
      const guide = (typeof GUIDES !== 'undefined') && type && GUIDES[type] ? GUIDES[type] : null;
      if (guide) {
        const lines = ['', `<span class="blue bold">PLAYBOOK: ${guide.title.toUpperCase()}</span>`, ''];
        guide.tips.forEach((tip, i) => lines.push(`  <span class="dim">[${i+1}]</span> ${tip.t}`));
        lines.push('');
        await t.printLines(lines, 0, 20);
      } else {
        const allTypes = typeof GUIDES !== 'undefined' ? Object.keys(GUIDES).join(' | ') : '';
        await t.printLines([
          '', '<span class="blue bold">PLAYBOOK — guia de investigação forense</span>', '',
          '  <span class="dim">1.</span> <code>status</code>, <code>top</code> — baseline',
          '  <span class="dim">2.</span> <code>netstat -an</code>, <code>ss -s</code> — conexões',
          '  <span class="dim">3.</span> <code>tcpdump</code>, <code>iftop</code>, <code>nload</code> — tráfego',
          '  <span class="dim">4.</span> <code>tail -f /var/log/auth.log</code> — logs',
          '  <span class="dim">5.</span> <code>ps aux</code>, <code>cat /etc/crontab</code>, <code>ls /tmp</code>',
          '  <span class="dim">6.</span> <code>whois</code>, <code>geoip</code>, <code>abuse</code> — reputação IP',
          '', allTypes ? `<span class="dim">tipos: ${allTypes}</span>` : '', '',
        ], 0, 20);
      }
      return;
    }

    if (c === 'whoami') { await t.printLines(['<span class="fp-user">root</span>']); return; }
    if (c === 'uname')  { await t.printLines(['<span class="dim">Linux forensics-lab 6.1.0-amd64 #1 SMP x86_64 GNU/Linux</span>']); return; }

    if (c === 'cd') {
      const target   = args[0] || '/root';
      const resolved = resolvePath(pane.cwd, target);
      if (isValidPath(resolved)) {
        pane.cwd = resolved;
        if (pane.win?.titleEl) pane.win.titleEl.textContent = `root@forensics-lab: ${resolved === '/root' ? '~' : resolved}`;
        revealTimeline(resolved.startsWith('/tmp') ? 'ls_tmp' : null);
      } else {
        await t.printLines([`<span class="red">cd: ${esc(target)}: No such file or directory</span>`]);
      }
      return;
    }

    if (c === 'pwd') { await t.printLines([pane.cwd]); return; }

    if (c === 'ls') {
      const hasLong = args.some(a => a.startsWith('-') && a.includes('l'));
      const nonFlags = args.filter(a => !a.startsWith('-'));
      const target = nonFlags[0] || pane.cwd;
      const lines = hasLong ? CMDS.lsLong(scenario, target) : CMDS.lsPath(scenario, target);
      await t.printLines(lines);
      if (target.startsWith('/tmp') || (pane.cwd.startsWith('/tmp') && !nonFlags[0])) revealTimeline('ls_tmp');
      return;
    }

    if (c === 'cat') {
      const path  = args.join(' ');
      const lines = handleCat(args, scenario);
      await t.printLines(lines, 0, 18);
      if (path.includes('crontab'))                              revealTimeline('crontab');
      else if (path.includes('auth'))                            revealTimeline('auth_log');
      else if (path.includes('nginx')||path.includes('access')) revealTimeline('nginx_log');
      else if (path.includes('syslog'))                          revealTimeline('syslog');
      autoIoc('cat', path);
      return;
    }

    if (c === 'find') {
      const findDelay = 800 + Math.random() * 1200;
      await t.appendLine('<span class="dim">find: searching...</span>');
      await new Promise(r => setTimeout(r, findDelay));
      const lines = CMDS.find(scenario, args);
      await t.printLines(lines, 0, 18);
      revealTimeline('find');
      if (scenario.check === 'cryptominer') addIoc('binário xmrig encontrado em /tmp/.xmr/');
      if (scenario.check === 'ransomware')  addIoc('toolkit ransomware em /tmp/.crypt/');
      if (scenario.check === 'botnet_c2')   addIoc('agente botnet encontrado em /tmp/.agent/');
      return;
    }

    if (c === 'kill' || c === 'pkill') {
      await handleKill(c, args, pane);
      return;
    }

    if (c === 'rm') {
      await handleRm(args, pane);
      return;
    }

    if (c === 'wc') {
      if (!args.includes('-l')) { await t.printLines(['<span class="dim">uso: wc -l &lt;arquivo&gt;</span>', '']); return; }
      const wNonFlags = args.filter(a => !a.startsWith('-'));
      const wFile = wNonFlags[0] || '';
      if (!wFile) { await t.printLines(['<span class="red">wc: faltando arquivo. use pipe: cmd | wc -l</span>', '']); return; }
      let wLines = [];
      if (wFile.includes('auth'))                                    wLines = CMDS.auth_log(scenario);
      else if (wFile.includes('nginx')||wFile.includes('access'))   wLines = CMDS.nginx_log(scenario);
      else if (wFile.includes('syslog'))                             wLines = CMDS.syslog(scenario);
      else { await t.printLines([`<span class="red">wc: ${esc(wFile)}: No such file or directory</span>`, '']); return; }
      const wCount = wLines.filter(l => l && l.trim()).length;
      await t.printLines([`<span class="fp-path">${wCount}</span> ${esc(wFile)}`, '']);
      return;
    }

    if (c === 'ps') {
      await t.printLines(CMDS.psaux(scenario), 0, 15);
      revealTimeline('ps_aux');
      autoIoc('top', '');
      if (scenario.check === 'cryptominer')   addIoc('processo xmrig rodando de /tmp/.xmr/ (path suspeito)');
      if (scenario.check === 'botnet_c2')     addIoc('agente botnet em /tmp/.agent/ — conexão C2 ativa');
      if (scenario.check === 'reverse_shell') addIoc('bash -i conectado outbound — shell reverso ativo');
      if (scenario.check === 'webshell')      addIoc('comandos shell executados por www-data (webshell)');
      if (scenario.check === 'log_wipe')      addIoc('processo truncate/shred apagando logs ativamente');
      return;
    }

    if (c === 'grep') {
      const invert      = args.includes('-v');
      const isRecursive = args.includes('-r') || args.includes('-R');
      const nonFlags    = args.filter(a => !a.startsWith('-'));
      const pattern     = nonFlags[0] || '';
      const filePath    = nonFlags.slice(1).join(' ');
      if (!pattern) { await t.printLines(['<span class="red">uso: grep [-rv] &lt;padrão&gt; &lt;arquivo|dir&gt;</span>', '']); return; }
      if (isRecursive) {
        const dir = filePath || pane.cwd;
        revealTimeline('auth_log'); revealTimeline('nginx_log');
        const result = CMDS.grepRecursive(scenario, pattern, dir);
        await t.printLines(result, 0, 40);
        return;
      }
      if (!filePath) { await t.printLines(['<span class="red">grep: faltando arquivo. use pipe: cmd | grep padrão</span>', '']); return; }
      let srcLines = [], trigger = null;
      if (filePath.includes('auth'))                                   { srcLines = CMDS.auth_log(scenario);  trigger = 'auth_log'; autoIoc('auth_log',''); }
      else if (filePath.includes('nginx')||filePath.includes('access')) { srcLines = CMDS.nginx_log(scenario); trigger = 'nginx_log'; autoIoc('nginx_log',''); }
      else if (filePath.includes('syslog'))                            { srcLines = CMDS.syslog(scenario);    trigger = 'syslog'; }
      else if (filePath.includes('dmesg'))                             { srcLines = CMDS.dmesg(scenario);     trigger = 'dmesg'; }
      else { await t.printLines([`<span class="red">grep: ${esc(filePath)}: No such file or directory</span>`, '']); return; }
      if (trigger) revealTimeline(trigger);
      const result = CMDS.grepFilter(srcLines, pattern, invert);
      await t.printLines(result.length ? result : ['<span class="dim">(sem resultados)</span>', ''], 0, 40);
      return;
    }

    if (c === 'tail') {
      const isF = args.includes('-f');
      let nLines = 10;
      const nIdx = args.indexOf('-n');
      if (nIdx !== -1 && args[nIdx+1]) nLines = parseInt(args[nIdx+1]) || 10;
      else { const m = args.find(a => /^-\d+$/.test(a)); if (m) nLines = parseInt(m.slice(1)) || 10; }
      const nonFlagArgs = args.filter((a, i) => {
        if (a.startsWith('-')) return false;
        if (i > 0 && args[i-1] === '-n') return false;
        return true;
      });
      const logFile = nonFlagArgs[0] || '';
      let logKey = null, trigger = null;
      if (logFile.includes('auth'))                                      { logKey='auth';   trigger='auth_log'; }
      else if (logFile.includes('nginx')||logFile.includes('access'))    { logKey='nginx';  trigger='nginx_log'; }
      else if (logFile.includes('syslog')||logFile.includes('messages')) { logKey='syslog'; trigger='syslog'; }
      if (!logKey) {
        await t.printLines([`<span class="red">tail: cannot open '${esc(logFile)}': No such file or directory</span>`, '']);
        return;
      }
      let existingLines;
      if (logKey==='auth')       { autoIoc('auth_log',''); existingLines = CMDS.auth_log(scenario); }
      else if (logKey==='nginx') { autoIoc('nginx_log',''); existingLines = CMDS.nginx_log(scenario); }
      else                       { existingLines = CMDS.syslog(scenario); }
      revealTimeline(trigger);
      if (!isF) existingLines = existingLines.filter(l => l !== null && l !== undefined).slice(-nLines);
      await t.printLines(existingLines, 0, 18);
      if (isF) {
        await t.appendLine(`<span class="dim">--- seguindo ${esc(logFile)} --- (Ctrl+C para parar)</span>`);
        function tailKeyHandler(e) {
          if (currentPane() !== pane) return;
          if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            stopLive(pane);
            t.appendLine('<span class="dim">^C</span>');
            t.createInputLine(makeOnKey(pane));
          }
        }
        document.addEventListener('keydown', tailKeyHandler);
        const iv = setInterval(() => { const line = generateNewLogLine(logKey, scenario); if (line) t.appendLine(line); }, 1800);
        pane.liveProcess = { iv, container: null, liveKeyHandler: tailKeyHandler };
        return;
      }
      return;
    }

    if (c === 'top' || c === 'htop') {
      await t.printLines(['', '<span class="dim">top — (Ctrl+C para sair)</span>', '']);
      revealTimeline('top'); autoIoc('top','');
      startLive(pane, () => CMDS.liveTop(scenario), 2500);
      return;
    }
    if (c === 'nethogs') {
      await t.printLines(['', '<span class="dim">nethogs — eth0... (Ctrl+C para sair)</span>', '']);
      revealTimeline('nethogs');
      startLive(pane, () => CMDS.liveNethogs(scenario), 2000);
      return;
    }
    if (c === 'iftop') {
      await t.appendLine('');
      await t.appendLine('<span class="dim">iftop: listening on eth0... (Ctrl+C para sair)</span>');
      await new Promise(r => setTimeout(r,1200));
      revealTimeline('iftop');
      startLive(pane, () => CMDS.liveIftop(scenario), 2000);
      return;
    }
    if (c === 'nload') {
      await t.appendLine('');
      await t.appendLine('<span class="dim">nload — eth0... (Ctrl+C para sair)</span>');
      await new Promise(r => setTimeout(r,1000));
      revealTimeline('nload');
      if (['ddos','amp','icmp','ntp_amp'].includes(scenario.check)) addIoc('largura de banda de entrada anômala detectada');
      startLive(pane, () => CMDS.liveNload(scenario), 2000);
      return;
    }
    if (c === 'nmap') {
      const nmapDelay = 3000 + Math.random() * 2000;
      await t.appendLine('<span class="dim">Starting Nmap 7.93 — scanning 192.168.0.10...</span>');
      await new Promise(r => setTimeout(r, nmapDelay));
      await t.printLines(CMDS.nmap(), 0, 18);
      revealTimeline('nmap');
      return;
    }

    if (c === 'tcpdump') {
      await t.printLines(['', '<span class="dim">tcpdump: listening on eth0... (Ctrl+C para sair)</span>']);
      await new Promise(r => setTimeout(r,1800));
      revealTimeline('tcpdump'); maybeAddIoc('tcpdump');
      await t.printLines(CMDS.tcpdump(scenario), 0, 40);
      autoIoc('tcpdump','');
      return;
    }

    // Delegate to CMDS
    let lines = null;
    if      (c === 'status')               lines = CMDS.status(scenario);
    else if (c === 'netstat') { lines = CMDS.netstat(scenario); revealTimeline('netstat'); maybeAddIoc('netstat'); }
    else if (c === 'ss')      { lines = CMDS.ss(scenario);      revealTimeline('ss'); }
    else if (c === 'vmstat')  { lines = CMDS.vmstat(scenario);  revealTimeline('vmstat'); }
    else if (c === 'iostat')  { lines = CMDS.iostat(scenario);  revealTimeline('iostat'); }
    else if (c === 'dmesg')   { lines = CMDS.dmesg(scenario);   revealTimeline('dmesg'); maybeAddIoc('dmesg'); }
    else if (c === 'iptables')  lines = CMDS.iptables(scenario);
    else if (c === 'nmap')      { /* handled above with delay */ }
    else if (c === 'whois')  { lines = CMDS.whois(scenario, args); addIoc(`IP ${args[0]||scenario.whois_ip} investigado via whois`); revealTimeline('whois'); }
    else if (c === 'geoip')  { lines = CMDS.geoip(scenario, args); addIoc(`geolocalização verificada: ${args[0]||scenario.whois_ip}`); }
    else if (c === 'abuse')  { lines = CMDS.abuse(scenario, args); addIoc(`abuse score verificado: ${args[0]||scenario.whois_ip}`); }
    else if (c === 'dig'||c==='host')           lines = CMDS.dig(scenario, args);
    else if (c === 'bgp')                       lines = CMDS.bgp(scenario, args);
    else if (c === 'traceroute'||c==='tracert') lines = CMDS.traceroute(scenario, args);
    else if (c === 'uptime') lines = CMDS.uptime(scenario);
    else if (c === 'df')     lines = CMDS.df();
    else if (c === 'free')   lines = CMDS.free(scenario);
    else if (c === 'help')   lines = CMDS.help();
    else {
      lines = [`<span class="red">bash: ${esc(c)}: command not found</span>`, ''];
    }

    if (lines) await t.printLines(lines, 0, 18);

  } finally {
    if (!pane.liveProcess && !pane.passwordMode && !pane.confirmPending) t.createInputLine(makeOnKey(pane));
    scheduleSave();
  }
}

// ── kill / pkill ────────────────────────────────
async function handleKill(cmd, args, pane) {
  const t  = pane.term;
  const sc = scenario;
  const PIDS  = { cryptominer:'9871', ransomware:'3341', botnet_c2:'7821', reverse_shell:'5123', log_wipe:'6621', webshell:'4412' };
  const NAMES = { cryptominer:'xmrig', ransomware:'enc', botnet_c2:'bot', reverse_shell:'bash', webshell:'bash' };
  const suspPid  = PIDS[sc.check];
  const suspName = NAMES[sc.check];
  const target = args.find(a => !a.startsWith('-')) || '';
  if (!target) { await t.printLines([`<span class="red">uso: kill &lt;pid&gt;  ou  pkill &lt;nome&gt;</span>`, '']); return; }
  const matched = (cmd === 'kill' && target === suspPid) || (cmd === 'pkill' && suspName && target === suspName);
  if (matched) {
    await t.printLines([`<span class="green">processo eliminado (PID ${suspPid})</span>`, '']);
    addIoc(`processo suspeito eliminado: PID ${suspPid} (${suspName || target})`);
    revealTimeline('kill');
  } else if (target === '1' || target === 'init' || target === 'systemd') {
    await t.printLines([`<span class="red">kill: (${target}): Operation not permitted</span>`, '']);
  } else {
    await t.printLines([`<span class="dim">(${target}): No such process</span>`, '']);
  }
}

// ── rm ──────────────────────────────────────────
async function handleRm(args, pane) {
  const t  = pane.term;
  const sc = scenario;
  const isForce = args.some(a => a.startsWith('-') && a.includes('f')) || args.some(a => a.startsWith('-') && a.includes('r'));
  const nonFlags = args.filter(a => !a.startsWith('-'));
  const target = nonFlags.join(' ').trim();
  if (!target) { await t.printLines([`<span class="red">rm: missing operand</span>`, '']); return; }
  const TARGETS = {
    cryptominer:   ['/tmp/.xmr'],
    ransomware:    ['/tmp/.crypt'],
    botnet_c2:     ['/tmp/.agent'],
    webshell:      ['/var/www/html/shell.php', '/tmp/shell.php'],
    reverse_shell: ['/tmp/.sh', '/tmp/.backdoor'],
  };
  const suspicious = TARGETS[sc.check] || [];
  if (target.startsWith('/etc') || target.startsWith('/bin') || target.startsWith('/usr') || target.startsWith('/var/log')) {
    await t.printLines([`<span class="red">rm: cannot remove '${esc(target)}': Permission denied</span>`, '']); return;
  }
  if (suspicious.some(s => target === s || target.startsWith(s))) {
    if (!isForce) { await t.printLines([`<span class="yellow">rm: descend into directory '${esc(target)}'? use -rf para forçar</span>`, '']); return; }
    await t.printLines([`<span class="green">removido: ${esc(target)}</span>`, '']);
    addIoc(`artefato malicioso removido: ${target}`);
    revealTimeline('rm');
  } else {
    await t.printLines([`<span class="red">rm: cannot remove '${esc(target)}': No such file or directory</span>`, '']);
  }
}

// ── Pre-SSH kali shell ──────────────────────────
async function handleKaliCmd(c, args, raw, pane) {
  const t = pane.term;
  if (c === 'clear') { t.clear(); return; }
  if (c === 'whoami') { await t.printLines(['<span class="kp-user">root</span>']); return; }
  if (c === 'id')     { await t.printLines(['<span class="dim">uid=0(root) gid=0(root) groups=0(root)</span>']); return; }
  if (c === 'pwd')    { await t.printLines(['/root']); return; }
  if (c === 'uname')  { await t.printLines(['<span class="dim">Linux kali 6.6.9-amd64 #1 SMP PREEMPT Debian 6.6.9-1kali1 x86_64 GNU/Linux</span>']); return; }
  if (c === 'cd') {
    const target = args[0] || '/root';
    const resolved = resolvePath(pane.cwd, target);
    const LOCAL_VALID = new Set(['/root','~','/home','/tmp','/etc','/var','/var/log','/proc','/opt','/usr','/']);
    if (LOCAL_VALID.has(resolved)) {
      pane.cwd = resolved;
    } else {
      await t.appendLine(`<span class="red">cd: ${esc(args[0])}: No such file or directory</span>`);
    }
    return;
  }
  if (c === 'ls') {
    const hasLong = args.some(a => a.startsWith('-') && a.includes('l'));
    const nonFlags = args.filter(a => !a.startsWith('-'));
    if (!nonFlags[0] && !hasLong) {
      await t.printLines([
        '<span class="kp-path">Desktop</span>  <span class="kp-path">Documents</span>  <span class="kp-path">Downloads</span>  <span class="kp-path">investigation</span>',
        '<span class="dim">access.txt</span>  <span class="dim">.bashrc</span>  <span class="dim">.zshrc</span>',
        '',
      ], 0, 15);
    } else {
      await t.printLines([
        '', '<span class="dim">total 48</span>',
        '<span class="dim">drwx------  5 root root 4096 May 15 <span class="kp-path">.</span></span>',
        '<span class="dim">drwxr-xr-x 20 root root 4096 May 01 <span class="kp-path">..</span></span>',
        '<span class="dim">-rw-r--r--  1 root root  212 May 09 access.txt</span>',
        '<span class="dim">-rw-r--r--  1 root root 3526 May 01 .bashrc</span>',
        '<span class="kp-path">drwxr-xr-x  2 root root 4096 May 15 Desktop</span>',
        '<span class="kp-path">drwxr-xr-x  2 root root 4096 May 15 Documents</span>',
        '<span class="kp-path">drwxr-xr-x  2 root root 4096 May 15 Downloads</span>',
        '<span class="kp-path">drwxr-xr-x  2 root root 4096 May 15 investigation</span>',
        '<span class="dim">-rw-r--r--  1 root root  168 May 01 .profile</span>',
        '<span class="dim">-rw-r--r--  1 root root  861 May 01 .zshrc</span>',
        '',
      ], 0, 15);
    }
    return;
  }
  if (c === 'cat') {
    const file = args.join(' ');
    if (file === 'access.txt' || file === '~/access.txt' || file === '/root/access.txt') {
      await t.printLines(buildAccessTxtLines().map(l => `<span class="dim">${esc(l)}</span>`), 0, 18);
    } else if (file.includes('.bashrc') || file.includes('.zshrc')) {
      await t.printLines([
        '<span class="dim"># ~/.bashrc: executed by bash(1)</span>',
        '<span class="dim">export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin</span>',
        '',
      ], 0, 18);
    } else {
      await t.appendLine(`<span class="red">cat: ${esc(file)}: No such file or directory</span>`);
    }
    return;
  }
  if (c === 'history') {
    const lines = [''];
    [...pane.cmdHistory].reverse().forEach((cmd, i) => lines.push(`<span class="dim">${String(i+1).padStart(4)}</span>  ${esc(cmd)}`));
    lines.push('');
    await t.printLines(lines, 0, 12);
    return;
  }
  if (c === 'ssh') {
    const target = raw.replace(/^ssh\s+/i, '').trim();
    const match  = target.match(/^(?:(\S+)@)?(\S+?)(?:\s|$)/);
    const user   = match?.[1] || 'root';
    const host   = match?.[2] || '';
    if (host === sessionCreds.ip || host === 'forensics-lab') {
      if (user !== sessionCreds.user) {
        await t.appendLine(`<span class="red">${user}@${host}: Permission denied (publickey,password).</span>`);
        return;
      }
      await doSshHandshake(pane, host);
    } else if (host) {
      await new Promise(r => setTimeout(r, 1200));
      await t.appendLine(`<span class="red">ssh: connect to host ${esc(host)} port 22: No route to host</span>`);
    } else {
      await t.appendLine(`<span class="dim">usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] user@hostname</span>`);
    }
    return;
  }
  // Unknown
  await t.appendLine(`<span class="red">zsh: command not found: ${esc(c)}</span>`);
}

// ── SSH handshake (before password) ────────────
async function doSshHandshake(pane, host) {
  const t   = pane.term;
  const crd = sessionCreds;

  // Occasionally simulate a slow/timeout first attempt (~25% chance)
  if (Math.random() < 0.25) {
    await t.appendLine(`<span class="dim">ssh: connect to host ${host} port 22: Connection timed out — retrying...</span>`);
    await new Promise(r => setTimeout(r, 1800));
  }

  await t.printLines([
    `<span class="dim">The authenticity of host '${host} (${host})' can't be established.</span>`,
    `<span class="dim">ED25519 key fingerprint is SHA256:7K3mN9pQ2xR8jYvLd5wFh1cB6sZ0uMtPnAeGI4koXw.</span>`,
    `<span class="yellow">Are you sure you want to continue connecting (yes/no/[fingerprint])? </span><span class="dim">yes</span>`,
    `<span class="dim">Warning: Permanently added '${host}' (ED25519) to the list of known hosts.</span>`,
  ], 0, 60);
  await new Promise(r => setTimeout(r, 900));
  await t.appendLine(`<span class="dim">${crd.user}@${crd.ip}'s password: </span>`);
  pane.passwordMode   = true;
  pane.passwordBuffer = '';
  t.createInputLine(makeOnKey(pane));
}

// ── SSH boot sequence (after correct password) ──
async function doBootSSH(pane) {
  const t = pane.term;
  await new Promise(r => setTimeout(r, 400));
  await t.printLines([
    '',
    '<span class="fp-user bold">Welcome to Ubuntu 22.04.3 LTS</span> <span class="dim">(GNU/Linux 6.1.0-amd64 x86_64)</span>',
    '',
    `<span class="dim"> * Documentation:  https://help.ubuntu.com</span>`,
    `<span class="dim"> * Management:     https://landscape.canonical.com</span>`,
    '',
    `<span class="dim">Last login: ${new Date(Date.now()-3600000).toLocaleString('pt-BR')} from 192.168.0.5</span>`,
    '',
    `<span class="yellow bold">⚠  ALERTA DE SEGURANÇA — ${new Date().toLocaleTimeString('pt-BR')}</span>`,
    '<span class="dim">Anomalia detectada no servidor de produção. Investigue e identifique a ameaça.</span>',
    `<span class="dim">uptime: </span><span class="fp-path">${scenario?.status?.uptime || '9d 3h'}</span>  <span class="dim">load: </span><span class="yellow">${scenario?.status?.load || '0.52'}</span>`,
    '',
    '<span class="dim">use </span><span class="fp-user">help</span><span class="dim"> para comandos  |  </span><span class="fp-user">hint</span><span class="dim"> se travar  |  </span><span class="fp-user">playbook</span><span class="dim"> para guia</span>',
    '',
  ], 0, 45);

  pane.sshConnected = true;
  pane.cwd = '/root';

  if (pane.win?.titleEl) pane.win.titleEl.textContent = 'root@forensics-lab: ~';
  renderWinPaneTabs(pane.win);
  updateTaskbar();

  if (timerSec === 0 && !timerInt) startTimer();
}

// ── Kali local boot ─────────────────────────────
async function bootKali(pane) {
  const now = new Date().toLocaleString('en-US', { weekday:'short', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', year:'numeric' });
  await pane.term.printLines([
    '',
    `<span class="dim">Last login: ${now} on pts/0</span>`,
    '',
  ], 0, 30);
  pane.term.createInputLine(makeOnKey(pane));
  scheduleSave();
}

// ── cat handler ─────────────────────────────────
function handleCat(args, sc) {
  const path = args.join(' ');
  if (path.includes('crontab'))          return CMDS.crontab(sc);
  if (path.includes('passwd'))           return CMDS.passwd();
  if (path.includes('cpuinfo'))          return CMDS.cpuinfo(sc);
  if (path.includes('config.json'))      return CMDS.xmrConfig(sc);
  if (path.includes('nginx')||path.includes('access')) { autoIoc('nginx_log',''); return CMDS.nginx_log(sc); }
  if (path.includes('auth'))             { autoIoc('auth_log',''); return CMDS.auth_log(sc); }
  if (path.includes('syslog')||path.includes('messages')) return CMDS.syslog(sc);
  if (path.includes('shadow'))           return ['<span class="red">cat: /etc/shadow: Permission denied</span>', ''];
  if (!path)                             return ['<span class="red">uso: cat &lt;arquivo&gt;</span>', ''];
  return [`<span class="red">cat: ${esc(path)}: No such file or directory</span>`, ''];
}

// ── Pipe helpers ────────────────────────────────
function getCmdLines(rawCmd, pane) {
  const parts = rawCmd.trim().toLowerCase().split(/\s+/);
  const c     = parts[0];
  const args  = parts.slice(1);
  if (c === 'cat')     return handleCat(args, scenario);
  if (c === 'ps')      return CMDS.psaux(scenario);
  if (c === 'netstat') return CMDS.netstat(scenario);
  if (c === 'ss')      return CMDS.ss(scenario);
  if (c === 'tcpdump') return CMDS.tcpdump(scenario);
  if (c === 'dmesg')   return CMDS.dmesg(scenario);
  if (c === 'vmstat')  return CMDS.vmstat(scenario);
  if (c === 'iostat')  return CMDS.iostat(scenario);
  if (c === 'iptables') return CMDS.iptables(scenario);
  if (c === 'nmap')    return CMDS.nmap();
  if (c === 'find')    return CMDS.find(scenario, args);
  if (c === 'ls') {
    const hasLong = args.some(a => a.startsWith('-') && a.includes('l'));
    const nonFlags = args.filter(a => !a.startsWith('-'));
    const lsTarget = nonFlags[0] || pane.cwd;
    return hasLong ? CMDS.lsLong(scenario, lsTarget) : CMDS.lsPath(scenario, lsTarget);
  }
  if (c === 'status')  return CMDS.status(scenario);
  if (c === 'tail'||c === 'head'||c === 'grep') {
    const nonFlags = args.filter(a => !a.startsWith('-'));
    const file = nonFlags.find(a => a.startsWith('/')) || nonFlags[0] || '';
    if (file.includes('auth'))                              return CMDS.auth_log(scenario);
    if (file.includes('nginx')||file.includes('access'))   return CMDS.nginx_log(scenario);
    if (file.includes('syslog'))                            return CMDS.syslog(scenario);
    return [];
  }
  if (c === 'top'||c === 'htop') return CMDS.liveTop(scenario);
  if (c === 'nethogs')           return CMDS.liveNethogs(scenario);
  if (c === 'iftop')             return CMDS.liveIftop(scenario);
  if (c === 'nload')             return CMDS.liveNload(scenario);
  return null;
}

function applyPipeFilter(rawCmd, lines) {
  const parts = rawCmd.trim().split(/\s+/);
  const c     = parts[0].toLowerCase();
  const args  = parts.slice(1);
  if (c === 'grep') {
    const invert  = args.includes('-v');
    const flags   = new Set(['-v','-i','-n','-E','-e','-r']);
    const pattern = args.find(a => !flags.has(a)) || '';
    return pattern ? CMDS.grepFilter(lines, pattern, invert) : lines;
  }
  if (c === 'head') { const n = parseInt(args.find(a=>/^-?\d+$/.test(a))?.replace('-','') || '10',10); return lines.slice(0,n); }
  if (c === 'tail') { const n = parseInt(args.find(a=>/^-?\d+$/.test(a))?.replace('-','') || '10',10); return lines.slice(-n); }
  if (c === 'wc' && args.includes('-l')) { const count = lines.filter(l=>l&&l.trim()).length; return [`<span class="fp-path">${count}</span>`]; }
  if (c === 'sort') {
    const sorted = [...lines].sort((a, b) => {
      const ta = String(a).replace(/<[^>]+>/g,''), tb = String(b).replace(/<[^>]+>/g,'');
      return args.includes('-n') ? (parseFloat(ta)||0)-(parseFloat(tb)||0) : ta.localeCompare(tb);
    });
    return args.includes('-r') ? sorted.reverse() : sorted;
  }
  if (c === 'uniq') {
    if (args.includes('-c')) {
      const stripH = h => String(h).replace(/<[^>]+>/g,'').trim();
      const counts = new Map(), order = [];
      lines.forEach(l => { const k = stripH(l); if (!k) return; if (!counts.has(k)) { counts.set(k,{line:l,n:0}); order.push(k); } counts.get(k).n++; });
      return order.map(k => `<span class="fp-path">${String(counts.get(k).n).padStart(6)}</span> ${counts.get(k).line}`);
    }
    return [...new Set(lines)];
  }
  return lines;
}

// ── Path helpers ────────────────────────────────
function resolvePath(cwd, target) {
  if (!target || target === '~' || target === '/root') return '/root';
  if (target === '/') return '/';
  if (target === '..') {
    const parts = cwd.replace(/\/$/,'').split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/') || '/';
  }
  if (target.startsWith('/')) return target.replace(/\/$/,'') || '/';
  return (cwd === '/' ? '' : cwd) + '/' + target;
}
const VALID_PATHS = new Set([
  '/root','/root/logs','/root/tools','/root/captures',
  '/var','/var/log','/var/log/nginx','/var/www','/var/www/html',
  '/tmp','/tmp/.xmr','/tmp/.crypt','/tmp/.agent',
  '/etc','/etc/cron.d','/etc/nginx','/etc/ssh',
  '/proc','/run','/home','/',
]);
function isValidPath(path) { return VALID_PATHS.has(path); }

// ── tail -f log line generator ──────────────────
function generateNewLogLine(logKey, sc) {
  const now = new Date();
  const ts  = `${now.toLocaleDateString('pt-BR',{month:'short',day:'2-digit'})} ${now.toLocaleTimeString('pt-BR')}`;
  const R   = () => Math.random();
  if (logKey === 'auth') {
    const users = ['root','admin','ubuntu','oracle','pi','deploy'];
    const u = users[Math.floor(R()*users.length)];
    const port = 40000 + Math.floor(R()*20000);
    if (['brute','ssh_pwned','cred_stuff'].includes(sc.check))
      return `<span class="red">${ts} server sshd[981]: Failed password for ${u} from ${sc.whois_ip} port ${port} ssh2</span>`;
    if (['phishing','insider','apt_lateral'].includes(sc.check))
      return `<span class="yellow">${ts} server sshd[981]: Accepted publickey for root from ${sc.whois_ip}</span>`;
    if (sc.check === 'cryptominer' && R() > 0.7)
      return `<span class="dim">${ts} server CRON[${1000+Math.floor(R()*9000)}]: CMD (/tmp/.xmr/xmrig)</span>`;
    return `<span class="dim">${ts} server sshd[${800+Math.floor(R()*200)}]: pam_unix: session opened for user root</span>`;
  }
  if (logKey === 'nginx') {
    const codes = ['200','200','200','404','503','500'];
    const code  = codes[Math.floor(R()*codes.length)];
    const col   = code[0]==='2'?'dim':code[0]==='4'?'yellow':'red';
    if (['http','cred_stuff'].includes(sc.check))
      return `<span class="${col}">${ts} ${sc.whois_ip} - POST /login HTTP/1.1 ${code} -</span>`;
    const ips = ['192.168.1.1','192.168.1.5','192.168.1.7'];
    return `<span class="dim">${ts} ${ips[Math.floor(R()*ips.length)]} - GET / HTTP/1.1 ${code}</span>`;
  }
  if (logKey === 'syslog') {
    if (['ddos','syn','amp','icmp','ntp_amp'].includes(sc.check))
      return `<span class="red">${ts} kernel: nf_conntrack: table full, dropping packet</span>`;
    if (sc.check === 'ransomware') {
      const files = ['data.db','config.php','index.html','users.csv'];
      return `<span class="red">${ts} kernel: rename /var/www/html/${files[Math.floor(R()*files.length)]} → .crypt</span>`;
    }
    return `<span class="dim">${ts} systemd[1]: Started Session ${Math.floor(R()*100)} of user root.</span>`;
  }
  return null;
}

// ── Timeline ────────────────────────────────────
function revealTimeline(trigger) {
  if (!trigger || !scenario?.timeline || timelineRevealed.has(trigger)) return;
  timelineRevealed.add(trigger);
  const newItems = scenario.timeline.filter(i => i.trigger === trigger);
  newItems.forEach(item => {
    const note = `[${item.time}] ${item.event}`;
    if (!labNotes.includes(note)) labNotes.push(note);
  });
}

// ── IoC ─────────────────────────────────────────
function addIoc(text) {
  if (!iocs.includes(text)) {
    iocs.push(text);
    showToast('⚠ IoC Detectado', text, 'crit');
    scheduleSave();
  }
}

function maybeAddIoc(cmd) {
  const sc = scenario;
  if (cmd === 'netstat') {
    if (['ddos','syn','amp','icmp','ntp_amp'].includes(sc.check)) addIoc('conexões UDP/TCP de múltiplos IPs externos suspeitos');
    if (sc.check === 'slowloris')     addIoc('1000+ conexões do mesmo IP na porta 80');
    if (sc.check === 'cryptominer')   addIoc('conexão de saída para porta 3333 (mining pool)');
    if (sc.check === 'botnet_c2')     addIoc('conexão C2 ativa — agente beaconando para IP externo');
    if (sc.check === 'reverse_shell') addIoc('shell reverso ativo — bash conectado outbound porta 4444');
    if (sc.check === 'data_exfil')    addIoc('alto volume de consultas DNS para domínio externo suspeito');
    if (sc.check === 'brute')         addIoc('múltiplas conexões simultâneas na porta 22 (SSH brute)');
  }
  if (cmd === 'tcpdump') {
    if (['ddos','syn','amp','icmp','ntp_amp'].includes(sc.check)) addIoc('padrão anômalo de pacotes — possível flood');
    if (['http','cred_stuff'].includes(sc.check))                 addIoc('requisições HTTP repetitivas — possível flood L7');
    if (sc.check === 'cryptominer')                               addIoc('protocolo stratum mining detectado (porta 3333)');
    if (sc.check === 'data_exfil')                                addIoc('DNS tunneling — queries com payload codificado');
  }
  if (cmd === 'dmesg') {
    if (['ddos','syn','amp','icmp','ntp_amp'].includes(sc.check)) addIoc('erros de rede no kernel — tabela conntrack saturada');
    if (sc.check === 'ransomware')                                addIoc('escassez de inodes — cifragem massiva em andamento');
    if (['rootkit','container_escape'].includes(sc.check))        addIoc('módulo kernel suspeito carregado');
  }
}

function autoIoc(cmd, path) {
  const sc = scenario;
  if ((cmd==='auth_log'||path.includes('auth'))&&sc.check==='brute')           addIoc('847 tentativas de login SSH em 120s do mesmo IP');
  if ((cmd==='auth_log'||path.includes('auth'))&&sc.check==='cryptominer')     addIoc('login SSH suspeito às 03:47 — fora do horário normal');
  if ((cmd==='auth_log'||path.includes('auth'))&&sc.check==='ssh_pwned')       addIoc('login SSH bem-sucedido de IP suspeito');
  if ((cmd==='auth_log'||path.includes('auth'))&&sc.check==='phishing')        addIoc('acesso de novo IP/país — credencial comprometida via phishing');
  if ((cmd==='auth_log'||path.includes('auth'))&&sc.check==='apt_lateral')     addIoc('movimentação lateral detectada — SSH entre hosts internos');
  if ((cmd==='nginx_log'||path.includes('nginx'))&&sc.check==='http')          addIoc('14.200 req/s com User-Agents idênticos — botnet L7');
  if ((cmd==='nginx_log'||path.includes('nginx'))&&sc.check==='cred_stuff')    addIoc('flood de POST /login — credential stuffing em andamento');
  if ((cmd==='nginx_log'||path.includes('nginx'))&&sc.check==='sqli')          addIoc('SQL injection detectada nos logs nginx');
  if ((cmd==='nginx_log'||path.includes('nginx'))&&sc.check==='lfi')           addIoc('path traversal ../../etc/passwd detectado');
  if ((cmd==='nginx_log'||path.includes('nginx'))&&sc.check==='webshell')      addIoc('acesso a webshell PHP detectado — POST /uploads/shell.php');
  if ((cmd==='nginx_log'||path.includes('nginx'))&&sc.check==='rce')           addIoc('payload RCE em requisição HTTP');
  if ((cmd==='top'||cmd==='htop')&&sc.check==='cryptominer')                   addIoc('processo xmrig com 97% CPU (PID 9871)');
  if ((cmd==='top'||cmd==='htop')&&sc.check==='ransomware')                    addIoc('processo enc 88% CPU — cifragem ativa (PID 3341)');
  if (cmd==='cat'&&path.includes('crontab')&&sc.check==='cryptominer')         addIoc('persistência via crontab: xmrig reinicia a cada minuto');
  if (cmd==='cat'&&path.includes('crontab')&&sc.check==='botnet_c2')           addIoc('persistência via crontab: agente botnet reinicia automaticamente');
  if (cmd==='cat'&&path.includes('crontab')&&sc.check==='ransomware')          addIoc('ransomware com persistência via crontab');
}

// ── Report / Score / History / Timeline ─────────
async function cmdReport(t) {
  const used = scenario.score_cmds.filter(c => cmdLog.some(l => l.toLowerCase().includes(c.toLowerCase())));
  const pct  = Math.round((used.length/scenario.score_cmds.length)*100);
  const tl   = (scenario.timeline||[]).filter(i => timelineRevealed.has(i.trigger));
  await t.printLines([
    '', `<span class="fp-path bold">RELATÓRIO DE INCIDENTE — ${new Date().toLocaleString('pt-BR')}</span>`,
    '<span class="dim">────────────────────────────────────────────</span>',
    `  <span class="dim">duração:</span>     <span class="fp-path">${fmtTimer()}</span>`,
    `  <span class="dim">comandos:</span>    <span class="fp-path">${cmdLog.length}</span>`,
    `  <span class="dim">cobertura:</span>   <span class="${pct>70?'green':pct>40?'yellow':'red'}">${pct}%</span>`,
    `  <span class="dim">IoCs:</span>        <span class="red">${iocs.length}</span>`,
    `  <span class="dim">timeline:</span>    <span class="fp-path">${tl.length}/${(scenario.timeline||[]).length} eventos</span>`,
    `  <span class="dim">notas:</span>       <span class="fp-path">${notes.length}</span>`,
    `  <span class="dim">dicas:</span>       <span class="yellow">${hintCount}</span>`,
    '', '<span class="dim">IoCs detectados:</span>',
    ...(iocs.length>0 ? iocs.map(i=>`  <span class="red">• ${i}</span>`) : ['  <span class="dim">nenhum</span>']),
    '',
  ], 0, 18);
}

async function cmdTimeline(t) {
  const all     = scenario.timeline || [];
  const visible = all.filter(i => timelineRevealed.has(i.trigger));
  const lines   = ['', '<span class="fp-path bold">linha do tempo do ataque:</span>'];
  if (visible.length>0) {
    visible.forEach(i => {
      const col = i.cls==='crit'?'red':i.cls==='warn'?'yellow':i.cls==='info'?'fp-path':'dim';
      lines.push(`  <span class="dim">[${i.time}]</span> <span class="${col}">${i.event}</span>`);
    });
    if (visible.length<all.length) lines.push(`  <span class="dim">... +${all.length-visible.length} evento(s) oculto(s)</span>`);
  } else { lines.push('  <span class="dim">nenhum evento revelado — continue investigando</span>'); }
  lines.push('');
  await t.printLines(lines, 0, 25);
}

async function cmdScore(t) {
  const used    = scenario.score_cmds.filter(c => cmdLog.some(l => l.toLowerCase().includes(c.toLowerCase())));
  const missing = scenario.score_cmds.filter(c => !cmdLog.some(l => l.toLowerCase().includes(c.toLowerCase())));
  const pct     = Math.round((used.length/scenario.score_cmds.length)*100);
  await t.printLines([
    '',
    `<span class="${pct>70?'green':pct>40?'yellow':'red'}">${pct}% cobertura</span> <span class="dim">(${used.length}/${scenario.score_cmds.length} comandos-chave)</span>`,
    '',
    ...(used.length>0    ? ['<span class="dim">usados:</span>',   ...used.map(c=>`  <span class="green">✓ ${c}</span>`)] : []),
    ...(missing.length>0 ? ['<span class="dim">faltando:</span>',  ...missing.map(c=>`  <span class="yellow">○ ${c}</span>`)] : []),
    '',
  ], 0, 20);
}

async function cmdHistoryPrint(t, pane) {
  const lines = [''];
  [...pane.cmdHistory].forEach((c, i) => lines.push(`<span class="dim">${String(i+1).padStart(4)}</span>  ${esc(c)}`));
  lines.push('');
  await t.printLines(lines, 0, 12);
}

// ── Timer ────────────────────────────────────────
function fmtTimer() {
  const m = String(Math.floor(timerSec/60)).padStart(2,'0');
  const s = String(timerSec%60).padStart(2,'0');
  return `${m}:${s}`;
}
function startTimer() {
  timerInt = setInterval(() => { timerSec++; }, 1000);
}

// ── Login Screen ────────────────────────────────
function _loginPassword() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  return `${dd}${mm}${d.getFullYear()}`;
}

function showLoginScreen(onSuccess) {
  const el    = document.getElementById('login-screen');
  const inp   = document.getElementById('ls-pwd');
  const err   = document.getElementById('ls-error');
  const hint  = document.getElementById('ls-hint');
  const line1 = document.getElementById('ls-line1');
  const bar   = document.getElementById('ls-tty-bar');

  const now = new Date().toLocaleString('en-US', { weekday:'short', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', year:'numeric' });
  bar.textContent  = `Ubuntu 22.04.3 LTS forensics-lab tty1`;
  line1.textContent = `\nBroadcast message from root@forensics-lab:\nThe system has rebooted — ${now}\n`;
  hint.textContent  = `Password format: DDMMYYYY`;

  err.classList.remove('visible');
  inp.value = '';
  el.classList.remove('hidden', 'ls-fade-out');

  setTimeout(() => inp.focus(), 80);

  function onKey(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (inp.value === _loginPassword()) {
      inp.removeEventListener('keydown', onKey);
      el.classList.add('ls-fade-out');
      setTimeout(() => {
        el.classList.add('hidden');
        el.classList.remove('ls-fade-out');
        onSuccess();
      }, 300);
    } else {
      err.classList.add('visible');
      inp.value = '';
      setTimeout(() => err.classList.remove('visible'), 2000);
    }
  }
  inp.addEventListener('keydown', onKey);
}

// ── New Session ──────────────────────────────────
function triggerNewSession() {
  if (confirm('Iniciar novo cenário? A sessão atual será encerrada sem salvar.')) {
    doNewSession();
  }
}
function doNewSession() {
  clearSavedState();
  scenario = pickScenario();
  sessionCreds = generateCreds();
  iocs = []; notes = []; labNotes = []; cmdLog = []; hintCount = 0;
  timelineRevealed = new Set(['none']);
  timerSec = 0;
  clearInterval(timerInt);
  timerInt = null;

  [...WINDOWS].forEach(w => closeTermWindow(w.id));
  setRandomWallpaper();

  const win = openTerminalWindow();
  updateTaskbar();
}

// ── Desktop selection (rubber-band) ─────────────
function initDesktopSelection() {
  const workspace = document.getElementById('workspace');

  const selBox = document.createElement('div');
  selBox.className = 'desktop-select-rect';
  workspace.appendChild(selBox);

  let sel = null;
  let wsRect = null;

  // Single-click on icon → select it, stop rubber-band from starting
  document.querySelectorAll('.d-icon').forEach(icon => {
    icon.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();
      if (!e.shiftKey) {
        document.querySelectorAll('.d-icon.selected').forEach(el => el.classList.remove('selected'));
      }
      icon.classList.add('selected');
    });
  });

  // Mousedown on workspace empty area → start rubber-band
  workspace.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (e.target.closest('.d-icon')) return;
    // Clicking into any window deselects icons
    document.querySelectorAll('.d-icon.selected').forEach(el => el.classList.remove('selected'));
    if (e.target.closest('.term-window') || e.target.closest('.txtv-window') || e.target.closest('.filemgr-window')) return;
    document.querySelectorAll('.d-icon.selected').forEach(el => el.classList.remove('selected'));
    wsRect = workspace.getBoundingClientRect();
    sel = { x0: e.clientX - wsRect.left, y0: e.clientY - wsRect.top };
    selBox.style.left = sel.x0 + 'px'; selBox.style.top = sel.y0 + 'px';
    selBox.style.width = '0'; selBox.style.height = '0';
    selBox.style.display = 'block';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!sel || !wsRect) return;
    const x1 = e.clientX - wsRect.left, y1 = e.clientY - wsRect.top;
    const x = Math.min(x1, sel.x0), y = Math.min(y1, sel.y0);
    const w = Math.abs(x1 - sel.x0), h = Math.abs(y1 - sel.y0);
    selBox.style.left = x + 'px'; selBox.style.top = y + 'px';
    selBox.style.width = w + 'px'; selBox.style.height = h + 'px';
    document.querySelectorAll('.d-icon').forEach(icon => {
      const r = icon.getBoundingClientRect();
      const il = r.left - wsRect.left, ir = r.right - wsRect.left;
      const it = r.top  - wsRect.top,  ib = r.bottom - wsRect.top;
      icon.classList.toggle('selected', il < x + w && ir > x && it < y + h && ib > y);
    });
  });

  document.addEventListener('mouseup', () => {
    if (!sel) return;
    sel = null; wsRect = null;
    selBox.style.display = 'none';
  });

  // Enter → open all selected icons (skip when terminal input is focused)
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (e.target.classList?.contains('terminal-inline-input')) return;
      document.querySelectorAll('.d-icon.selected').forEach(icon => {
        const name = icon.querySelector('.d-icon-name')?.textContent?.trim();
        if (name === 'access.txt')         openFileTxt('access');
        else if (name === 'investigation') openInvestigationFolder();
        else if (name === 'Terminal')      openTerminalWindow();
      });
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('.d-icon.selected').forEach(el => el.classList.remove('selected'));
    }
  });
}

// ── Floating window drag ─────────────────────────
function initFloatingWindows() {
  function makeDraggable(winEl, tbEl) {
    tbEl.addEventListener('pointerdown', e => {
      if (e.target.closest('.win-btns')) return;
      e.preventDefault();
      const ox = winEl.offsetLeft, oy = winEl.offsetTop;
      const sx = e.clientX,        sy = e.clientY;
      const move = ev => {
        winEl.style.left = Math.max(0,  ox + ev.clientX - sx) + 'px';
        winEl.style.top  = Math.max(28, oy + ev.clientY - sy) + 'px';
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup',   up);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup',   up);
      winEl.style.zIndex = ++winZCounter;
    });
    winEl.addEventListener('mousedown', () => { winEl.style.zIndex = ++winZCounter; });
  }

  const t1 = document.getElementById('txtv-titlebar');
  const w1 = document.getElementById('txtv-window');
  if (t1 && w1) makeDraggable(w1, t1);

  const t2 = document.getElementById('filemgr-titlebar');
  const w2 = document.getElementById('filemgr-window');
  if (t2 && w2) makeDraggable(w2, t2);
}

// ── Left desktop icons ───────────────────────────
const LEFT_ICON_POOL = [
  { gfx: '📁', name: 'wordlists',        action: () => showToast('wordlists/', '/usr/share/wordlists/ — rockyou.txt.gz, dirb', 'info') },
  { gfx: '📁', name: 'captures',         action: () => showToast('captures/', '/root/captures — arquivos .pcap', 'info') },
  { gfx: '📄', name: 'targets.txt',      action: () => openExtraFileTxt('targets') },
  { gfx: '📄', name: 'scan-results.txt', action: () => openExtraFileTxt('scan') },
  { gfx: '📁', name: 'tools',            action: () => showToast('tools/', '/root/tools — scripts custom de pentest', 'info') },
  { gfx: '📄', name: 'vuln-notes.txt',   action: () => openExtraFileTxt('vulnnotes') },
  { gfx: '📁', name: '.local',           action: () => showToast('.local/', 'Arquivos ocultos de configuração local', 'info') },
  { gfx: '📄', name: 'recon.txt',        action: () => openExtraFileTxt('recon') },
];

function openExtraFileTxt(type) {
  const ip = sessionCreds?.ip || '192.168.1.10';
  let title = '', content = '';
  if (type === 'targets') {
    title   = 'targets.txt';
    content = `=== TARGETS ===\n\n${ip}  — servidor de produção\n192.168.1.1   — gateway/roteador\n10.0.0.1      — DNS interno\n10.0.0.5      — LDAP / AD\n`;
  } else if (type === 'scan') {
    title   = 'scan-results.txt';
    content = `=== NMAP SCAN — ${new Date().toLocaleDateString('pt-BR')} ===\n\nHost: ${ip} (Up 0.00087s latency)\n\nPORT     STATE  SERVICE    VERSION\n22/tcp   open   ssh        OpenSSH 8.9p1 Ubuntu\n80/tcp   open   http       nginx 1.18.0\n443/tcp  closed https\n3306/tcp filtered mysql\n\nOS: Linux 6.x (Ubuntu 22.04)\nScan time: 3.42s\n`;
  } else if (type === 'vulnnotes') {
    title   = 'vuln-notes.txt';
    content = `=== VULN NOTES ===\n\nData:          ${new Date().toLocaleDateString('pt-BR')}\nInvestigador:  root@kali\nScope:         ${ip}\n\nPortas abertas: 22, 80\nCVEs pendentes:\n  CVE-2024-3094 — openssh (checar versão)\n  CVE-2023-44487 — nginx HTTP/2\n\nNext steps:\n  - Verificar versões exatas de serviços\n  - Checar /var/log/auth.log\n  - Analisar processos em memória (ps aux)\n`;
  } else if (type === 'recon') {
    title   = 'recon.txt';
    content = `=== RECON — ${ip} ===\n\nASN:      AS15169 (simulado)\nPaís:     BR\nOrg:      LAB-NET\nRDNS:     server.lab.internal\n\nDNS:      A → ${ip}\nMX:       mail.lab.internal\nTXT:      v=spf1 include:lab.internal ~all\n\nSSL:      Let's Encrypt — expira em 87d\n`;
  } else {
    title   = 'readme.txt';
    content = `=== CyberSec Lab ===\n\nBem-vindo ao ambiente de investigação forense.\n\n1. Abra access.txt na área de trabalho\n2. Anote o IP e a senha do servidor\n3. Conecte via SSH no terminal:\n   ssh root@<IP>\n\nCOMANDOS ÚTEIS:\n  ps aux, netstat -an, top\n  cat /var/log/auth.log\n  find / -mtime -1\n  hint     — pedir dica\n  playbook — guia de investigação\n  score    — cobertura de evidências\n`;
  }
  document.getElementById('txtv-title').textContent = `Mousepad — ${title}`;
  document.getElementById('txtv-fname').textContent = title;
  document.getElementById('txtv-body').textContent  = content;
  _showTxtWindow();
}

function initDesktopIcons() {
  const container = document.getElementById('desktop-icons-left');
  if (!container) return;
  container.innerHTML = '';

  // Fixed icons always present
  const fixed = [
    { gfx: '📁', name: 'forensics-kit', action: () => showToast('forensics-kit/', '/root/forensics-kit — IR toolkit (volatility, yara, binwalk)', 'info') },
    { gfx: '📄', name: 'README.txt',    action: () => openExtraFileTxt('readme') },
  ];

  // Pick 1–2 random extras that vary per reload
  const pool = [...LEFT_ICON_POOL];
  const n = 1 + Math.floor(Math.random() * 2);
  const extras = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    extras.push(pool.splice(idx, 1)[0]);
  }

  [...fixed, ...extras].forEach(icon => {
    const div = document.createElement('div');
    div.className = 'd-icon';
    div.title = `${icon.name} — double-click to open`;
    div.addEventListener('dblclick', icon.action);
    div.innerHTML = `<div class="d-icon-gfx">${icon.gfx}</div><div class="d-icon-name">${icon.name}</div>`;
    container.appendChild(div);
  });

  // Re-attach mousedown stop-propagation for newly added icons
  container.querySelectorAll('.d-icon').forEach(icon => {
    icon.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();
      if (!e.shiftKey) document.querySelectorAll('.d-icon.selected').forEach(el => el.classList.remove('selected'));
      icon.classList.add('selected');
    });
  });
}

// ── System info panel ────────────────────────────
function startSysInfo() {
  const netEl  = document.getElementById('kp-net-speed');
  const cpuEl  = document.getElementById('kp-cpu');
  const ramEl  = document.getElementById('kp-ram');
  const diskEl = document.getElementById('kp-disk');

  let baseCpu  = 6  + Math.random() * 14;
  let baseRam  = 1.3 + Math.random() * 0.7;
  let baseDisk = 38 + Math.floor(Math.random() * 20);

  function fmtSpeed(kb) {
    if (kb >= 1024) return (kb / 1024).toFixed(1) + 'M';
    if (kb >= 1)    return kb.toFixed(0) + 'K';
    return '0B';
  }

  setInterval(() => {
    // CPU — drift with occasional spikes
    baseCpu = Math.max(1, Math.min(90, baseCpu + (Math.random() - 0.5) * 8));
    const liveProc = WINDOWS.some(w => w.panes?.some(p => p.liveProcess));
    const cpu = Math.round(baseCpu + (liveProc ? 8 : 0) + (Math.random() - 0.5) * 3);

    // RAM — slowly creep up while SSH sessions are open
    const anySSH = WINDOWS.some(w => w.panes?.some(p => p.sshConnected));
    baseRam = Math.max(0.9, Math.min(7.2, baseRam + (anySSH ? 0.03 : -0.01) + (Math.random() - 0.5) * 0.06));

    // Network — spikes when live processes run
    const downKb = liveProc ? Math.random() * 600 + 40 : Math.random() > 0.75 ? Math.random() * 80 : 0;
    const upKb   = liveProc ? Math.random() * 80  + 5  : Math.random() > 0.85 ? Math.random() * 15 : 0;

    if (cpuEl)  cpuEl.textContent  = `CPU ${Math.min(99, cpu)}%`;
    if (ramEl)  ramEl.textContent  = `${baseRam.toFixed(1)}G`;
    if (diskEl) diskEl.textContent = `DSK ${baseDisk}%`;
    if (netEl)  netEl.textContent  = `↓${fmtSpeed(downKb)} ↑${fmtSpeed(upKb)}`;
  }, 2000);
}

// ── Init ─────────────────────────────────────────
function init() {
  if (window.innerWidth < 600) return;
  startClock();
  initDesktopSelection();
  initFloatingWindows();
  initDesktopIcons();
  startSysInfo();

  const restored = restoreState();
  if (!restored) {
    setRandomWallpaper();
    scenario     = pickScenario();
    sessionCreds = generateCreds();
    openTerminalWindow();
  }
}

window.addEventListener('DOMContentLoaded', init);
