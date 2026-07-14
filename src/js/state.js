// ── Mutable app state ──────────────────────────────────────────────────────
let beats = 0;
let groups = [];
let segments = [];
let rowCount = 0;
let focusedInput = null;
let clipboard = null;

// Popup state
let activePopupCell = null;
let pendingSwara    = null;
let popupFocusIdx   = 0;
let popupOptions    = [];
let pendingTokenEl  = null;
let editingTokenEl  = null;
let pendingSpeed    = 0;
let pendingGamaka   = '';

// Multi-token selection state
let selectedTokens  = [];

// Direction popup state
let _dirPopupKey    = null;
let _dirPopupDirSp  = null;

// Font measurement ruler
let _ruler = null;

// Pre-fetched bundle for self-contained export
let _bundledCSS = null;
let _bundledJS  = null;

// Scale state
const scaleDefaults  = { R: null, G: null, M: null, D: null, N: null };
const scalePresence  = { S: true, P: true };
const scaleDirection = {};

// ── Constants ──────────────────────────────────────────────────────────────
const DIGIT_KEYS    = new Set(['0','1','2','3']);
const SWARA_LETTERS = new Set(['S','R','G','M','P','D','N']);
const NOTE_SYMBOLS  = new Set([',',';','-',' ']);
const SUB_UNICODE   = { '₀':'0', '₁':'1', '₂':'2', '₃':'3' };
const SUB_DIGITS    = { '0':'₀', '1':'₁', '2':'₂', '3':'₃' };

// Private-Use-Area glyphs from the embedded CarnoticArrows font (see editor.css) —
// compact slide marks, smaller than a swara letter, distinct from the system-font ↗/↘.
const SLIDE_UP   = '';
const SLIDE_DOWN = '';

// Anuswara glyphs (small, lowered swara letters, no octave) from the same embedded font — 's' 'r' 'g' 'm' 'p' 'd' 'n' shrunk from Times New Roman outlines.
const ANUSWARA_CHARS = {
  S: '\ue010', R: '\ue011', G: '\ue012', M: '\ue013',
  P: '\ue014', D: '\ue015', N: '\ue016',
};

const SWARA_DIGITS = {
  S: [],         R: ['1','2','3'], G: ['0','1','2'],
  M: ['1','2'],  P: [],           D: ['1','2','3'], N: ['0','1','2'],
};

const OCTAVE_DEFS = [
  { label: 'Mand ↓', dot: '̣' },
  { label: 'Middle', dot: '' },
  { label: 'Taar ↑', dot: '̇' },
];

const ENHARMONIC_CONFLICTS = {
  'R-2': [['G','0']],
  'R-3': [['G','0'], ['G','1']],
  'G-0': [['R','2'], ['R','3']],
  'G-1': [['R','3']],
  'D-2': [['N','0']],
  'D-3': [['N','0'], ['N','1']],
  'N-0': [['D','2'], ['D','3']],
  'N-1': [['D','3']],
};

const SCALE_COLS = [
  [['S', null, 'S' ],  null,            false, 'center'       ],
  [['R', '1',  'R₁'],  null,            true,  'flex-start'   ],
  [['R', '2',  'R₂'],  ['G','0','G₀'], false, 'space-between'],
  [['R', '3',  'R₃'],  ['G','1','G₁'], false, 'space-between'],
  [null,               ['G','2','G₂'],  false, 'flex-end'     ],
  [['M', '1',  'M₁'],  null,            true,  'center'       ],
  [['M', '2',  'M₂'],  null,            false, 'center'       ],
  [['P', null, 'P' ],  null,            false, 'center'       ],
  [['D', '1',  'D₁'],  null,            true,  'flex-start'   ],
  [['D', '2',  'D₂'],  ['N','0','N₀'], false, 'space-between'],
  [['D', '3',  'D₃'],  ['N','1','N₁'], false, 'space-between'],
  [null,               ['N','2','N₂'],  false, 'flex-end'     ],
];

// Ordered list of JS modules — used by export to produce self-contained HTML
const JS_MODULES = [
  'src/js/state.js',
  'src/js/utils.js',
  'src/js/popups.js',
  'src/js/menu.js',
  'src/js/rows.js',
  'src/js/nav.js',
  'src/js/operations.js',
  'src/js/export.js',
  'src/js/main.js',
];
