// ── Dropdown menus ─────────────────────────────────────────────────────────

function closeAllDropdowns() {
  document.querySelectorAll('.row-dropdown.open').forEach(d => d.classList.remove('open'));
}

function buildDropdown(items) {
  const dropdown = document.createElement('div');
  dropdown.className = 'row-dropdown';
  items.forEach(item => {
    if (!item) {
      const divider = document.createElement('div');
      divider.className = 'drop-divider';
      dropdown.appendChild(divider);
      return;
    }
    const el = document.createElement('div');
    el.className = 'drop-item' + (item.cls ? ' ' + item.cls : '');
    const icon = document.createElement('span');
    icon.className = 'drop-icon';
    icon.textContent = item.icon;
    el.appendChild(icon);
    el.appendChild(document.createTextNode(item.label));
    el.addEventListener('click', () => { closeAllDropdowns(); item.fn(); });
    dropdown.appendChild(el);
  });
  return dropdown;
}

function makeMenuWrap(items) {
  const wrap = document.createElement('div');
  wrap.className = 'row-menu-wrap';
  const btn = document.createElement('button');
  btn.className = 'row-menu-btn';
  btn.textContent = '⋮';
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const dd = wrap.querySelector('.row-dropdown');
    const wasOpen = dd.classList.contains('open');
    closeAllDropdowns();
    if (!wasOpen) {
      const rect = btn.getBoundingClientRect();
      dd.style.right  = (window.innerWidth - rect.right) + 'px';
      dd.style.left   = 'auto';
      dd.style.bottom = 'auto';
      dd.classList.add('open');
      const ddH = dd.offsetHeight;
      if (rect.bottom + ddH + 8 > window.innerHeight) {
        dd.style.top    = 'auto';
        dd.style.bottom = (window.innerHeight - rect.top) + 'px';
      } else {
        dd.style.top = rect.top + 'px';
      }
    }
  });
  wrap.appendChild(btn);
  wrap.appendChild(buildDropdown(items));
  return wrap;
}

function insertMenuItems(row) {
  return [
    { icon: '↑', label: 'Insert avarthanam above',  cls: 'success', fn: () => insertBefore(row) },
    { icon: '↓', label: 'Insert avarthanam below',  cls: 'success', fn: () => insertAfter(row) },
    null,
    { icon: '↑', label: 'Insert heading above',     cls: '',        fn: () => insertHeadingBefore(row) },
    { icon: '↓', label: 'Insert heading below',     cls: '',        fn: () => insertHeadingAfter(row) },
    null,
    { icon: '↑', label: 'Insert raga & tala above', cls: '',        fn: () => insertScaleBefore(row) },
    { icon: '↓', label: 'Insert raga & tala below', cls: '',        fn: () => insertScaleAfter(row) },
    null,
    { icon: '↑', label: 'Insert remarks above',     cls: '',        fn: () => insertNoteBefore(row) },
    { icon: '↓', label: 'Insert remarks below',     cls: '',        fn: () => insertNoteAfter(row) },
  ];
}

function makeRowActions(row) {
  return makeMenuWrap([
    ...insertMenuItems(row),
    null,
    { icon: '⧉', label: 'Copy row',           cls: '',       fn: () => copyRow(row) },
    { icon: '✂', label: 'Cut row',            cls: '',       fn: () => cutRow(row) },
    { icon: '⎗', label: 'Paste below',        cls: '',       fn: () => pasteAfter(row) },
    null,
    { icon: '⊘', label: 'Clear row',          cls: 'danger', fn: () => clearRow(row) },
    { icon: '−', label: 'Delete avarthanam',  cls: 'danger', fn: () => deleteRow(row) },
  ]);
}
