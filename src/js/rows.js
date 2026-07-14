// ── Row builders ───────────────────────────────────────────────────────────

function makeInput(cls, placeholder, beat) {
  const el = document.createElement('div');
  el.className = cls;
  el.contentEditable = 'true';
  el.spellcheck = false;
  el.dataset.ph   = placeholder;
  el.dataset.beat = beat;
  el.addEventListener('keydown', handleNav);

  if (cls === 'cell-note') {
    attachSwaraInput(el);
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
