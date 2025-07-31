/*  Music Catalog & Player — COMPLETE main.js
    ---------------------------------------------------------------
    Features
      • playback (play / pause / prev / next)
      • loop-track & shuffle with upcoming preview
      • progress bar + timer (RAF-based)
      • sortable / searchable table
      • manual queue
      • resilient upload handler
      • exposes window.playerAudio  → used by visualiser
*/

/* ── tiny DOM helper ── */
const $ = id => document.getElementById(id);

/* ── core refs ── */
const audio = new Audio();
window.playerAudio = audio;                             // visualiser can attach

const bar        = $('progressBar');
const timeTxt    = $('timeDisplay');
const sideBtn    = $('sidePlayPause');
const footBtn    = $('footerPlayPause');
const shuffleBtn = $('shuffleBtn');
const loopBtn    = $('loopBtn');

/* ── runtime state ── */
let currentBtn = null;
let currentRow = null;
let shuffle    = false;
let loopTrack  = false;
let raf        = 0;

const recent      = [];          // last ≤20 src strings
const manualQueue = [];          // [{src,title,artist,cov}]
let   nextAuto    = [];          // upcoming rows

/* ╭─────────────────────────────────╮
   │           UTILITIES             │
   ╰─────────────────────────────────╯ */
const fmt = s => `${Math.floor(s/60)}:${(s%60|0).toString().padStart(2,'0')}`;

const visibleRows = () =>
  [...document.querySelectorAll('#trackTable tbody tr')]
  .filter(r => r.style.display !== 'none');

const visibleRow = (row, dir) => {
  let r = row;
  do { r = dir === 'prev' ? r.previousElementSibling : r.nextElementSibling; }
  while (r && r.style.display === 'none');
  return r;
};

const sampleShuffle = n => {
  const rows = visibleRows();
  const pool = rows.filter(r => !recent.includes(r.dataset.src));
  const list = pool.length ? pool : rows;
  const picks = [], copy = [...list];
  while (picks.length < n && copy.length) {
    picks.push(copy.splice(Math.random() * copy.length | 0, 1)[0]);
  }
  return picks;
};

/* ╭─────────────────────────────────╮
   │        PLAYBACK + QUEUE         │
   ╰─────────────────────────────────╯ */
function buildNextAuto() {
  const rows = visibleRows();
  if (!rows.length) { nextAuto = []; return; }

  if (shuffle) { nextAuto = sampleShuffle(5); return; }

  if (!currentRow) { nextAuto = rows.slice(0, 5); return; }

  const idx = rows.indexOf(currentRow);
  nextAuto = rows.slice(idx + 1).concat(rows).slice(0, 5);
}

function renderQueue() {
  const ul = $('queueList'); if (!ul) return;
  ul.innerHTML = '';

  manualQueue.forEach((t, i) => {
    const li = document.createElement('li');
    li.textContent = `★ ${t.title}`;
    li.onclick = () => { manualQueue.splice(i, 1); _playTrack(t); };
    ul.appendChild(li);
  });

  nextAuto.slice(0, 5).forEach(r => {
    const li = document.createElement('li');
    li.textContent = `→ ${r.cells[0].innerText}`;
    ul.appendChild(li);
  });
}

function _playTrack(obj) {
  const { src, title, artist, cov, btn } = obj;

  if (currentBtn && currentBtn !== btn) currentBtn.textContent = '▶';
  currentBtn = btn;

  currentRow = btn?.closest('tr') || null;
  document.querySelectorAll('tr.playing').forEach(r => r.classList.remove('playing'));
  currentRow?.classList.add('playing');

  const idx = recent.indexOf(src); if (idx !== -1) recent.splice(idx, 1);
  recent.unshift(src); recent.splice(20);

  audio.src  = src;
  audio.loop = loopTrack;
  audio.load(); audio.play();

  $('sideTitle').textContent  = title;
  $('sideArtist').textContent = artist;
  $('sideCover').innerHTML    = cov ? `<img src="${cov}" alt>` : '';

  buildNextAuto(); renderQueue();
}

/* table-row onclick wrapper */
window.playTrack = (src, title, artist, cov, btn) =>
  _playTrack({ src, title, artist, cov, btn });

/* ── transport controls ── */
window.togglePlay = () => audio.paused ? audio.play() : audio.pause();

window.prevTrack = () => {
  if (audio.currentTime > 2) { audio.currentTime = 0; return; }
  const prev = currentRow && visibleRow(currentRow, 'prev');
  prev?.querySelector('.play-btn')?.click();
};

window.nextTrack = () => {
  if (manualQueue.length) { _playTrack(manualQueue.shift()); return; }
  if (!nextAuto.length) buildNextAuto();
  nextAuto.shift()?.querySelector('.play-btn')?.click();
};

/* queue add */
window.addToQueue = (src, title, artist, cov) => {
  manualQueue.push({ src, title, artist, cov });
  renderQueue();
};

/* shuffle / loop */
window.toggleShuffle = () => {
  shuffle = !shuffle;
  shuffleBtn?.classList.toggle('active', shuffle);
  buildNextAuto(); renderQueue();
};
window.toggleLoop = () => {
  loopTrack = !loopTrack;
  loopBtn?.classList.toggle('active', loopTrack);
  audio.loop = loopTrack;
};

/* ╭─────────────────────────────────╮
   │      PROGRESS BAR + TIMER       │
   ╰─────────────────────────────────╯ */
function rafTick() {
  if (audio.duration) {
    bar.max = audio.duration;
    bar.value = audio.currentTime;
    timeTxt.textContent = `${fmt(audio.currentTime)} / -${fmt(Math.max(0, audio.duration - audio.currentTime))}`;
  }
  raf = requestAnimationFrame(rafTick);
}

audio.onplay  = () => {
  sideBtn.textContent = footBtn.textContent = '⏸';
  currentBtn && (currentBtn.textContent = '⏸');
  cancelAnimationFrame(raf); rafTick();
};
audio.onpause = () => {
  sideBtn.textContent = footBtn.textContent = '▶';
  currentBtn && (currentBtn.textContent = '▶');
  cancelAnimationFrame(raf);
};
audio.onended = () => { if (!loopTrack) window.nextTrack(); };
audio.onloadedmetadata = () => { bar.max = audio.duration || 0; bar.value = 0; };
bar.oninput  = () => { if (audio.duration) audio.currentTime = bar.value; };

/* ╭─────────────────────────────────╮
   │  SEARCH / SORT / LIBRARY SCAN   │
   ╰─────────────────────────────────╯ */
window.filterTracks = () => {
  const q = $('searchInput').value.toLowerCase();
  document.querySelectorAll('#trackTable tbody tr')
    .forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
  buildNextAuto(); renderQueue();
};

const sortState = {};
window.sortTable = (col, numeric) => {
  const tbody = document.querySelector('#trackTable tbody');
  const rows  = [...tbody.rows];
  const state = (sortState[col] = ((sortState[col] || 0) + 1) % 3);

  const cmp = (a, b) => {
    let av = a.cells[col].innerText.trim(),
        bv = b.cells[col].innerText.trim();
    if (numeric) { av = parseFloat(av.replace(':','.')) || 0; bv = parseFloat(bv.replace(':','.')) || 0; }
    else         { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    return av < bv ? (state === 1 ? -1 :  1)
         : av > bv ? (state === 1 ?  1 : -1)
         : 0;
  };

  rows.sort(state === 0 ? (a,b)=>a.dataset.index - b.dataset.index : cmp);
  rows.forEach(r => tbody.appendChild(r));
  buildNextAuto(); renderQueue();
};

window.scanLibrary = () => fetch('/scan', {method:'POST'}).then(() => location.reload());
window.showSection = () => { $('#librarySection').style.display = ''; };

/* ╭─────────────────────────────────╮
   │        UPLOAD HANDLER           │
   ╰─────────────────────────────────╯ */
(() => {
  const modal        = $('uploadModal');
  const dropZone     = $('dropZone');
  const openBtn      = $('openUpload');

  /* fallback hidden file input */
  let fallbackInput = null;
  function ensureFallbackInput() {
    if (fallbackInput) return fallbackInput;
    fallbackInput = document.createElement('input');
    fallbackInput.type = 'file';
    fallbackInput.multiple = true;
    fallbackInput.style.display = 'none';
    document.body.appendChild(fallbackInput);
    fallbackInput.onchange = e => {
      const list = e.target.files;
      if (!list.length) return;
      const fd = new FormData();
      [...list].forEach(f => fd.append('file', f));
      fetch('/upload', {method:'POST', body: fd}).then(()=>location.reload());
    };
    return fallbackInput;
  }

  openBtn.onclick = () => {
    if (modal && dropZone) {
      modal.hidden = false;
    } else {
      ensureFallbackInput().click();
    }
  };

  /* If modal markup exists, wire drag-drop + modal controls */
  if (!modal || !dropZone) return;

  window.closeModal = () => modal.hidden = true;

  dropZone.ondragover  = e => { e.preventDefault(); dropZone.classList.add('hover'); };
  dropZone.ondragleave = () => dropZone.classList.remove('hover');
  dropZone.ondrop      = e => {
    e.preventDefault(); dropZone.classList.remove('hover');
    uploadFiles(e.dataTransfer.files);
  };

  $('chooseFiles' )?.addEventListener('click', () => $('fileInputFiles')  ?.click());
  $('chooseFolder')?.addEventListener('click', () => $('fileInputFolder')?.click());

  $('fileInputFiles'  )?.addEventListener('change', e => uploadFiles(e.target.files));
  $('fileInputFolder')?.addEventListener('change', e => uploadFiles(e.target.files));

  function uploadFiles(list){
    if (!list || !list.length) return;
    const fd = new FormData();
    [...list].forEach(f => fd.append('file', f));
    fetch('/upload', {method:'POST', body: fd}).then(()=>location.reload());
  }
})();