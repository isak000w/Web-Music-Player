/**
 * Mini footer visualiser (guaranteed to draw).
 * · Blue bars while playing; thin grey line when idle.
 * · Transparent canvas background.
 * · Works even if playback already running before script loads.
 *
 * NOTE: The analyser is wired straight to AudioContext.destination
 *       so it always receives data. This duplicates the signal
 *       but the gain difference is inaudible over the main element.
 */
(() => {
  const W = 90, H = 18, BAR = 3, GAP = 2;

  function boot() {
    const audio = window.playerAudio;
    if (!audio) { setTimeout(boot, 100); return; }

    const cvs = document.getElementById('miniViz');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');

    /* Web-Audio graph */
    const AC = window.AudioContext || window.webkitAudioContext;
    const actx = new AC();
    const source = actx.createMediaElementSource(audio);
    const analyser = actx.createAnalyser();
    analyser.fftSize = 64;

    /* put analyser in the path, THEN to destination */
    source.connect(analyser);
    analyser.connect(actx.destination);   // ensures analyser gets data

    const buf = new Uint8Array(analyser.frequencyBinCount);

    const drawIdle = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#bbb';
      ctx.fillRect(0, H / 2, W, 1);
    };

    const render = () => {
      if (audio.paused) { drawIdle(); return; }

      analyser.getByteFrequencyData(buf);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1e90ff';
      let x = 0;
      for (let i = 0; i < buf.length && x < W; i++) {
        const h = (buf[i] / 255) * H;
        ctx.fillRect(x, H - h, BAR, h);
        x += BAR + GAP;
      }
      requestAnimationFrame(render);
    };

    /* hooks */
    audio.addEventListener('play',  () => { actx.resume().catch(()=>{}); render(); });
    audio.addEventListener('pause', drawIdle);
    audio.addEventListener('ended', drawIdle);

    /* start immediately if already playing */
    audio.paused ? drawIdle() : render();
  }

  boot();
})();