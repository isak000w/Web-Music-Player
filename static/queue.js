/*  Queue + table sort / search  */
(() => {
    const { $, visibleRows } = window.App;
    const recent      = [];          // src history (max 20)
    const manualQueue = [];          // explicit queue
    let   nextAuto    = [];          // upcoming list
    let   shuffle     = false;
  
    /* expose to other modules */
    App.queue = { recent, manualQueue, get nextAuto(){return nextAuto;}, buildNextAuto, shuffleState:()=>shuffle };
  
    /* sample n rows randomly (avoid recent if possible) */
    function sampleShuffle(n){
      const rows = visibleRows();
      const pool = rows.filter(r => !recent.includes(r.dataset.src));
      const list = pool.length ? pool : rows;
      const picks = [], tmp = [...list];
      while (picks.length < n && tmp.length)
        picks.push(tmp.splice(Math.random() * tmp.length | 0, 1)[0]);
      return picks;
    }
  
    function buildNextAuto(currentRow){
      const rows = visibleRows();
      if (!rows.length){ nextAuto = []; return; }
  
      if (shuffle){ nextAuto = sampleShuffle(5); return; }
  
      if (!currentRow){ nextAuto = rows.slice(0,5); return; }
      const idx = rows.indexOf(currentRow);
      nextAuto = rows.slice(idx+1).concat(rows).slice(0,5);
    }
  
    /* render queue / up-next list */
    function renderQueue(currentRow){
      buildNextAuto(currentRow);
      const ul = $('queueList'); if (!ul) return;
      ul.innerHTML = '';
      manualQueue.forEach((t,i)=>{
        const li = document.createElement('li');
        li.textContent = `★ ${t.title}`;
        li.onclick = () => { manualQueue.splice(i,1); App.play(t); };
        ul.appendChild(li);
      });
      nextAuto.slice(0,5).forEach(r=>{
        const li = document.createElement('li');
        li.textContent = `→ ${r.cells[0].innerText}`;
        ul.appendChild(li);
      });
    }
    App.renderQueue = renderQueue;
  
    /*  shuffle toggle */
    App.toggleShuffle = () => {
      shuffle = !shuffle;
      $('#shuffleBtn')?.classList.toggle('active', shuffle);
      renderQueue(App.currentRow);
    };
  
    /* manual add to queue */
    App.addToQueue = (trackObj) => {
      manualQueue.push(trackObj);
      renderQueue(App.currentRow);
    };
  
    /* search / filter */
    window.filterTracks = function() {
      var input = document.getElementById('searchInput');
      if (!input) return; // Prevent error if input is missing
      var filter = input.value.toLowerCase();
      var rows = document.querySelectorAll('#trackTable tbody tr');
      rows.forEach(function(row) {
        var text = row.innerText.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    };
  
    /* smart column-sort for whichever table is visible */
    window.sortTable = function (colIndex, numeric) {
      // 1. choose the table that is currently shown
      const table =
        document.querySelector('#libraryPanel:not([hidden]) #trackTable') ||
        document.querySelector('#playlistPanel:not([hidden]) #plTrackTable');
  
      if (!table) return;                     // nothing to sort
      const tbody = table.tBodies[0];
      if (!tbody) return;
  
      // 2. toggle direction on every click
      const dir   = table.dataset.sortDir === 'asc' ? 'desc' : 'asc';
      table.dataset.sortDir = dir;
      const mul   = dir === 'asc' ? 1 : -1;
  
      // 3. stable sort rows
      const rows  = Array.from(tbody.rows);
      const coll  = new Intl.Collator(undefined, { numeric, sensitivity: 'base' });
  
      rows.sort((a, b) => mul *
        coll.compare(
          a.cells[colIndex].innerText.trim(),
          b.cells[colIndex].innerText.trim()
        )
      );
  
      // 4. re-insert in new order
      const frag = document.createDocumentFragment();
      rows.forEach(r => frag.appendChild(r));
      tbody.appendChild(frag);
    };
  
  })();
  
  window.Queue = window.Queue || [];
  
  window.Queue.removeById = function (id) {
    const idx = Queue.findIndex(t => t.id == id);
    if (idx > -1) Queue.splice(idx, 1);
  };