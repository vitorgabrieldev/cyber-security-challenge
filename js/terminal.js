// Terminal engine — factory function, one instance per pane
function createTerminal(outputEl, getPrompt) {
  let inputLine = null;
  let inputPreLine = null;

  const defaultFn = () => '<span class="fp-user">root</span><span class="fp-at">@</span><span class="fp-host">forensics-lab</span><span class="fp-colon">:</span><span class="fp-path">~</span><span class="fp-hash"># </span>';
  const promptFn = typeof getPrompt === 'function' ? getPrompt : defaultFn;

  outputEl.addEventListener('click', () => {
    const inp = outputEl.querySelector('.terminal-inline-input');
    if (inp) inp.focus();
  });

  function scrollToBottom() {
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function appendLine(html, delay = 0) {
    return new Promise(res => {
      setTimeout(() => {
        const wasNearBottom = outputEl.scrollHeight - outputEl.scrollTop - outputEl.clientHeight < 80;
        const div = document.createElement('div');
        div.className = 't-line';
        div.innerHTML = html === '' ? '&nbsp;' : html;
        outputEl.appendChild(div);
        if (wasNearBottom) scrollToBottom();
        res();
      }, delay);
    });
  }

  async function printLines(lines, baseDelay = 0, step = 22) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] !== null && lines[i] !== undefined) {
        await appendLine(lines[i], baseDelay + i * step);
      }
    }
  }

  // promptFn can return a string OR { pre: '...', prompt: '...' } for two-line Kali prompt
  function _parts() {
    const r = promptFn();
    if (r && typeof r === 'object') return { pre: r.pre || null, prompt: r.prompt || '' };
    return { pre: null, prompt: r };
  }

  function createInputLine(keydownHandler) {
    if (inputLine)    { inputLine.remove();    inputLine = null; }
    if (inputPreLine) { inputPreLine.remove(); inputPreLine = null; }

    const { pre, prompt } = _parts();

    if (pre) {
      const p = document.createElement('div');
      p.className = 't-line t-prompt-pre';
      p.innerHTML = pre;
      outputEl.appendChild(p);
      inputPreLine = p;
    }

    const div = document.createElement('div');
    div.className = 't-line t-input-line';

    const span = document.createElement('span');
    span.className = 'inline-prompt';
    span.innerHTML = prompt;

    const input = document.createElement('input');
    input.className = 'terminal-inline-input';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    if (keydownHandler) input.addEventListener('keydown', keydownHandler);

    div.appendChild(span);
    div.appendChild(input);
    outputEl.appendChild(div);
    inputLine = div;
    scrollToBottom();
    input.focus();
    return input;
  }

  function freezeInputLine(value) {
    const val = escHtml(value || '');
    const { pre, prompt } = _parts();

    // Freeze the pre-line in place (remove t-prompt-pre so it doesn't get removed next call)
    if (inputPreLine) { inputPreLine.className = 't-line'; inputPreLine = null; }

    if (!inputLine) {
      if (pre) {
        const p = document.createElement('div');
        p.className = 't-line'; p.innerHTML = pre;
        outputEl.appendChild(p);
      }
      const div = document.createElement('div');
      div.className = 't-line';
      div.innerHTML = `${prompt}<span class="cmd-echo">${val}</span>`;
      outputEl.appendChild(div);
      scrollToBottom();
      return;
    }

    inputLine.className = 't-line';
    inputLine.innerHTML = `${prompt}<span class="cmd-echo">${val}</span>`;
    inputLine = null;
  }

  function createLiveContainer() {
    const div = document.createElement('div');
    div.className = 'live-container';
    outputEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function renderLive(container, lines) {
    container.innerHTML = '';
    lines.forEach(html => {
      const d = document.createElement('div');
      d.className = 't-line';
      d.innerHTML = html === '' ? '&nbsp;' : html;
      container.appendChild(d);
    });
  }

  function clear() { outputEl.innerHTML = ''; inputLine = null; inputPreLine = null; }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { appendLine, printLines, createInputLine, freezeInputLine, createLiveContainer, renderLive, clear, scrollToBottom };
}
