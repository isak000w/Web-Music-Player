/*  Global helper & namespace bootstrap  */
window.App = { };                         // everything hangs off App

/* dom shortcut */
App.$ = id => document.getElementById(id);

/* time-format helper */
App.fmt = s => `${Math.floor(s / 60)}:${(s % 60 | 0).toString().padStart(2, '0')}`;

/* convenience: visible rows in current filter */
App.visibleRows = () =>
  [...document.querySelectorAll('#trackTable tbody tr')]
  .filter(r => r.style.display !== 'none');