// ── Row builders ───────────────────────────────────────────────────────────

function attachTokenClickHandler(el, allowSpeedPopup) {
  el.addEventListener('click', e => {
    const token = (e.target.closest ? e.target : e.target.parentElement)?.closest('.stok');
    if (!token || token.classList.contains('stok-pending')) return;
    clearTokenSelection();
    editingTokenEl  = token;
    activePopupCell = el;
    const ch = token.textContent.trim().charAt(0);
    pendingSwara = SWARA_LETTERS.has(ch.toUpperCase()) ? ch.toUpperCase() : ch;
    if (allowSpeedPopup && !SWARA_LETTERS.has(ch.toUpperCase())) {
      showSpeedPopup(el);
    } else {
      showSwaraPopup(pendingSwara, el);
    }
    syncPopupMarkings();
  });
}

function makePlainTextField(input) {
  input.style.fontFamily = 'inherit';
  input.style.fontWeight = '400';
  input.style.color      = '#374151';
  input.addEventListener('input', () => { if (!input.textContent) input.innerHTML = ''; });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
  input.addEventListener('paste', e => {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  });
}

function initRagaField(el) {
  el.addEventListener('input', () => { if (!el.textContent) el.innerHTML = ''; });
  attachTokenClickHandler(el, false);
  el.addEventListener('keydown', e => {
    if (handlePopupKeydown(e)) return;
    if (e.key === 'Enter') { e.preventDefault(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length > 1) return;
    e.preventDefault();
    if (SWARA_LETTERS.has(e.key.toUpperCase())) {
      const letter  = e.key.toUpperCase();
      const def     = scaleDefaults[letter];
      const isUpper = e.key === e.key.toUpperCase();
      if (!isUpper) {
        document.execCommand('insertText', false, letter);
      } else if (!e.shiftKey && def !== null && def !== undefined) {
        document.execCommand('insertText', false, buildSwaraText(letter, '', def));
      } else {
        pendingTokenEl = insertSwaraToken(letter, 0, true, el);
        showSwaraPopup(letter, el);
      }
    } else if (e.key === "'" || NOTE_SYMBOLS.has(e.key)) {
      document.execCommand('insertText', false, e.key);
    } else if (DIGIT_KEYS.has(e.key)) {
      tryInsertDigit(e.key, el);
    }
  });
  el.addEventListener('paste', e => {
    e.preventDefault();
    const raw = e.clipboardData.getData('text/plain');
    let out = '';
    for (const ch of raw) {
      if (SWARA_LETTERS.has(ch.toUpperCase())) out += ch.toUpperCase();
      else if (NOTE_SYMBOLS.has(ch)) out += ch;
      else if (SUB_UNICODE[ch]) out += ch;
    }
    if (out) document.execCommand('insertText', false, out);
  });
}

function makeInput(cls, placeholder, beat) {
  const el = document.createElement('div');
  el.className = cls;
  el.contentEditable = 'true';
  el.spellcheck = false;
  el.dataset.ph   = placeholder;
  el.dataset.beat = beat;
  el.addEventListener('keydown', handleNav);

  if (cls === 'cell-note') {
    el.addEventListener('input', () => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.includes('.')) {
          const sel = window.getSelection();
          const range = sel.rangeCount ? sel.getRangeAt(0) : null;
          const wasInNode = range && range.startContainer === node;
          const offsetBefore = wasInNode ? range.startOffset : 0;
          const dotsBefore = (node.nodeValue.slice(0, offsetBefore).match(/\./g) || []).length;
          node.nodeValue = node.nodeValue.replace(/\./g, '');
          if (wasInNode) {
            const r = document.createRange();
            r.setStart(node, Math.max(0, offsetBefore - dotsBefore));
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
          }
        }
      }
    });
    attachTokenClickHandler(el, true);
    el.addEventListener('input', () => { if (!el.textContent) el.innerHTML = ''; fitCell(el); });
    el.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const sel = window.getSelection();
        if (sel?.rangeCount) {
          if (!sel.isCollapsed) {
            e.preventDefault();
            const range = sel.getRangeAt(0);
            el.querySelectorAll('.stok').forEach(s => { if (range.intersectsNode(s)) s.remove(); });
            range.deleteContents();
            fitCell(el);
            return;
          }
          const { startContainer, startOffset } = sel.getRangeAt(0);
          const spanInside = (startContainer.nodeType === 3
            ? startContainer.parentElement
            : startContainer)?.closest?.('.stok');
          if (spanInside) { e.preventDefault(); spanInside.remove(); fitCell(el); return; }
          let adjSpan = null;
          if (e.key === 'Backspace') {
            adjSpan = startContainer.nodeType === 3 && startOffset === 0
              ? startContainer.previousSibling
              : startContainer === el ? el.childNodes[startOffset - 1] : null;
          } else {
            adjSpan = startContainer.nodeType === 3 && startOffset === startContainer.textContent.length
              ? startContainer.nextSibling
              : startContainer === el ? el.childNodes[startOffset] : null;
          }
          if (adjSpan?.classList?.contains('stok')) { e.preventDefault(); adjSpan.remove(); fitCell(el); return; }
        }
      }
      if (e.key.length > 1) return;
      e.preventDefault();
      if (SWARA_LETTERS.has(e.key.toUpperCase())) {
        const letter  = e.key.toUpperCase();
        const def     = scaleDefaults[letter];
        const isUpper = e.key === e.key.toUpperCase();
        if (!isUpper) {
          pendingTokenEl = insertSwaraToken(letter, 0, false, el);
        } else if (!e.shiftKey && def !== null && def !== undefined) {
          pendingTokenEl = insertSwaraToken(buildSwaraText(letter, '', def), 0, false, el);
        } else {
          pendingTokenEl = insertSwaraToken(letter, 0, true, el);
          showSwaraPopup(letter, e.target);
        }
      } else if (NOTE_SYMBOLS.has(e.key)) {
        if (e.key === ',' || e.key === ';') {
          insertSwaraToken(e.key, 0, false, el);
        } else {
          document.execCommand('insertText', false, e.key);
        }
      } else if (DIGIT_KEYS.has(e.key)) {
        tryInsertDigit(e.key, e.target);
      }
    });
    el.addEventListener('paste', e => {
      e.preventDefault();
      const raw = e.clipboardData.getData('text/plain');
      let out = '';
      for (const ch of raw) {
        if (SWARA_LETTERS.has(ch.toUpperCase())) out += ch.toUpperCase();
        else if (NOTE_SYMBOLS.has(ch)) out += ch;
        else if (SUB_UNICODE[ch]) out += ch;
      }
      if (out) document.execCommand('insertText', false, out);
    });
  } else {
    el.addEventListener('input', () => { if (!el.textContent) el.innerHTML = ''; fitCell(el); });
    el.addEventListener('paste', e => {
      e.preventDefault();
      document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    });
  }
  return el;
}

function buildRow(cfg) {
  const b_ = cfg ? cfg.beats    : beats;
  const g_ = cfg ? cfg.groups   : groups;
  const s_ = cfg ? cfg.segments : segments;

  function localGroupStarts() {
    const starts = new Set(); let pos = 1;
    for (const g of g_) { starts.add(pos); pos += g; }
    return starts;
  }
  function localWrapBeats() {
    const wraps = new Set(); let pos = 1;
    for (let i = 0; i < s_.length - 1; i++) { pos += s_[i].reduce((a, b) => a + b, 0); wraps.add(pos); }
    return wraps;
  }

  const row = document.createElement('div');
  row.className = 'grid-row';

  const label = document.createElement('div');
  label.className = 'row-label';
  label.textContent = '–';
  row.appendChild(label);

  const cellsWrap = document.createElement('div');
  cellsWrap.className = 'cells';

  const groupStarts = localGroupStarts();
  const wrapBeats   = localWrapBeats();
  for (let b = 1; b <= b_; b++) {
    if (wrapBeats.has(b)) {
      const br = document.createElement('div');
      br.style.cssText = 'width:100%;height:0;flex-basis:100%;';
      cellsWrap.appendChild(br);
    }
    const cell = document.createElement('div');
    const cls  = ['cell'];
    if (b === 1) cls.push('sam');
    if (b > 1 && groupStarts.has(b)) cls.push('group-start');
    cell.className = cls.join(' ');

    const beatNum = document.createElement('span');
    beatNum.className = 'beat-num';
    beatNum.textContent = b;
    cell.appendChild(beatNum);

    cell.appendChild(makeInput('cell-lyric', b === 1 ? 'Lyric' : '·', b));
    cell.appendChild(makeInput('cell-note',  b === 1 ? 'Swara' : '–', b));
    cellsWrap.appendChild(cell);
  }

  row.appendChild(cellsWrap);
  row.appendChild(makeRowActions(row));
  return row;
}

function makeHeadingRow() {
  const row = document.createElement('div');
  row.className = 'grid-row heading-row';

  const label = document.createElement('div');
  label.className = 'row-label';
  label.textContent = 'H';
  row.appendChild(label);

  const text = document.createElement('div');
  text.className = 'heading-text';
  text.contentEditable = 'true';
  text.spellcheck = false;
  text.dataset.ph = 'Type heading…';
  text.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); text.blur(); } });
  row.appendChild(text);

  row.appendChild(makeMenuWrap([
    ...insertMenuItems(row),
    null,
    { icon: '−', label: 'Delete heading', cls: 'danger', fn: () => { row.remove(); renumber(); } },
  ]));
  return row;
}

function makeNoteRow() {
  const row = document.createElement('div');
  row.className = 'grid-row note-row';

  const label = document.createElement('div');
  label.className = 'row-label';
  label.textContent = 'N';
  row.appendChild(label);

  const wrap = document.createElement('div');
  wrap.className = 'note-wrap';

  const prefix = document.createElement('span');
  prefix.className = 'note-prefix';
  prefix.textContent = 'Remarks:';
  wrap.appendChild(prefix);

  const text = document.createElement('div');
  text.className = 'note-text';
  text.contentEditable = 'true';
  text.spellcheck = true;
  text.dataset.ph = 'Type remarks…';
  wrap.appendChild(text);
  row.appendChild(wrap);

  row.appendChild(makeMenuWrap([
    ...insertMenuItems(row),
    null,
    { icon: '−', label: 'Delete remarks', cls: 'danger', fn: () => { row.remove(); renumber(); } },
  ]));
  return row;
}

function makeScaleRow() {
  const row = document.createElement('div');
  row.className = 'grid-row scale-row';

  const label = document.createElement('div');
  label.className = 'row-label';
  label.textContent = '♩';
  row.appendChild(label);

  const content = document.createElement('div');
  content.className = 'scale-row-content';

  const block = document.createElement('div');
  block.className = 'scale-block';

  // Row 1: Beats + Default Swaras chips
  const sbTop = document.createElement('div');
  sbTop.className = 'sb-top';

  const beatsSec = document.createElement('div');
  beatsSec.className = 'beats-sec';
  beatsSec.style.cssText = 'display:flex;align-items:center;gap:6px;flex-shrink:0;';

  const beatsLbl = document.createElement('span');
  beatsLbl.className = 'scale-label';
  beatsLbl.textContent = 'Beats';

  const beatsWrap = document.createElement('div');
  beatsWrap.className = 'scale-beats-wrap';

  const beatsInput = document.createElement('input');
  beatsInput.type = 'text';
  beatsInput.className = 'scale-beats-input';
  beatsInput.placeholder = '4+2+2';
  beatsInput.spellcheck = false;

  const tooltip = document.createElement('span');
  tooltip.className = 'beats-tooltip';
  tooltip.textContent = '?';
  tooltip.dataset.tip = '+ anga group  ·  / new line\ne.g. 8  ·  4+2+2  ·  4/2+2';

  beatsWrap.appendChild(beatsInput);
  beatsWrap.appendChild(tooltip);
  beatsSec.appendChild(beatsLbl);
  beatsSec.appendChild(beatsWrap);
  sbTop.appendChild(beatsSec);

  const defaultLabel = document.createElement('span');
  defaultLabel.className = 'scale-label';
  defaultLabel.textContent = 'Default Swaras';
  sbTop.appendChild(defaultLabel);

  const chipsContainer = document.createElement('div');
  chipsContainer.className = 'scale-groups-mini';
  buildScaleChips(chipsContainer);
  sbTop.appendChild(chipsContainer);
  block.appendChild(sbTop);

  // Separator with carnatic toggle
  const sep = document.createElement('div');
  sep.className = 'sb-sep';
  const sepLine1 = document.createElement('div');
  sepLine1.className = 'sb-sep-line';
  sep.appendChild(sepLine1);
  const ragaToggle = document.createElement('button');
  ragaToggle.className = 'raga-toggle';
  sep.appendChild(ragaToggle);
  const sepLine2 = document.createElement('div');
  sepLine2.className = 'sb-sep-line';
  sep.appendChild(sepLine2);
  block.appendChild(sep);

  const ragaSection = document.createElement('div');
  ragaSection.className = 'raga-section';

  function syncToggle() {
    ragaToggle.textContent = ragaSection.classList.contains('collapsed') ? 'carnatic ▴' : 'carnatic ▾';
  }
  ragaToggle.addEventListener('click', e => {
    e.stopPropagation();
    ragaSection.classList.toggle('collapsed');
    syncToggle();
  });
  syncToggle();

  // Row 2: Raga (plain text) | Arohanam (swara field)
  const ragaAroRow = document.createElement('div');
  ragaAroRow.className = 'sb-row';
  [['Raga', '', false], ['Arohanam', "S R G M P D N S'", true]].forEach(([lbl, ph, isSwaraField]) => {
    const field = document.createElement('div');
    field.className = 'sb-field';
    const span = document.createElement('span');
    span.className = 'scale-label';
    span.textContent = lbl;
    const input = document.createElement('div');
    input.className = 'raga-field-input';
    input.contentEditable = 'true';
    input.spellcheck = false;
    input.dataset.ph = ph;
    field.appendChild(span);
    field.appendChild(input);
    ragaAroRow.appendChild(field);
    if (isSwaraField) { initRagaField(input); } else { makePlainTextField(input); }
  });
  ragaSection.appendChild(ragaAroRow);

  // Row 3: Tala (plain text) | Avarohanam (swara field)
  const talaAvaro = document.createElement('div');
  talaAvaro.className = 'sb-row';
  [['Tala', '', false], ['Avarohanam', "S' N D P M G R S", true]].forEach(([lbl, ph, isSwaraField]) => {
    const field = document.createElement('div');
    field.className = 'sb-field';
    const span = document.createElement('span');
    span.className = 'scale-label';
    span.textContent = lbl;
    const input = document.createElement('div');
    input.className = 'raga-field-input';
    input.contentEditable = 'true';
    input.spellcheck = false;
    input.dataset.ph = ph;
    field.appendChild(span);
    field.appendChild(input);
    talaAvaro.appendChild(field);
    if (isSwaraField) { initRagaField(input); } else { makePlainTextField(input); }
  });
  ragaSection.appendChild(talaAvaro);
  block.appendChild(ragaSection);

  content.appendChild(block);
  row.appendChild(content);

  row.appendChild(makeMenuWrap([
    ...insertMenuItems(row),
    null,
    { icon: '−', label: 'Delete raga & tala', cls: 'danger', fn: () => { row.remove(); renumber(); } },
  ]));

  return row;
}

function buildScaleChips(container) {
  const byLetter = {};

  function makeChip([letter, digit, label]) {
    const isToggle = (letter === 'S' || letter === 'P') && digit === null;
    const key = digit !== null ? `${letter}-${digit}` : letter;
    const btn = document.createElement('button');
    btn.className = 'scale-chip';

    const nameSp = document.createElement('span');
    nameSp.textContent = label;
    btn.appendChild(nameSp);

    const dirSp = document.createElement('span');
    dirSp.className = 'chip-dir';
    const d = scaleDirection[key];
    dirSp.textContent = d === 'up' ? '↑' : d === 'down' ? '↓' : '';
    btn.appendChild(dirSp);

    if (isToggle) {
      btn.classList.toggle('active', scalePresence[letter] !== false);
      btn.addEventListener('click', () => {
        scalePresence[letter] = !scalePresence[letter];
        btn.classList.toggle('active', scalePresence[letter]);
      });
    } else {
      if (!byLetter[letter]) byLetter[letter] = [];
      byLetter[letter].push(btn);
      if (scaleDefaults[letter] === digit) btn.classList.add('active');
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) {
          scaleDefaults[letter] = null;
          scaleDirection[key]   = null;
          dirSp.textContent     = '';
          btn.classList.remove('active');
        } else {
          scaleDefaults[letter] = digit;
          byLetter[letter].forEach(c => c.classList.remove('active'));
          btn.classList.add('active');
          if (digit !== null) {
            const conflicts = ENHARMONIC_CONFLICTS[`${letter}-${digit}`] || [];
            conflicts.forEach(([cl, cd]) => {
              if (scaleDefaults[cl] === cd) {
                scaleDefaults[cl] = null;
                byLetter[cl].forEach(c => c.classList.remove('active'));
              }
            });
          }
        }
      });
      btn.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        showDirPopup(btn, key, dirSp);
      });
    }
    return btn;
  }

  SCALE_COLS.forEach(([row1, row2, gap, justify]) => {
    const col = document.createElement('div');
    col.style.cssText = `display:flex;flex-direction:column;gap:3px;justify-content:${justify};` +
      (gap ? 'margin-left:8px;' : '');
    if (row1) col.appendChild(makeChip(row1));
    if (row2) col.appendChild(makeChip(row2));
    container.appendChild(col);
  });
}
