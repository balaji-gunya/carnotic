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
  pendingPluck = editingTokenEl ? editingTokenEl.classList.contains('stok-pluck') : false;
  document.getElementById('pluck-btn').classList.toggle('active', pendingPluck);
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

  rowDigits.forEach(digit => {
    OCTAVE_DEFS.forEach(({ dot }) => {
      const text = buildSwaraText(letter, dot, digit);
      const btn  = document.createElement('button');
      const idx  = popupOptions.length;
      btn.className = 'swara-opt';
      btn.textContent = text;
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.addEventListener('click', () => { popupFocusIdx = idx; updatePopupFocus(); applySwaraVariant(text); });
      grid.appendChild(btn);
      popupOptions.push({ el: btn, select: () => selectSwaraOption(text) });
    });
  });

  popupFocusIdx = 1;
  updatePopupFocus();

  document.getElementById('pluck-btn').style.display = '';

  const rect = (anchorEl.closest('.cell') || anchorEl).getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - 4 - 260;
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

// A freshly-typed letter starts as an unconfirmed pendingTokenEl (dashed
// styling). The first control the user interacts with in the popup — a grid
// variant, speed, gamaka, or pluck — confirms it into a normal editingTokenEl
// so later clicks in the same popup session keep editing the same token.
function commitPendingToken() {
  if (pendingTokenEl) {
    pendingTokenEl.classList.remove('stok-pending');
    editingTokenEl = pendingTokenEl;
    pendingTokenEl = null;
  }
  return editingTokenEl;
}

// Applies live and keeps the popup open, so further marks can still be layered on.
function applySwaraVariant(text) {
  const token = commitPendingToken();
  if (!token) return;
  token.textContent   = text;
  token.dataset.speed = String(pendingSpeed);
  if (pendingGamaka) token.dataset.gamaka = pendingGamaka; else delete token.dataset.gamaka;
  token.classList.toggle('stok-pluck', pendingPluck);
  if (activePopupCell) activePopupCell.focus();
  placeCaretAfterToken(token);
}

// Applies and closes the popup — used by the Enter/Tab keyboard shortcut.
function selectSwaraOption(text) {
  applySwaraVariant(text);
  closePopup(false);
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
  pendingTokenEl = null; editingTokenEl = null; pendingSpeed = 0; pendingGamaka = ''; pendingPluck = false;
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
