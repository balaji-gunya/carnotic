// ── Raga & tala scale row ────────────────────────────────────────────────────

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
  [['Raga', '', false], ['Arohanam', 'S R G M P D N Ṡ', true]].forEach(([lbl, ph, isSwaraField]) => {
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
  [['Tala', '', false], ['Avarohanam', 'Ṡ N D P M G R S', true]].forEach(([lbl, ph, isSwaraField]) => {
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
