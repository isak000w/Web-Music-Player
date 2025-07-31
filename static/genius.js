/*  Genius search buttons  */
(() => {
    function artist() {
      return window.App?.currentRow?.cells?.[1]?.innerText ||
             document.getElementById('sideArtist')?.innerText || '';
    }
    function title() {
      return window.App?.currentRow?.cells?.[0]?.innerText ||
             document.getElementById('sideTitle')?.innerText || '';
    }
  
    window.openArtistSearch = () => {
      const a = artist().trim();
      if (a) window.open(
        'https://genius.com/search?q=' + encodeURIComponent(a),
        '_blank'
      );
    };
  
    window.openLyricsSearch = () => {
      const t = title().trim();
      const a = artist().trim();
      if (t) window.open(
        'https://genius.com/search?q=' + encodeURIComponent(t + ' ' + a),
        '_blank'
      );
    };
  })();