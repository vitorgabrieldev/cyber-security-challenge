// ── Persistence (localStorage) ──────────────────────────────────
const SAVE_KEY = 'cybersec_lab_v1';
let _saveTimer = null;

function scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(persistState, 500);
}

function _termHTML(outEl) {
  const clone = outEl.cloneNode(true);
  clone.querySelectorAll('.t-input-line, .t-prompt-pre').forEach(el => el.remove());
  return clone.innerHTML;
}

function persistState() {
  try {
    const txtvEl = document.getElementById('txtv-window');
    const fmgrEl = document.getElementById('filemgr-window');

    const state = {
      v: 1,
      scenarioKey: scenario?.check || null,
      sessionCreds,
      iocs:    [...iocs],
      notes:   [...notes],
      labNotes:[...labNotes],
      cmdLog:  [...cmdLog],
      hintCount,
      timelineRevealed: [...timelineRevealed],
      timerSec,
      winOpenCount,
      winZCounter,
      focusedWinId,
      windows: WINDOWS.map(win => ({
        id: win.id,
        style: win.el.style.cssText,
        minimized: win.minimized,
        maximized: win.maximized,
        prevStyle: win.prevStyle || '',
        activePaneIdx: win.activePaneIdx,
        panes: win.panes.map(p => ({
          cwd: p.cwd,
          sshConnected: p.sshConnected,
          sshAttempts: p.sshAttempts || 0,
          cmdHistory: p.cmdHistory,
          outputHTML: _termHTML(p.outEl),
        })),
      })),
      txtv: txtvEl ? {
        visible: txtvEl.style.display === 'flex',
        style: txtvEl.style.cssText,
        maximized: txtMaximized,
        prevStyle: txtPrevStyle,
        title:   document.getElementById('txtv-title')?.textContent || '',
        fname:   document.getElementById('txtv-fname')?.textContent || '',
        content: document.getElementById('txtv-body')?.value  || '',
      } : null,
      filemgr: fmgrEl ? {
        visible: fmgrEl.style.display === 'flex',
        style: fmgrEl.style.cssText,
        maximized: fmgMaximized,
        prevStyle: fmgPrevStyle,
      } : null,
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch(e) { /* quota or other error — skip */ }
}

function clearSavedState() {
  localStorage.removeItem(SAVE_KEY);
}

function restoreState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return false;

    scenario         = (s.scenarioKey && SCENARIOS[s.scenarioKey]) || pickScenario();
    sessionCreds     = s.sessionCreds  || generateCreds();
    iocs             = s.iocs      || [];
    notes            = s.notes     || [];
    labNotes         = s.labNotes  || [];
    cmdLog           = s.cmdLog    || [];
    hintCount        = s.hintCount  || 0;
    timelineRevealed = new Set(s.timelineRevealed || ['none']);
    timerSec         = s.timerSec   || 0;
    winOpenCount     = s.winOpenCount || 0;
    winZCounter      = s.winZCounter  || 100;
    focusedWinId     = s.focusedWinId || null;

    setRandomWallpaper();

    if (s.windows?.length > 0) {
      s.windows.forEach(sw => _restoreTermWindow(sw));
      const target = (s.focusedWinId && WINDOWS.find(w => w.id === s.focusedWinId))
        ? s.focusedWinId
        : WINDOWS[WINDOWS.length - 1]?.id;
      if (target) focusWin(target);
    }

    if (s.txtv?.visible) {
      const el = document.getElementById('txtv-window');
      el.style.cssText = s.txtv.style;
      el.style.display = 'flex';
      document.getElementById('txtv-title').textContent = s.txtv.title;
      document.getElementById('txtv-fname').textContent = s.txtv.fname;
      document.getElementById('txtv-body').value  = s.txtv.content;
      txtMaximized = s.txtv.maximized || false;
      txtPrevStyle = s.txtv.prevStyle || '';
    }

    if (s.filemgr?.visible) {
      const el = document.getElementById('filemgr-window');
      el.style.cssText = s.filemgr.style;
      el.style.display = 'flex';
      fmgMaximized = s.filemgr.maximized || false;
      fmgPrevStyle = s.filemgr.prevStyle || '';
    }

    const anySSH = WINDOWS.some(w => w.panes?.some(p => p.sshConnected));
    if (anySSH && timerSec > 0 && !timerInt) startTimer();

    updateTaskbar();
    return true;
  } catch(e) {
    console.warn('[persist] restore failed:', e);
    return false;
  }
}

function _restoreTermWindow(saved) {
  const id = saved.id;
  const idNum = parseInt(id.replace('win-', ''), 10);
  if (!isNaN(idNum) && idNum >= winOpenCount) winOpenCount = idNum + 1;

  const el = document.createElement('div');
  el.className = 'term-window';
  el.id = id;
  el.style.cssText = saved.style;

  el.innerHTML = `
    <div class="tw-titlebar" id="tb-${id}">
      <span class="tw-title" id="tw-title-${id}">root@kali: ~</span>
      <div class="win-btns">
        <span class="win-btn wbtn-min" title="Minimizar">&#8722;</span>
        <span class="win-btn wbtn-max" title="Maximizar">&#9633;</span>
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
    activePaneIdx: saved.activePaneIdx || 0,
    minimized: saved.minimized || false,
    maximized: saved.maximized || false,
    prevStyle: saved.prevStyle || '',
  };
  WINDOWS.push(win);

  el.querySelector('.wbtn-close').onclick  = () => closeTermWindow(id);
  el.querySelector('.wbtn-min').onclick    = () => minimizeWindow(id);
  el.querySelector('.wbtn-max').onclick    = () => maximizeWindow(id);
  el.querySelector('.tw-pane-add').onclick = () => addPaneToWin(id);

  const tb = document.getElementById('tb-' + id);
  tb.addEventListener('pointerdown', e => {
    if (e.target.closest('.win-btns')) return;
    e.preventDefault();
    const ox = el.offsetLeft, oy = el.offsetTop;
    const sx = e.clientX, sy = e.clientY;
    const move = ev => {
      el.style.left = Math.max(0,  ox + ev.clientX - sx) + 'px';
      el.style.top  = Math.max(28, oy + ev.clientY - sy) + 'px';
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    focusWin(id);
  });
  el.addEventListener('mousedown', () => focusWin(id));

  const panes = saved.panes?.length ? saved.panes : [{}];
  panes.forEach(sp => _restorePane(win, sp));

  if (win.minimized) el.style.display = 'none';

  win.panes.forEach((p, i) => {
    p.outEl.style.display = i === win.activePaneIdx ? '' : 'none';
  });

  renderWinPaneTabs(win);
  return win;
}

function _restorePane(win, sp) {
  const paneIdx = win.panes.length;

  const outEl = document.createElement('div');
  outEl.className = 'terminal-out';
  win.bodyEl.appendChild(outEl);

  const pane = {
    idx: paneIdx, name: 'bash', outEl, win,
    cwd: sp.cwd || '/root',
    cmdHistory: sp.cmdHistory || [],
    histIdx: -1,
    liveProcess: null,
    sshConnected: sp.sshConnected || false,
    sshAttempts:  sp.sshAttempts  || 0,
    passwordMode: false, passwordBuffer: '',
    confirmPending: null,
  };

  const getPrompt = () => {
    if (pane.passwordMode) return { pre: null, prompt: '' };
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

  if (sp.outputHTML) {
    outEl.innerHTML = sp.outputHTML;
    pane.term.scrollToBottom();
  }

  if (pane.sshConnected && win.titleEl) {
    const dir = pane.cwd === '/root' ? '~' : pane.cwd;
    win.titleEl.textContent = `root@forensics-lab: ${dir}`;
  }

  pane.term.createInputLine(makeOnKey(pane));
  win.panes.push(pane);
}
