// ── Data collection & project save/restore ────────────────────────────────

function collectProjectData() {
  const rows = [];
  document.querySelectorAll('#grid .grid-row').forEach(row => {
    if (row.classList.contains('heading-row')) {
      rows.push({ type: 'heading', text: row.querySelector('.heading-text')?.textContent || '' });
    } else if (row.classList.contains('note-row')) {
      rows.push({ type: 'note', text: row.querySelector('.note-text')?.textContent || '' });
    } else if (row.classList.contains('scale-row')) {
      const inputs = [...row.querySelectorAll('.raga-field-input')];
      rows.push({
        type:          'scale',
        raga:          inputs[0]?.textContent || '',
        arohanam:      inputs[1]?.textContent || '',
        beatsRaw:      row.querySelector('.scale-beats-input')?.value || '',
        tala:          inputs[2]?.textContent || '',
        avarohanam:    inputs[3]?.textContent || '',
        ragaCollapsed: row.querySelector('.raga-section')?.classList.contains('collapsed') || false,
      });
    } else {
      rows.push({ type: 'notation', cells: getRowData(row) });
    }
  });
  return {
    version:        1,
    meta:           { title: document.getElementById('song-title').value, composer: document.getElementById('composer').value },
    scaleDefaults:  { ...scaleDefaults },
    scalePresence:  { ...scalePresence },
    scaleDirection: { ...scaleDirection },
    rows,
  };
}

function restoreProject(data) {
  const m = data.meta || {};
  if (m.title)    document.getElementById('song-title').value = m.title;
  if (m.composer) document.getElementById('composer').value   = m.composer;

  if (data.scaleDefaults)  Object.assign(scaleDefaults,  data.scaleDefaults);
  if (data.scalePresence)  Object.assign(scalePresence,  data.scalePresence);
  if (data.scaleDirection) Object.assign(scaleDirection, data.scaleDirection);

  if (!beats) { beats = 4; groups = [4]; segments = [[4]]; }

  showGrid();
  document.getElementById('grid').innerHTML = '';
  rowCount = 0;

  const grid = document.getElementById('grid');
  (data.rows || []).forEach(rowData => {
    if (rowData.type === 'notation') {
      const row = buildRow(); grid.appendChild(row);
      setRowData(row, rowData.cells);
    } else if (rowData.type === 'heading') {
      const h = makeHeadingRow(); grid.appendChild(h);
      const ht = h.querySelector('.heading-text');
      if (ht) ht.textContent = rowData.text || '';
    } else if (rowData.type === 'note') {
      const n = makeNoteRow(); grid.appendChild(n);
      const nt = n.querySelector('.note-text');
      if (nt) nt.textContent = rowData.text || '';
    } else if (rowData.type === 'scale') {
      const sr = makeScaleRow(); grid.appendChild(sr);
      const inputs = [...sr.querySelectorAll('.raga-field-input')];
      if (inputs[0]) inputs[0].textContent = rowData.raga      || '';
      if (inputs[1]) inputs[1].textContent = rowData.arohanam  || '';
      const bi = sr.querySelector('.scale-beats-input');
      if (bi) bi.value = rowData.beatsRaw || '';
      if (rowData.beatsRaw) {
        const parsed = parseBeatsInput(rowData.beatsRaw);
        if (parsed) { beats = parsed.beats; groups = parsed.groups; segments = parsed.segments; }
      }
      if (inputs[2]) inputs[2].textContent = rowData.tala       || '';
      if (inputs[3]) inputs[3].textContent = rowData.avarohanam || '';
      if (rowData.ragaCollapsed) {
        const rs = sr.querySelector('.raga-section');
        const rt = sr.querySelector('.raga-toggle');
        if (rs) rs.classList.add('collapsed');
        if (rt) rt.textContent = 'carnatic ▴';
      }
    }
  });

  renumber();
}

function downloadPDF() {
  const now  = new Date();
  const date = now.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  document.documentElement.style.setProperty('--print-date', `'${date}, ${time}'`);
  window.print();
}

function exportProject() {
  const data       = collectProjectData();
  const dataScript = 'window.__CARNOTIC_DATA__ = ' + JSON.stringify(data) + ';';
  const title      = (data.meta.title || 'carnotic-notation').replace(/[^a-z0-9஀-௿]/gi, '_');

  let html;
  if (_bundledCSS && _bundledJS) {
    html = buildSelfContainedHTML(dataScript, _bundledCSS, _bundledJS);
  } else {
    // Fallback: clone live document (works if saved next to editor)
    html = buildFallbackHTML(dataScript);
  }

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = title + '.html';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildSelfContainedHTML(dataScript, css, js) {
  const title    = document.getElementById('song-title').value || 'Carnotic';
  const bodyHTML = document.querySelector('.page').outerHTML
    .replace(/<div id="grid">[\s\S]*?<\/div>/, '<div id="grid"></div>')
    .replace(/style="[^"]*display[^"]*"/, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
  <style>${css}</style>
</head>
<body>
${bodyHTML}
${document.getElementById('dir-popup').outerHTML}
${document.getElementById('swara-popup').outerHTML}
<script id="carnotic-saved-data">window.__CARNOTIC_DATA__ = ${JSON.stringify(JSON.parse(dataScript.replace('window.__CARNOTIC_DATA__ = ','')))};<\/script>
<script>${js}<\/script>
</body>
</html>`;
}

function buildFallbackHTML(dataScript) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(document.documentElement.outerHTML, 'text/html');

  doc.getElementById('grid').innerHTML            = '';
  doc.getElementById('song-title').value          = '';
  doc.getElementById('composer').value            = '';
  doc.getElementById('download-btn').style.display = 'none';
  doc.getElementById('export-btn').style.display  = 'none';
  doc.querySelectorAll('.scale-chip').forEach(c => c.classList.remove('active'));

  const prev = doc.getElementById('carnotic-saved-data');
  if (prev) prev.remove();
  const script    = doc.createElement('script');
  script.id       = 'carnotic-saved-data';
  script.textContent = dataScript;
  doc.body.insertBefore(script, doc.body.firstChild);

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

function escapeHTML(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Pre-fetch CSS + JS bundle at startup for self-contained exports
async function prefetchBundle() {
  try {
    const [cssText, ...jsParts] = await Promise.all([
      fetch('assets/css/editor.css').then(r => { if (!r.ok) throw new Error(); return r.text(); }),
      ...JS_MODULES.map(m => fetch(m).then(r => { if (!r.ok) throw new Error(); return r.text(); })),
    ]);
    _bundledCSS = cssText;
    _bundledJS  = jsParts.join('\n;\n');
  } catch (_) {
    // file:// or network error — fallback export will be used
  }
}
