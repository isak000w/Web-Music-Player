/* ── song counter ───────────────────────────────────────── */
function updateSongCount () {
  const table = document.querySelector('#trackTable');
  if (!table) return;                               // page not ready

  const n   = table.tBodies[0]?.rows.length || 0;
  const tag = document.getElementById('songCount');
  if (tag)  tag.textContent = n ? String(n) : '';
}

// call after initial render
updateSongCount();

// also expose for other modules (upload / delete)
window.updateSongCount = updateSongCount;
