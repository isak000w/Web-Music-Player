/*  Persistent Playlists + chooser UI  */
(() => {
  const $ = id => document.getElementById(id);

  /* storage */
  const LS_KEY = 'mc_playlists';
  const load   = () => JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  const save   = obj => localStorage.setItem(LS_KEY, JSON.stringify(obj));
  const state  = load();          // { plName:[tracks] }

  /* ==== playlists main screen ==== */
  const listBox     = $('playlistList');
  const newBtn      = $('newPlBtn');
  const plTracksBox = $('plTracksBox');
  const plTitle     = $('plTitle');
  const plBody      = $('plTrackTable').querySelector('tbody');

  function renderList(){
    listBox.innerHTML='';
    Object.keys(state).forEach(name=>{
      const row=document.createElement('div');row.className='pl-row';
      row.innerHTML=`<span>${name}</span>
        <button data-act="load">▶</button>
        <button data-act="rename">✎</button>
        <button data-act="delete">🗑</button>`;
      row.onclick=e=>{
        const act=e.target.dataset.act||'load';
        if(act==='load'){showTracks(name);}
        if(act==='rename'){const nn=prompt('Rename',name);if(nn&&!state[nn]){state[nn]=state[name];delete state[name];save(state);renderList();}}
        if(act==='delete'){if(confirm('Delete?')){delete state[name];save(state);renderList();plTracksBox.hidden=true;}}
      };
      listBox.appendChild(row);
    });
  }
  function showTracks(name){
    plTitle.textContent=name;plTracksBox.hidden=false;plBody.innerHTML='';
    (state[name]||[]).forEach(tr=>{
      const r=document.createElement('tr');
      r.innerHTML=`<td>${tr.title}</td><td>${tr.artist}</td><td>${tr.dur}</td>
      <td><button onclick="playTrack('${tr.src}','${tr.title}','${tr.artist}','${tr.cov}',this)">▶</button></td>`;
      plBody.appendChild(r);
    });
  }
  newBtn.onclick=()=>{const n=prompt('Playlist name');if(n&&!state[n]){state[n]=[];save(state);renderList();}};

  /* ==== chooser modal ==== */
  const chModal  = $('choosePlModal');
  const chList   = $('chooseList');
  const chNewBtn = $('chooseNew');
  let   pendTrack=null;

  function openChooser(src,t,a,c){
    pendTrack={src,title:t,artist:a,cov:c,dur:'??'};
    chList.innerHTML='';
    Object.keys(state).forEach(n=>{
      const div=document.createElement('div');div.textContent=n;
      div.onclick=()=>{state[n].push(pendTrack);save(state);closeChooser();};
      chList.appendChild(div);
    });
    if(!Object.keys(state).length) chList.innerHTML='<em>No playlists yet</em>';
    chModal.hidden=false;
  }
  function closeChooser(){chModal.hidden=true;pendTrack=null;}

  chNewBtn.onclick=()=>{const n=prompt('New playlist');if(!n)return;
    if(!state[n])state[n]=[];state[n].push(pendTrack);save(state);renderList();closeChooser();};

  /* expose for library button */
  window.PlaylistUI={openChooser,closeChooser};

  /* tab switch */
  window.App.show=p=>{
    $('libraryPanel').hidden=(p!=='library');
    $('playlistPanel').hidden=(p!=='playlists');
    $('libTab').classList.toggle('active',p==='library');
    $('plTab').classList.toggle('active',p==='playlists');
  };

  renderList();
})();