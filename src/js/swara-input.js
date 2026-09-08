// ── Shared swara-token input behaviour ──────────────────────────────────────
// Used by both the grid's swara cells (rows.js) and the raga & tala
// Arohanam/Avarohanam fields (scale-row.js) so they behave identically.

// Given a collapsed caret (startContainer/startOffset) and the .stok token it
// resolves into (if any), report whether the caret sits at that token's own
// start/end boundary — needed so Backspace/Delete/ArrowLeft/ArrowRight can
// treat each token as a single atomic unit instead of stepping character-by-character.
function stokBoundary(startContainer, startOffset, spanInside) {
  const atStart = startOffset === 0;
  const atEnd = startContainer === spanInside
    ? startOffset >= spanInside.childNodes.length
    : startOffset === startContainer.textContent.length;
  return { atStart, atEnd };
}

function attachTokenClickHandler(el, allowSpeedPopup) {
  el.addEventListener('click', e => {
    const token = (e.target.closest ? e.target : e.target.parentElement)?.closest('.stok');
    if (!token || token.classList.contains('stok-pending') || token.classList.contains('stok-arrow') || token.classList.contains('stok-space')) return;
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

// Atomic backspace/delete, atomic arrow-key navigation across tokens,
// letter/digit/symbol/slide-arrow insertion, and paste filtering.
function attachSwaraInput(el) {
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
    if (e.key === 'Enter') { e.preventDefault(); return; }
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

        let target = null;
        if (spanInside) {
          const { atStart, atEnd } = stokBoundary(startContainer, startOffset, spanInside);
          if (!atStart && !atEnd) {
            target = spanInside;                     // caret strictly inside the token's own text
          } else if (atStart && e.key === 'Delete') {
            target = spanInside;                      // deleting forward removes this token
          } else if (atEnd && e.key === 'Backspace') {
            target = spanInside;                      // backspacing removes this token
          } else if (atStart && e.key === 'Backspace') {
            target = spanInside.previousSibling;       // boundary: remove the token to the left
          } else if (atEnd && e.key === 'Delete') {
            target = spanInside.nextSibling;           // boundary: remove the token to the right
          }
        } else if (e.key === 'Backspace') {
          target = startContainer.nodeType === 3 && startOffset === 0
            ? startContainer.previousSibling
            : startContainer === el ? el.childNodes[startOffset - 1] : null;
        } else {
          target = startContainer.nodeType === 3 && startOffset === startContainer.textContent.length
            ? startContainer.nextSibling
            : startContainer === el ? el.childNodes[startOffset] : null;
        }
        if (target?.classList?.contains('stok')) { e.preventDefault(); target.remove(); fitCell(el); return; }
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const sel = window.getSelection();
      if (sel?.rangeCount && sel.isCollapsed) {
        const { startContainer, startOffset } = sel.getRangeAt(0);
        const spanInside = (startContainer.nodeType === 3
          ? startContainer.parentElement
          : startContainer)?.closest?.('.stok');

        let jumpTo = null, before = true;
        if (e.key === 'ArrowLeft') {
          if (spanInside) {
            const { atStart } = stokBoundary(startContainer, startOffset, spanInside);
            jumpTo = atStart ? spanInside.previousSibling : spanInside;
          } else if (startContainer === el) {
            jumpTo = el.childNodes[startOffset - 1];
          }
        } else {
          before = false;
          if (spanInside) {
            const { atEnd } = stokBoundary(startContainer, startOffset, spanInside);
            jumpTo = atEnd ? spanInside.nextSibling : spanInside;
          } else if (startContainer === el) {
            jumpTo = el.childNodes[startOffset];
          }
        }
        if (jumpTo?.classList?.contains('stok')) {
          e.preventDefault();
          const r = document.createRange();
          if (before) r.setStartBefore(jumpTo); else r.setStartAfter(jumpTo);
          r.collapse(true);
          sel.removeAllRanges(); sel.addRange(r);
          return;
        }
      }
    }
    if (e.key.length > 1) return;
    e.preventDefault();
    let inserted = null;   // the token just added (if any), so it can be undone
    let openPopupFor = null;
    if (SWARA_LETTERS.has(e.key.toUpperCase())) {
      const letter  = e.key.toUpperCase();
      const def     = scaleDefaults[letter];
      const isUpper = e.key === e.key.toUpperCase();
      if (!isUpper) {
        inserted = insertSwaraToken(letter, 0, false, el);
      } else if (!e.shiftKey && def !== null && def !== undefined) {
        inserted = insertSwaraToken(buildSwaraText(letter, '', def), 0, false, el);
      } else {
        inserted = insertSwaraToken(letter, 0, true, el);
        openPopupFor = letter;
      }
    } else if (NOTE_SYMBOLS.has(e.key)) {
      if (e.key === ',' || e.key === ';') {
        inserted = insertSwaraToken(e.key, 0, false, el);
      } else if (e.key === ' ') {
        // a lone space collapses to zero visual width inside its own span
        // (unlike a letter's glyph); .stok-space keeps it from collapsing
        inserted = insertSwaraToken(e.key, 0, false, el, 'stok-space');
      } else {
        document.execCommand('insertText', false, e.key);
      }
    } else if (e.key === '/' || e.key === '\\') {
      inserted = insertSwaraToken(e.key === '/' ? SLIDE_UP : SLIDE_DOWN, 0, false, el, 'stok-arrow');
    } else if (DIGIT_KEYS.has(e.key)) {
      tryInsertDigit(e.key, el);
    }
    // insertSwaraToken mutates the DOM directly (no 'input' event fires), so the
    // input listener that runs fitCell never triggers on swara typing — re-fit
    // here. If the new token can't fit even at the font floor, reject it (undo)
    // and warn, so the beat never overflows its box.
    if (inserted && fitCell(el)) {
      inserted.remove();
      const r = document.createRange();
      r.selectNodeContents(el); r.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      fitCell(el);
      showToast('Too many swaras for one beat — split them across beats', el);
      return;
    }
    if (openPopupFor) { pendingTokenEl = inserted; showSwaraPopup(openPopupFor, el); }
    else fitCell(el);
  });
  // Paste is disallowed in swara boxes: pasted text lands as raw characters
  // rather than proper .stok tokens, which breaks editing/nav. Swaras must be
  // typed one at a time.
  el.addEventListener('paste', e => {
    e.preventDefault();
    showToast('Paste is not supported here — type swaras one at a time', el);
  });
  // drag-and-drop injects raw text too — block it for the same reason
  el.addEventListener('drop', e => e.preventDefault());
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
  el.addEventListener('keydown', handleNav);
  attachSwaraInput(el);
}
