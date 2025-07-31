/*  Gear drop-up & speed modifier  */
(() => {
  const $ = id => document.getElementById(id);

  const gearBtn   = $('gearBtn');
  const gearMenu  = $('gearMenu');
  const speedBtn  = $('speedBtn');
  const speedPane = $('speedPanel');
  const slider    = $('speedSlider');
  const valTxt    = $('speedVal');
  const audio     = window.playerAudio;

  /* ── toggle gear drop-up ── */
  gearBtn.onclick = e => {
    e.stopPropagation();
    gearMenu.classList.toggle('open');
    if (!gearMenu.classList.contains('open')) speedPane.classList.remove('open');
  };

  /* ── speed panel ── */
  speedBtn.onclick = () => speedPane.classList.toggle('open');

  slider.oninput = () => {
    const v = parseFloat(slider.value);
    valTxt.textContent = v.toFixed(1) + '×';
    if (audio) audio.playbackRate = v;
  };

  /* click outside closes everything */
  document.addEventListener('click', e => {
    if (!gearMenu.contains(e.target) && e.target !== gearBtn) {
      gearMenu.classList.remove('open');
      speedPane.classList.remove('open');
    }
  });
})();