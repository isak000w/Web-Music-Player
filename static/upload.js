/*  Drag-and-drop / file-picker upload modal  */
(() => {
    const { $ } = window.App;
  
    const modal   = $('uploadModal');
    const drop    = $('dropZone');
    const openBtn = $('openUpload');
  
    /* fallback hidden picker */
    let hiddenPicker;
  
    function ensurePicker(){
      if(hiddenPicker) return hiddenPicker;
      hiddenPicker = document.createElement('input');
      hiddenPicker.type='file'; hiddenPicker.multiple=true; hiddenPicker.style.display='none';
      document.body.appendChild(hiddenPicker);
      hiddenPicker.onchange = e => send(e.target.files);
      return hiddenPicker;
    }
  
    openBtn.onclick = () => modal ? (modal.hidden=false) : ensurePicker().click();
  
    if(!modal || !drop) return;               // modal markup missing
  
    window.closeModal = () => modal.hidden = true;
  
    drop.ondragover  = e=>{e.preventDefault(); drop.classList.add('hover');};
    drop.ondragleave = ()=>drop.classList.remove('hover');
    drop.ondrop      = e=>{e.preventDefault(); drop.classList.remove('hover'); send(e.dataTransfer.files);};
  
    $('chooseFiles' )?.addEventListener('click', ()=> $('fileInputFiles') ?.click());
    $('chooseFolder')?.addEventListener('click', ()=> $('fileInputFolder')?.click());
  
    $('fileInputFiles' )?.addEventListener('change', e=>send(e.target.files));
    $('fileInputFolder')?.addEventListener('change', e=>send(e.target.files));
  
    async function send(fileList){
      const CHUNK = 50;
      const files = [...fileList];
  
      while(files.length){
        const chunk = files.splice(0, CHUNK);
        // leave only real audio files
        const audioOnly = chunk.filter(f => f.type.startsWith("audio/"));
        if(!audioOnly.length) continue;
  
        const fd = new FormData();
        audioOnly.forEach(f => fd.append("file", f));
  
        const r = await fetch("/upload", {method:"POST", body: fd});
        if(r.status >= 400){
          console.warn("Skipped chunk – server said", r.status);
          continue;                         // try the next chunk
        }
      }
      location.reload();
    }
  })();

/* ───── Public helpers for template ───── */
window.UI = {
  openUploadModal,
  closeUploadModal,
  scanLibrary
};

function openUploadModal () {
  document.getElementById('uploadModal').hidden = false;
}

function closeUploadModal () {
  document.getElementById('uploadModal').hidden = true;
}

async function scanLibrary () {
  try {
    await fetch('/scan', {method: 'POST'});
    location.reload();
  } catch (err) {
    alert('Scan failed – see console'); console.error(err);
  }
}