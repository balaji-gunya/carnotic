// ── App initialisation & global event wiring ──────────────────────────────

document.addEventListener('focusin', e => {
  if (e.target.matches('.cell-lyric, .cell-note')) focusedInput = e.target;
});

// Multi-token selection: drag across swaras in a note cell, then hit speed/gamaka
document.addEventListener('mouseup', e => {
  const cell = e.target.closest?.('.cell-note');
  if (!cell) return;
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const tokens = [...cell.querySelectorAll('.stok')].filter(
    t => !t.classList.contains('stok-pending') && !t.classList.contains('stok-space') && range.intersectsNode(t)
  );
  if (tokens.length < 2) return;
  clearTokenSelection();
  selectedTokens = tokens;
  tokens.forEach(t => t.classList.add('stok-sel'));
  sel.removeAllRanges();
});

document.addEventListener('mousedown', e => {
  // Close swara popup when clicking outside it
  if (activePopupCell && !document.getElementById('swara-popup').contains(e.target)) {
    closePopup(false);
  }
  // Clear multi-token selection when clicking outside tokens/buttons
  if (!e.target.closest('.speed-btn, .gamaka-btn, .stok-sel, .stok')) {
    clearTokenSelection();
  }
});

document.addEventListener('click', () => closeAllDropdowns());

document.addEventListener('click', e => {
  const popup = document.getElementById('dir-popup');
  if (popup.style.display !== 'none' && !popup.contains(e.target)) {
    popup.style.display = 'none';
  }
});

// Direction popup option handlers
document.getElementById('dir-popup').querySelectorAll('.dir-opt').forEach(b => {
  b.addEventListener('click', e => {
    e.stopPropagation();
    const chosen = b.dataset.dir;
    scaleDirection[_dirPopupKey] = chosen === 'both' ? null : chosen;
    if (_dirPopupDirSp) {
      const d = scaleDirection[_dirPopupKey];
      _dirPopupDirSp.textContent = d === 'up' ? '↑' : d === 'down' ? '↓' : '';
    }
    document.getElementById('dir-popup').style.display = 'none';
  });
});

// Speed buttons
document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('mousedown', e => e.preventDefault());
  btn.addEventListener('click', () => {
    const val = parseInt(btn.dataset.speed);
    pendingSpeed = pendingSpeed === val ? 0 : val;
    document.querySelectorAll('.speed-btn').forEach(b =>
      b.classList.toggle('active', parseInt(b.dataset.speed) === pendingSpeed)
    );
    if (selectedTokens.length > 0) {
      selectedTokens.forEach(t => { t.dataset.speed = String(pendingSpeed); });
      clearTokenSelection();
    } else if (editingTokenEl) {
      editingTokenEl.dataset.speed = String(pendingSpeed);
    }
  });
});

// Gamaka buttons
document.querySelectorAll('.gamaka-btn[data-gamaka]').forEach(btn => {
  btn.addEventListener('mousedown', e => e.preventDefault());
  btn.addEventListener('click', () => {
    const val = btn.dataset.gamaka;
    pendingGamaka = pendingGamaka === val ? '' : val;
    document.querySelectorAll('.gamaka-btn[data-gamaka]').forEach(b =>
      b.classList.toggle('active', b.dataset.gamaka === pendingGamaka)
    );
    if (selectedTokens.length > 0) {
      selectedTokens.forEach(t => {
        if (pendingGamaka) t.dataset.gamaka = pendingGamaka;
        else delete t.dataset.gamaka;
      });
      clearTokenSelection();
    } else if (editingTokenEl) {
      if (pendingGamaka) editingTokenEl.dataset.gamaka = pendingGamaka;
      else delete editingTokenEl.dataset.gamaka;
    }
  });
});

// Pluck button (marks a swara as a pluck / lyric-syllable start)
document.getElementById('pluck-btn').addEventListener('mousedown', e => e.preventDefault());
document.getElementById('pluck-btn').addEventListener('click', () => {
  pendingPluck = !pendingPluck;
  document.getElementById('pluck-btn').classList.toggle('active', pendingPluck);
  if (selectedTokens.length > 0) {
    selectedTokens.forEach(t => t.classList.toggle('stok-pluck', pendingPluck));
    clearTokenSelection();
  } else if (editingTokenEl) {
    editingTokenEl.classList.toggle('stok-pluck', pendingPluck);
  }
});

// Submit button — finalizes whichever swara variant is currently selected/focused
document.getElementById('popup-submit-btn').addEventListener('mousedown', e => e.preventDefault());
document.getElementById('popup-submit-btn').addEventListener('click', selectFocusedOption);

// Gamakam info button — toggles the name legend
document.getElementById('gamaka-info-btn').addEventListener('mousedown', e => e.preventDefault());
document.getElementById('gamaka-info-btn').addEventListener('click', e => {
  e.stopPropagation();
  const legend = document.getElementById('gamaka-legend');
  const showing = legend.style.display !== 'none';
  legend.style.display = showing ? 'none' : 'grid';
  document.getElementById('gamaka-info-btn').classList.toggle('active', !showing);
});
document.addEventListener('mousedown', e => {
  if (!e.target.closest('.gamaka-header')) {
    document.getElementById('gamaka-legend').style.display = 'none';
    document.getElementById('gamaka-info-btn').classList.remove('active');
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────

prefetchBundle(); // async — populates _bundledCSS/_bundledJS for self-contained export

if (window.__CARNOTIC_DATA__) {
  restoreProject(window.__CARNOTIC_DATA__);
} else {
  document.getElementById('grid').appendChild(makeScaleRow());
  showGrid();
  renumber();
}
