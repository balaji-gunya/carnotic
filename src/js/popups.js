// ── Swara & speed popups ───────────────────────────────────────────────────

function syncPopupMarkings() {
  pendingSpeed = editingTokenEl ? (parseInt(editingTokenEl.dataset.speed) || 0) : 0;
  document.querySelectorAll('.speed-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.speed) === pendingSpeed)
  );
  pendingGamaka = editingTokenEl?.dataset?.gamaka || '';
  document.querySelectorAll('.gamaka-btn[data-gamaka]').forEach(b =>
    b.classList.toggle('active', b.dataset.gamaka === pendingGamaka)
  );
}

function showSwaraPopup(letter, anchorEl) {
  activePopupCell = anchorEl;
  pendingSwara    = letter;
  popupFocusIdx   = 0;
  popupOptions    = [];

  const digits    = SWARA_DIGITS[letter] || [];
  const rowDigits = ['', ...digits];
  const popup     = document.getElementById('swara-popup');
  const grid      = document.getElementById('swara-popup-grid');

  document.getElementById('swara-popup-title').textContent = letter + ' variants';
  grid.style.display = '';
  grid.innerHTML = '';

  OCTAVE_DEFS.forEach(({ label }) => {
    const h = document.createElement('div');
    h.className = 'swara-col-hdr';
    h.textContent = label;
    grid.appendChild(h);
  });

  rowDigits.forEach(digit => {
    OCTAVE_DEFS.forEach(({ dot }) => {
      const text = buildSwaraText(letter, dot, digit);
      const btn  = document.createElement('button');
      btn.className = 'swara-opt';
      btn.textContent = text;
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.addEventListener('click', () => selectSwaraOption(text));
      grid.appendChild(btn);
      popupOptions.push({ el: btn, select: () => selectSwaraOption(text) });
    });
  });

  popupFocusIdx = 1;
  updatePopupFocus();

  document.getElementById('anu-btn').style.display = '';

  const rect = (anchorEl.closest('.cell') || anchorEl).getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - 4 - 180;
  popup.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - 180)) + 'px';
  if (spaceBelow > 60) {
    popup.style.top = (rect.bottom + 4) + 'px'; popup.style.bottom = 'auto';
  } else {
    popup.style.top = 'auto'; popup.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
  }
  syncPopupMarkings();
  popup.style.display = 'block';
}

function showSpeedPopup(anchorEl) {
  const popup = document.getElementById('swara-popup');
  document.getElementById('swara-popup-title').textContent = 'Speed';
  document.getElementById('swara-popup-grid').style.display = 'none';
  document.getElementById('anu-btn').style.display = 'none';
  popupOptions = []; popupFocusIdx = 0;

  syncPopupMarkings();

  const rect = (anchorEl.closest('.cell') || anchorEl).getBoundingClientRect();
  popup.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - 180)) + 'px';
  const spaceBelow = window.innerHeight - rect.bottom - 4;
  if (spaceBelow > 60) {
    popup.style.top = (rect.bottom + 4) + 'px'; popup.style.bottom = 'auto';
  } else {
    popup.style.top = 'auto'; popup.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
  }
  popup.style.display = 'block';
}

function updatePopupFocus() {
  popupOptions.forEach((o, i) => o.el.classList.toggle('active', i === popupFocusIdx));
}

function movePopupFocus(delta) {
  popupFocusIdx = Math.max(0, Math.min(popupOptions.length - 1, popupFocusIdx + delta));
  updatePopupFocus();
}

function selectFocusedOption() {
  const opt = popupOptions[popupFocusIdx];
  if (opt) opt.select();
}

function selectSwaraOption(text) {
  const speed   = pendingSpeed;
  const gamaka  = pendingGamaka;
  const pending = pendingTokenEl;
  const editing = editingTokenEl;
  const cell    = activePopupCell || focusedInput;
  pendingTokenEl = null; editingTokenEl = null;
  closePopup(false);
  if (!cell) return;
  cell.focus();
  if (pending) {
    pending.textContent   = text;
    pending.dataset.speed = String(speed);
    if (gamaka) pending.dataset.gamaka = gamaka; else delete pending.dataset.gamaka;
    pending.classList.remove('stok-pending');
    placeCaretAfterToken(pending);
  } else if (editing) {
    editing.textContent   = text;
    editing.dataset.speed = String(speed);
    if (gamaka) editing.dataset.gamaka = gamaka; else delete editing.dataset.gamaka;
    placeCaretAfterToken(editing);
  }
}

function selectAnuswaraOption() {
  const letter  = pendingSwara;
  const pending = pendingTokenEl;
  const editing = editingTokenEl;
  const cell    = activePopupCell || focusedInput;
  pendingTokenEl = null; editingTokenEl = null;
  closePopup(false);
  const char = ANUSWARA_CHARS[letter];
  const target = pending || editing;
  if (!cell || !char || !target) return;
  cell.focus();
  target.textContent = char;
  target.dataset.speed = '0';
  delete target.dataset.gamaka;
  target.classList.remove('stok-pending');
  target.classList.add('stok-anuswara');
  placeCaretAfterToken(target);
}

function placeCaretAfterToken(span) {
  const r = document.createRange();
  r.setStartAfter(span); r.collapse(true);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(r);
}

function closePopup(keepLetter) {
  document.getElementById('swara-popup').style.display = 'none';
  if (pendingTokenEl) {
    if (keepLetter) {
      pendingTokenEl.classList.remove('stok-pending');
    } else {
      pendingTokenEl.remove();
    }
  }
  pendingTokenEl = null; editingTokenEl = null; pendingSpeed = 0; pendingGamaka = '';
  activePopupCell = null; pendingSwara = null; popupFocusIdx = 0; popupOptions = [];
}

function handlePopupKeydown(e) {
  if (!activePopupCell || e.target !== activePopupCell) return false;
  const cols = OCTAVE_DEFS.length;
  switch (e.key) {
    case 'Escape':     e.preventDefault(); closePopup(true);         return true;
    case 'Enter':
    case 'Tab':        e.preventDefault(); selectFocusedOption();    return true;
    case 'ArrowRight': e.preventDefault(); movePopupFocus(1);        return true;
    case 'ArrowLeft':  e.preventDefault(); movePopupFocus(-1);       return true;
    case 'ArrowDown':  e.preventDefault(); movePopupFocus(cols);     return true;
    case 'ArrowUp':    e.preventDefault(); movePopupFocus(-cols);    return true;
    case 'Backspace':
    case 'Delete':     e.preventDefault(); closePopup(false);        return true;
  }
  closePopup(true);
  return true;
}

// ── Direction popup ────────────────────────────────────────────────────────

function showDirPopup(anchorBtn, key, dirSp) {
  const popup = document.getElementById('dir-popup');
  const rect  = anchorBtn.getBoundingClientRect();
  popup.style.left = rect.left + 'px';
  popup.style.top  = (rect.bottom + 4) + 'px';

  const cur = scaleDirection[key];
  popup.querySelectorAll('.dir-opt').forEach(b => {
    const d = b.dataset.dir;
    b.classList.toggle('active',
      (d === 'up'   && cur === 'up')   ||
      (d === 'down' && cur === 'down') ||
      (d === 'both' && cur == null));
  });

  _dirPopupKey   = key;
  _dirPopupDirSp = dirSp;
  popup.style.display = 'flex';
}
