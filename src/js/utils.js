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

// Shrink the font so the content stays on a single line, down to `minSize`.
// Measured with the element forced to block/nowrap so the true content width
// shows up as scrollWidth (the .stok tokens keep their natural size and overflow
// rather than getting squished). No wrapping — very long entries clip past the
// floor, which in practice needs ~20+ swaras in one beat.
// Returns true if, even at the floor size, the content still overflows one line
// (so the caller can flag the cell as an error rather than let it spill/clip).
function _measureFont(el, maxSize, minSize) {
  const floor = minSize != null ? minSize : Math.round(maxSize * 0.75);
  if (!el.textContent) { el.style.fontSize = ''; return false; }
  const prevDisplay = el.style.display;
  const prevWhite   = el.style.whiteSpace;
  el.style.display    = 'block';
  el.style.whiteSpace = 'nowrap';
  let size = maxSize;
  el.style.fontSize = size + 'px';
  while (size > floor && el.scrollWidth > el.clientWidth) {
    size--;
    el.style.fontSize = size + 'px';
  }
  const overflowed = el.scrollWidth > el.clientWidth;
  el.style.display    = prevDisplay;
  el.style.whiteSpace = prevWhite;
  el.style.fontSize = size === maxSize ? '' : size + 'px';
  return overflowed;
}

function fitCell(anyChildEl) {
  const cellDiv = anyChildEl.closest('.cell');
  if (!cellDiv) return;
  const lyricEl = cellDiv.querySelector('.cell-lyric');
  const noteEl  = cellDiv.querySelector('.cell-note');
  if (lyricEl) _measureFont(lyricEl, 15);
  if (noteEl) {
    // swaras shrink to 8px; report whether they still overflow so the caller
    // can reject the insertion that caused it.
    const overflowed = _measureFont(noteEl, 14, 8);
    noteEl.dataset.over = overflowed ? '1' : '';
    return overflowed;
  }
  return false;
}

// Lightweight transient toast, created lazily and reused. When an `anchor`
// element is given it pops up right above that element (so it appears next to
// what the user is editing, not stranded at the bottom of the page).
let _toastEl = null, _toastTimer = null;
function showToast(msg, anchor) {
  if (!_toastEl) {
    _toastEl = document.createElement('div');
    _toastEl.className = 'carnotic-toast';
    document.body.appendChild(_toastEl);
  }
  _toastEl.textContent = msg;
  if (anchor) {
    const r = anchor.getBoundingClientRect();
    const below = r.top < 48;                 // not enough room above → drop below
    _toastEl.style.left = (r.left + r.width / 2) + 'px';
    _toastEl.style.top  = (below ? r.bottom + 8 : r.top - 8) + 'px';
    _toastEl.style.bottom = 'auto';
    _toastEl.style.setProperty('--ty', below ? '0%' : '-100%');
  } else {
    _toastEl.style.left = '50%';
    _toastEl.style.top = 'auto';
    _toastEl.style.bottom = '28px';
    _toastEl.style.setProperty('--ty', '0%');
  }
  _toastEl.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => _toastEl.classList.remove('show'), 2600);
}
