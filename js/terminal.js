// Terminal engine — factory function, one instance per pane
function createTerminal(outputEl) {
  let inputLine = null;

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
        const div = document.createElement('div');
        div.className = 't-line';
        div.innerHTML = html === '' ? '&nbsp;' : html;
        outputEl.appendChild(div);
        scrollToBottom();
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

  function createInputLine(keydownHandler) {
    if (inputLine) { inputLine.remove(); inputLine = null; }
    const div = document.createElement('div');
    div.className = 't-line t-input-line';
    const promptSpan = document.createElement('span');
    promptSpan.className = 'inline-prompt';
    promptSpan.innerHTML = '<span class="green">root</span><span class="dim">@forensics-lab:~#</span> ';
    const input = document.createElement('input');
    input.className = 'terminal-inline-input';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    if (keydownHandler) input.addEventListener('keydown', keydownHandler);
    div.appendChild(promptSpan);
    div.appendChild(input);
    outputEl.appendChild(div);
    inputLine = div;
    scrollToBottom();
    input.focus();
    return input;
  }

  function freezeInputLine(value) {
    const val = escHtml(value || '');
    if (!inputLine) {
      const div = document.createElement('div');
      div.className = 't-line';
      div.innerHTML = `<span class="green">root</span><span class="dim">@forensics-lab:~#</span> <span class="blue">${val}</span>`;
      outputEl.appendChild(div);
      scrollToBottom();
      return;
    }
    inputLine.className = 't-line';
    inputLine.innerHTML = `<span class="green">root</span><span class="dim">@forensics-lab:~#</span> <span class="blue">${val}</span>`;
    inputLine = null;
  }

  // Creates/updates a live container div for refreshing commands (top, nethogs…)
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
      const div = document.createElement('div');
      div.className = 't-line';
      div.innerHTML = html === '' ? '&nbsp;' : html;
      container.appendChild(div);
    });
    scrollToBottom();
  }

  function clear() { outputEl.innerHTML = ''; inputLine = null; }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    appendLine, printLines, createInputLine, freezeInputLine,
    createLiveContainer, renderLive, clear, scrollToBottom,
  };
}
