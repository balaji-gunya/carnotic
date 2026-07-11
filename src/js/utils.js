// ── Pure utility functions ─────────────────────────────────────────────────

function parseBeatsInput(str) {
  const segs = str.trim().split('/').map(seg => {
    const parts = seg.trim().split('+').map(p => parseInt(p.trim()));
    if (parts.some(isNaN) || parts.some(p => p < 1)) return null;
    return parts;
  });
  if (segs.some(s => s === null)) return null;
  const allGroups = segs.flat();
  const total = allGroups.reduce((a, b) => a + b, 0);
  if (total < 1 || total > 64) return null;
  return { beats: total, groups: allGroups, segments: segs };
}

function getGroupStarts() {
  const starts = new Set();
  let pos = 1;
  for (const g of groups) { starts.add(pos); pos += g; }
  return starts;
}

function getWrapBeats() {
  const wraps = new Set();
  let pos = 1;
  for (let i = 0; i < segments.length - 1; i++) {
    pos += segments[i].reduce((a, b) => a + b, 0);
    wraps.add(pos);
  }
  return wraps;
}

function buildSwaraText(letter, dot, digit) {
  return digit ? (letter + dot + (SUB_DIGITS[digit] || digit)) : (letter + dot);
}

function noteToHTML(text) {
  return text.replace(/[₀₁₂₃]/g, c => '<sub>' + SUB_UNICODE[c] + '</sub>');
}

function clearTokenSelection() {
  selectedTokens.forEach(t => t.classList.remove('stok-sel'));
  selectedTokens = [];
}

// ── Font auto-shrink ───────────────────────────────────────────────────────

function _measureFont(el, maxSize) {
  const floor = Math.round(maxSize * 0.75);
  const text  = el.textContent;
  if (!text) { el.style.fontSize = ''; return; }
  if (!_ruler) {
    _ruler = document.createElement('span');
    _ruler.style.cssText = 'position:absolute;top:-9999px;left:-9999px;white-space:nowrap;visibility:hidden;pointer-events:none;';
    document.body.appendChild(_ruler);
  }
  const cs = getComputedStyle(el);
  _ruler.style.fontFamily = cs.fontFamily;
  _ruler.style.fontWeight = cs.fontWeight;
  _ruler.textContent = text;
  const available = el.clientWidth - 12;
  let size = maxSize;
  _ruler.style.fontSize = size + 'px';
  while (_ruler.scrollWidth > available && size > floor) {
    size--;
    _ruler.style.fontSize = size + 'px';
  }
  el.style.fontSize = size === maxSize ? '' : size + 'px';
}

function fitCell(anyChildEl) {
  const cellDiv = anyChildEl.closest('.cell');
  if (!cellDiv) return;
  const lyricEl = cellDiv.querySelector('.cell-lyric');
  const noteEl  = cellDiv.querySelector('.cell-note');
  if (lyricEl) _measureFont(lyricEl, 15);
  if (noteEl)  _measureFont(noteEl,  14);
}
