// ── Keyboard navigation & swara insertion ─────────────────────────────────

function caretAtStart(el) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return true;
  const range = sel.getRangeAt(0);
  return (range.startOffset === 0 && range.startContainer === el) || el.textContent.length === 0;
}

function caretAtEnd(el) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return true;
  const range = sel.getRangeAt(0);
  const len = el.textContent.length;
  return range.endOffset === len || len === 0;
}

function lastBeatOfRow(rowNum) {
  let max = 0;
  document.querySelectorAll(`.cell-lyric[data-row="${rowNum}"]`).forEach(c => {
    const b = parseInt(c.dataset.beat); if (b > max) max = b;
  });
  return max;
}

function focusCellInput(row, beat, isNote) {
  if (row < 1 || row > rowCount || beat < 1) return false;
  const cls = isNote ? '.cell-note' : '.cell-lyric';
  const el = document.querySelector(`${cls}[data-row="${row}"][data-beat="${beat}"]`);
  if (el) { el.focus(); return true; }
  return false;
}

function handleNav(e) {
  if (handlePopupKeydown(e)) return;

  const row    = parseInt(e.target.dataset.row);
  const beat   = parseInt(e.target.dataset.beat);
  const isNote = e.target.classList.contains('cell-note');

  if (e.key === 'ArrowRight' && caretAtEnd(e.target)) {
    e.preventDefault();
    focusCellInput(row, beat + 1, isNote) || focusCellInput(row + 1, 1, isNote);
  } else if (e.key === 'ArrowLeft' && caretAtStart(e.target)) {
    e.preventDefault();
    focusCellInput(row, beat - 1, isNote) || focusCellInput(row - 1, lastBeatOfRow(row - 1), isNote);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!isNote) focusCellInput(row, beat, true);
    else focusCellInput(row + 1, beat, false);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (isNote) focusCellInput(row, beat, false);
    else focusCellInput(row - 1, beat, true);
  } else if (e.key === 'Tab') {
    e.preventDefault();
    if (e.shiftKey) {
      focusCellInput(row, beat - 1, isNote) || focusCellInput(row - 1, lastBeatOfRow(row - 1), isNote);
    } else {
      focusCellInput(row, beat + 1, isNote) || focusCellInput(row + 1, 1, isNote);
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (!isNote) focusCellInput(row, beat, true);
    else focusCellInput(row, beat + 1, false) || focusCellInput(row + 1, 1, false);
  }
}

function insertSwaraToken(text, speed, isPending, cell) {
  const span = document.createElement('span');
  span.className = 'stok' + (isPending ? ' stok-pending' : '');
  span.dataset.speed = String(speed);
  span.textContent = text;
  const sel = window.getSelection();
  if (sel.rangeCount) {
    const range = sel.getRangeAt(0);
    const host = range.startContainer.nodeType === 3
      ? range.startContainer.parentElement
      : range.startContainer;
    const enclosing = host?.closest?.('.stok');
    if (enclosing && cell.contains(enclosing)) {
      const atStart = range.startContainer.nodeType === 3 && range.startOffset === 0;
      if (atStart) range.setStartBefore(enclosing);
      else range.setStartAfter(enclosing);
      range.collapse(true);
    }
    range.deleteContents();
    range.insertNode(span);
  } else {
    cell.appendChild(span);
  }
  const r = document.createRange();
  r.setStartAfter(span); r.collapse(true);
  sel.removeAllRanges(); sel.addRange(r);
  return span;
}

function tryInsertDigit(digit, cell) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (!cell.contains(range.startContainer)) return;

  const preRange = document.createRange();
  preRange.setStart(cell, 0);
  preRange.setEnd(range.startContainer, range.startOffset);
  const before = preRange.toString();
  if (!before) return;

  let i = before.length - 1;
  if (SUB_UNICODE[before[i]]) return;

  const COMBINING = new Set(['̇', '̣']);
  while (i >= 0 && COMBINING.has(before[i])) i--;
  if (i < 0) return;

  const swara = before[i];
  if (!SWARA_LETTERS.has(swara)) return;

  const validDigits = SWARA_DIGITS[swara] || [];
  if (!validDigits.includes(digit)) return;

  document.execCommand('insertText', false, SUB_DIGITS[digit]);
}

function insertNote(note) {
  if (!focusedInput) return;
  focusedInput.focus();
  if (focusedInput.classList.contains('cell-note')) {
    document.execCommand('insertHTML', false, noteToHTML(note));
  } else {
    document.execCommand('insertText', false, note);
  }
}
