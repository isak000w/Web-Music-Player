/*  PLAYER MODULE — robust initialisation
    Creates the <audio> element if it does not yet exist,
    then wires play / pause / next / prev / loop / progress.           */
    (() => {
        const { $, fmt, visibleRows, queue, renderQueue } = window.App;
      
        /* ── ensure audio element exists ── */
        let audio = window.playerAudio;
        if (!audio) {
          audio = new Audio();
          window.playerAudio = audio;
        }
      
        const bar     = $('progressBar');
        const timeTxt = $('timeDisplay');
        const sideBtn = $('sidePlayPause');
        const footBtn = $('footerPlayPause');
        const loopBtn = $('loopBtn');
      
        let currentBtn = null;
        let loopTrack  = false;
        let rafId      = 0;
      
        /* expose current row for queue navigation */
        App.currentRow = null;
      
        /* ── progress RAF ── */
        function tick() {
          if (audio.duration) {
            bar.max  = audio.duration;
            bar.value = audio.currentTime;
            timeTxt.textContent = `${fmt(audio.currentTime)} / -${fmt(Math.max(0, audio.duration - audio.currentTime))}`;
          }
          rafId = requestAnimationFrame(tick);
        }
      
        /* ── core play ── */
        App.play = ({ src, title, artist, cov, btn }) => {
          if (currentBtn && currentBtn !== btn) currentBtn.textContent = '▶';
          currentBtn = btn;
      
          App.currentRow = btn?.closest('tr') || null;
          document.querySelectorAll('tr.playing').forEach(r => r.classList.remove('playing'));
          App.currentRow?.classList.add('playing');
      
          queue.recent.unshift(src);
          queue.recent.splice(20);
      
          audio.src  = src;
          audio.loop = loopTrack;
          audio.load();
          audio.play()
            .catch(e => {            // promise rejection (NotSupportedError)
              handleMissingFile(e, App.currentRow);
            });
          audio.onerror = e => {     // network 404, CORS, etc.
            handleMissingFile(e, App.currentRow);
          };
      
          $('sideTitle').textContent  = title;
          $('sideArtist').textContent = artist;
          $('sideCover').innerHTML    = cov ? `<img src="${cov}" alt>` : '';
      
          renderQueue(App.currentRow);
        };
      
        /**
         * Play one track.
         * If the media file returns 404 we remove it and advance automatically.
         * @param {Object} tr – {src,title,artist,cov,id,row}
         * @param {Boolean} fromQueue – internal recursion guard
         */
        async function playTrack(tr, fromQueue = false) {
          if (!tr) return;
      
          // ── 1. HEAD request to verify file exists ───────────────
          try {
            const head = await fetch(tr.src, { method: "HEAD" });
            if (!head.ok) throw new Error("missing");
          } catch {
            // file missing – prompt only the first time
            if (!fromQueue && confirm(`${tr.title} is missing.\nDelete from library?`)) {
              await fetch(`/track/${tr.id}`, { method: "DELETE" });
              document.querySelector(`tr[data-id="${tr.id}"]`)?.remove();
              Queue.removeById(tr.id);
            }
            // recurse to next track (flag so no more prompts this loop)
            return nextTrack(true);
          }
      
          // ── 2. file exists – proceed with normal playback ───────
          const audio = window.playerAudio;
          const cover = document.getElementById("sideCover");
      
          document.querySelectorAll(".playing").forEach(r => r.classList.remove("playing"));
          tr.row?.classList.add("playing");
      
          cover.innerHTML = tr.cov ? `<img src="${tr.cov}">` : "";
      
          audio.onerror   = null;          // clear old handler
          audio.src       = tr.src;
          document.getElementById('sideTitle').textContent  = tr.title || '';
          document.getElementById('sideArtist').textContent = tr.artist || '';
          audio.play().catch(console.error);
        }
        window.playTrack = (src,title,artist,cov,btnRow) => {
          playTrack({
            src,title,artist,cov,
            id  : btnRow.closest("tr").dataset.id,
            row : btnRow.closest("tr")
          });
        };
      
        function nextTrack(skipPrompt = false){
          const next = Queue.shift();     // or however you fetch next
          playTrack(next, skipPrompt);
        }
      
        /* transport controls */
        window.togglePlay = () => (audio.paused ? audio.play() : audio.pause());
      
        window.prevTrack = () => {
          if (audio.currentTime > 2) { audio.currentTime = 0; return; }
          const prev = App.currentRow && App.currentRow.previousElementSibling;
          prev?.querySelector('.play-btn')?.click();
        };
      
        window.nextTrack = () => {
          if (queue.manualQueue.length) { App.play(queue.manualQueue.shift()); return; }
          if (!queue.nextAuto.length) queue.buildNextAuto(App.currentRow);
          queue.nextAuto.shift()?.querySelector('.play-btn')?.click();
        };
      
        window.toggleLoop = () => {
          loopTrack = !loopTrack;
          loopBtn.classList.toggle('active', loopTrack);
          audio.loop = loopTrack;
        };
      
        /* audio event hooks */
        audio.onplay  = () => { sideBtn.textContent = footBtn.textContent = '⏸'; currentBtn && (currentBtn.textContent = '⏸'); cancelAnimationFrame(rafId); tick(); };
        audio.onpause = () => { sideBtn.textContent = footBtn.textContent = '▶'; currentBtn && (currentBtn.textContent = '▶'); cancelAnimationFrame(rafId); };
        audio.onended = () => { if (!loopTrack) window.nextTrack(); };
        audio.onloadedmetadata = () => { bar.max = audio.duration || 0; bar.value = 0; };
        bar.oninput = () => { if (audio.duration) audio.currentTime = bar.value; };
      
        async function handleMissingFile(err, trackRow) {
          const id   = trackRow?.dataset.id;
          const name = trackRow?.cells[0].innerText || 'this track';
      
          if (!id) { alert('Missing file'); nextTrack(); return; }
      
          if (confirm(`${name} is missing on disk.\nDelete from library?`)) {
            await fetch(`/track/${id}`, {method:'DELETE'});
            trackRow.remove();              // remove from UI
            Queue.removeById(id);           // keep queue consistent
          }
          nextTrack();                      // always move on exactly once
        }
      })();