// ── Micro test harness ────────────────────────────────────────────────────

let _passed = 0;
let _failed = 0;
const _output = document.getElementById('output');

function suite(name, fn) {
  const section = document.createElement('div');
  section.className = 'suite';
  const title = document.createElement('div');
  title.className = 'suite-title';
  title.textContent = name;
  section.appendChild(title);
  _output.appendChild(section);
  fn(section);
}

function assert(section, label, condition, detail) {
  const row = document.createElement('div');
  row.className = 'result ' + (condition ? 'pass' : 'fail');
  row.textContent = (condition ? '✓' : '✗') + '  ' + label;
  section.appendChild(row);
  if (!condition && detail) {
    const err = document.createElement('div');
    err.className = 'err';
    err.textContent = detail;
    section.appendChild(err);
  }
  condition ? _passed++ : _failed++;
}

function eq(a, b) {
  if (a === b) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

// ── parseBeatsInput ───────────────────────────────────────────────────────

suite('parseBeatsInput — simple', s => {
  const r = parseBeatsInput('4');
  assert(s, 'beats=4',    eq(r?.beats, 4));
  assert(s, 'groups=[4]', eq(r?.groups, [4]));
  assert(s, 'segments=[[4]]', eq(r?.segments, [[4]]));
});

suite('parseBeatsInput — anga groups', s => {
  const r = parseBeatsInput('4+2+2');
  assert(s, 'beats=8',    eq(r?.beats, 8));
  assert(s, 'groups=[4,2,2]', eq(r?.groups, [4,2,2]));
  assert(s, 'segments=[[4,2,2]]', eq(r?.segments, [[4,2,2]]));
});

suite('parseBeatsInput — multi-line segments', s => {
  const r = parseBeatsInput('4/2+2');
  assert(s, 'beats=8',         eq(r?.beats, 8));
  assert(s, 'groups=[4,2,2]',  eq(r?.groups, [4,2,2]));
  assert(s, 'segments=[[4],[2,2]]', eq(r?.segments, [[4],[2,2]]));
});

suite('parseBeatsInput — 6 beats (Rasathi Unna)', s => {
  const r = parseBeatsInput('6');
  assert(s, 'beats=6',    eq(r?.beats, 6));
  assert(s, 'groups=[6]', eq(r?.groups, [6]));
});

suite('parseBeatsInput — invalid inputs', s => {
  assert(s, 'empty string → null', parseBeatsInput('') === null);
  assert(s, 'letters → null',      parseBeatsInput('abc') === null);
  assert(s, 'zero → null',         parseBeatsInput('0') === null);
  assert(s, 'too large → null',    parseBeatsInput('65') === null);
  assert(s, 'negative → null',     parseBeatsInput('-1') === null);
  assert(s, 'whitespace only → null', parseBeatsInput('   ') === null);
});

suite('parseBeatsInput — edge: whitespace trimmed', s => {
  const r = parseBeatsInput('  3 + 3  ');
  assert(s, 'beats=6', eq(r?.beats, 6));
  assert(s, 'groups=[3,3]', eq(r?.groups, [3,3]));
});

// ── buildSwaraText ────────────────────────────────────────────────────────

suite('buildSwaraText', s => {
  assert(s, 'S (no digit)',   buildSwaraText('S', '', null)  === 'S');
  assert(s, 'R₂ (digit 2)',   buildSwaraText('R', '', '2')   === 'R₂');
  assert(s, 'G₀ (digit 0)',   buildSwaraText('G', '', '0')   === 'G₀');
  assert(s, 'Ṡ (taar dot)',   buildSwaraText('S', '̇', null) === 'Ṡ');
  assert(s, 'Ṡ middle dot subscript', buildSwaraText('R', '̇', '1') === 'Ṙ₁');
});

// ── noteToHTML ────────────────────────────────────────────────────────────

suite('noteToHTML', s => {
  assert(s, 'plain text unchanged', noteToHTML('SGR') === 'SGR');
  assert(s, '₂ → <sub>2</sub>',    noteToHTML('R₂') === 'R<sub>2</sub>');
  assert(s, '₀ → <sub>0</sub>',    noteToHTML('G₀') === 'G<sub>0</sub>');
  assert(s, 'multiple subs',        noteToHTML('R₂G₀') === 'R<sub>2</sub>G<sub>0</sub>');
  assert(s, 'empty string',         noteToHTML('') === '');
});

// ── DOM: buildRow ─────────────────────────────────────────────────────────

suite('buildRow — structure', s => {
  beats = 4; groups = [4]; segments = [[4]];
  const row = buildRow();
  assert(s, 'has .grid-row', row.classList.contains('grid-row'));
  assert(s, 'has .cells child', !!row.querySelector('.cells'));
  assert(s, 'has .row-label', !!row.querySelector('.row-label'));
  const cells = row.querySelectorAll('.cell');
  assert(s, '4 cells for 4 beats', cells.length === 4);
  const lyrics = row.querySelectorAll('.cell-lyric');
  const notes  = row.querySelectorAll('.cell-note');
  assert(s, '4 lyric inputs', lyrics.length === 4);
  assert(s, '4 note inputs',  notes.length === 4);
  assert(s, 'beat-1 cell has .sam', cells[0].classList.contains('sam'));
});

suite('buildRow — 6 beats', s => {
  beats = 6; groups = [6]; segments = [[6]];
  const row = buildRow();
  assert(s, '6 cells', row.querySelectorAll('.cell').length === 6);
  beats = 4; groups = [4]; segments = [[4]];
});

suite('buildRow — data-beat attributes', s => {
  beats = 4; groups = [4]; segments = [[4]];
  const row = buildRow();
  const lyrics = row.querySelectorAll('.cell-lyric');
  assert(s, 'first beat=1',  lyrics[0].dataset.beat === '1');
  assert(s, 'last beat=4',   lyrics[3].dataset.beat === '4');
});

// ── DOM: makeHeadingRow ───────────────────────────────────────────────────

suite('makeHeadingRow — structure', s => {
  const row = makeHeadingRow();
  assert(s, 'has .heading-row', row.classList.contains('heading-row'));
  const ht = row.querySelector('.heading-text');
  assert(s, 'has .heading-text', !!ht);
  assert(s, 'contenteditable', ht.contentEditable === 'true');
});

// ── DOM: makeScaleRow ─────────────────────────────────────────────────────

suite('makeScaleRow — structure', s => {
  const row = makeScaleRow();
  assert(s, 'has .scale-row', row.classList.contains('scale-row'));
  assert(s, 'has beats input', !!row.querySelector('.scale-beats-input'));
  const fields = row.querySelectorAll('.raga-field-input');
  assert(s, '4 raga fields (Raga, Arohanam, Tala, Avarohanam)', fields.length === 4);
});

// ── DOM: makeNoteRow ──────────────────────────────────────────────────────

suite('makeNoteRow — structure', s => {
  const row = makeNoteRow();
  assert(s, 'has .note-row', row.classList.contains('note-row'));
  assert(s, 'has .note-text', !!row.querySelector('.note-text'));
  assert(s, 'has Remarks: prefix', row.querySelector('.note-prefix')?.textContent === 'Remarks:');
});

// ── collectProjectData / restoreProject round-trip ────────────────────────

suite('collectProjectData — basic', s => {
  document.getElementById('song-title').value = 'Test Song';
  document.getElementById('composer').value   = 'Test Composer';

  beats = 6; groups = [6]; segments = [[6]];
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  const sr = makeScaleRow();
  sr.querySelector('.scale-beats-input').value = '6';
  grid.appendChild(sr);

  const dataRow = buildRow({ beats: 6, groups: [6], segments: [[6]] });
  grid.appendChild(dataRow);
  renumber();

  const data = collectProjectData();
  assert(s, 'version=1', data.version === 1);
  assert(s, 'title preserved', data.meta.title === 'Test Song');
  assert(s, 'composer preserved', data.meta.composer === 'Test Composer');
  assert(s, '2 rows collected', data.rows.length === 2);
  assert(s, 'first row is scale', data.rows[0].type === 'scale');
  assert(s, 'scale beatsRaw=6', data.rows[0].beatsRaw === '6');
  assert(s, 'second row is notation', data.rows[1].type === 'notation');
  assert(s, 'notation has 6 cells', data.rows[1].cells.length === 6);
});

suite('restoreProject — beat count round-trip', s => {
  const saveData = {
    version: 1,
    meta: { title: 'Round Trip', composer: 'Test' },
    scaleDefaults: { R: null, G: null, M: null, D: null, N: null },
    scalePresence: { S: true, P: true },
    scaleDirection: {},
    rows: [
      { type: 'scale', raga: '', arohanam: '', beatsRaw: '6', tala: '', avarohanam: '', ragaCollapsed: false },
      { type: 'notation', cells: Array(6).fill({ lyric: '', note: '' }) },
    ],
  };

  restoreProject(saveData);

  assert(s, 'beats restored to 6', beats === 6);
  assert(s, 'title restored', document.getElementById('song-title').value === 'Round Trip');

  const rows = document.querySelectorAll('#grid .grid-row');
  assert(s, '2 rows in grid', rows.length === 2);

  const cells = document.querySelectorAll('#grid .cell');
  assert(s, '6 cells after restore', cells.length === 6);

  // cleanup
  grid.innerHTML = '';
  beats = 4; groups = [4]; segments = [[4]];
  document.getElementById('song-title').value = '';
  document.getElementById('composer').value = '';
});

// ── getBeatsForPosition ───────────────────────────────────────────────────

suite('getBeatsForPosition — finds preceding scale row', s => {
  beats = 4; groups = [4]; segments = [[4]];
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  const sr = makeScaleRow();
  sr.querySelector('.scale-beats-input').value = '3+3';
  grid.appendChild(sr);

  const r1 = buildRow();
  grid.appendChild(r1);
  renumber();

  const cfg = getBeatsForPosition(r1);
  assert(s, 'beats=6 from preceding scale', cfg.beats === 6);
  assert(s, 'groups=[3,3]', eq(cfg.groups, [3,3]));

  grid.innerHTML = '';
  beats = 4; groups = [4]; segments = [[4]];
});

// ── renumber ──────────────────────────────────────────────────────────────

suite('renumber — labels notation rows', s => {
  beats = 4; groups = [4]; segments = [[4]];
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  grid.appendChild(makeScaleRow());
  grid.appendChild(buildRow());
  grid.appendChild(makeHeadingRow());
  grid.appendChild(buildRow());
  renumber();

  const labels = [...document.querySelectorAll('.grid-row:not(.heading-row):not(.scale-row):not(.note-row) .row-label')];
  assert(s, 'first notation row label=1', labels[0]?.textContent === '1');
  assert(s, 'second notation row label=2', labels[1]?.textContent === '2');
  assert(s, 'rowCount=2', rowCount === 2);

  grid.innerHTML = '';
});

// ── Summary ───────────────────────────────────────────────────────────────

const total = _passed + _failed;
const summaryEl = document.getElementById('summary');
summaryEl.className = 'summary ' + (_failed === 0 ? 'ok' : 'bad');
summaryEl.textContent = `${_passed}/${total} passed` + (_failed > 0 ? ` — ${_failed} FAILED` : ' — all green');
