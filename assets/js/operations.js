// ── Grid & row operations ──────────────────────────────────────────────────

function showGrid() {
  document.getElementById('download-btn').style.display = 'flex';
  document.getElementById('export-btn').style.display   = 'flex';
}

function lazyInit() {
  if (beats > 0) return;
  beats = 4; groups = [4]; segments = [[4]];
}

function restart() {
  if (beats > 0 && !confirm('This will clear all notation. Continue?')) return;
  beats = 0; groups = []; segments = []; rowCount = 0; focusedInput = null; clipboard = null;

  document.getElementById('grid').innerHTML = '';

  document.getElementById('grid').appendChild(makeScaleRow());
  renumber();
}

function getBeatsForPosition(refRow) {
  let el = refRow;
  while (el) {
    if (el.classList && el.classList.contains('scale-row')) {
      const inp = el.querySelector('.scale-beats-input');
      if (inp && inp.value.trim()) {
        const parsed = parseBeatsInput(inp.value.trim());
        if (parsed) return parsed;
      }
    }
    el = el.previousElementSibling;
  }
  return { beats, groups, segments };
}

function normalizeRowWidths() {
  let maxPerLine = 0;
  document.querySelectorAll('.grid-row:not(.heading-row):not(.scale-row) .cells').forEach(cellsDiv => {
    let lineCount = 0;
    for (const child of cellsDiv.children) {
      if (child.classList.contains('cell')) { lineCount++; }
      else { maxPerLine = Math.max(maxPerLine, lineCount); lineCount = 0; }
    }
    maxPerLine = Math.max(maxPerLine, lineCount);
  });
  if (maxPerLine === 0) return;
  const pct = (100 / maxPerLine).toFixed(4) + '%';
  document.querySelectorAll('.grid-row:not(.heading-row):not(.scale-row) .cells .cell').forEach(cell => {
    cell.style.flex     = `0 0 ${pct}`;
    cell.style.maxWidth = pct;
  });
}

function renumber() {
  let num = 0;
  document.querySelectorAll('.grid-row').forEach(row => {
    if (row.classList.contains('heading-row') || row.classList.contains('scale-row') || row.classList.contains('note-row')) return;
    num++;
    row.querySelector('.row-label').textContent = num;
    row.querySelectorAll('.cell-lyric, .cell-note').forEach(el => el.dataset.row = num);
  });
  rowCount = num;
  normalizeRowWidths();
}

// ── Notation row operations ────────────────────────────────────────────────

function getRowData(row) {
  const lyrics = [...row.querySelectorAll('.cell-lyric')];
  const notes  = [...row.querySelectorAll('.cell-note')];
  return lyrics.map((l, i) => ({ lyric: l.textContent, note: notes[i]?.innerHTML ?? '' }));
}

function setRowData(row, data) {
  const lyrics = [...row.querySelectorAll('.cell-lyric')];
  const notes  = [...row.querySelectorAll('.cell-note')];
  data.forEach((cell, i) => {
    if (lyrics[i]) lyrics[i].textContent = cell.lyric;
    if (notes[i])  notes[i].innerHTML    = cell.note;
    if (lyrics[i]) fitCell(lyrics[i]);
  });
}

function clearRow(row) {
  row.querySelectorAll('.cell-lyric, .cell-note').forEach(el => {
    el.innerHTML = ''; fitCell(el);
  });
}

function addRowAtEnd() {
  lazyInit();
  const grid = document.getElementById('grid');
  const last = grid.lastElementChild;
  const cfg  = last ? getBeatsForPosition(last) : { beats, groups, segments };
  grid.appendChild(buildRow(cfg));
  renumber();
}

function insertAfter(refRow) {
  const cfg = getBeatsForPosition(refRow);
  refRow.insertAdjacentElement('afterend', buildRow(cfg));
  renumber();
}

function insertBefore(refRow) {
  refRow.insertAdjacentElement('beforebegin', buildRow());
  renumber();
}

function deleteRow(row) { row.remove(); renumber(); }

function copyRow(row)  { clipboard = getRowData(row); }
function cutRow(row)   { copyRow(row); deleteRow(row); }

function pasteAfter(refRow) {
  if (!clipboard) return;
  insertAfter(refRow);
  const newRow = refRow.nextElementSibling;
  if (newRow) setRowData(newRow, clipboard);
}

// ── Heading row operations ─────────────────────────────────────────────────

function addHeadingAtEnd() {
  lazyInit();
  const h = makeHeadingRow();
  document.getElementById('grid').appendChild(h);
  renumber();
  h.querySelector('.heading-text').focus();
}

function insertHeadingBefore(refRow) {
  const h = makeHeadingRow();
  refRow.insertAdjacentElement('beforebegin', h);
  renumber();
  h.querySelector('.heading-text').focus();
}

function insertHeadingAfter(refRow) {
  const h = makeHeadingRow();
  refRow.insertAdjacentElement('afterend', h);
  renumber();
  h.querySelector('.heading-text').focus();
}

// ── Scale row operations ───────────────────────────────────────────────────

function addScaleAtEnd() {
  lazyInit();
  document.getElementById('grid').appendChild(makeScaleRow());
  renumber();
}

function insertScaleBefore(refRow) {
  refRow.insertAdjacentElement('beforebegin', makeScaleRow());
  renumber();
}

function insertScaleAfter(refRow) {
  refRow.insertAdjacentElement('afterend', makeScaleRow());
  renumber();
}

// ── Remarks row operations ─────────────────────────────────────────────────

function addNoteAtEnd() {
  lazyInit();
  const n = makeNoteRow();
  document.getElementById('grid').appendChild(n);
  renumber();
  n.querySelector('.note-text').focus();
}

function insertNoteBefore(refRow) {
  const n = makeNoteRow();
  refRow.insertAdjacentElement('beforebegin', n);
  renumber();
  n.querySelector('.note-text').focus();
}

function insertNoteAfter(refRow) {
  const n = makeNoteRow();
  refRow.insertAdjacentElement('afterend', n);
  renumber();
  n.querySelector('.note-text').focus();
}
