/* Glowbook landing — theme switcher + utilidades
   Persiste tema em localStorage; padrão "rose". */
(function () {
  'use strict';

  var THEMES = ['rose', 'blush', 'sage', 'midnight', 'champagne', 'lilac'];
  var STORAGE_KEY = 'glowbook-theme';
  var root = document.documentElement;

  function applyTheme(theme) {
    if (THEMES.indexOf(theme) === -1) theme = 'rose';
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    document.querySelectorAll('[data-theme-btn]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-theme-btn') === theme));
    });
  }

  // tema salvo
  var saved;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  applyTheme(saved || 'rose');

  // cliques nos dots
  document.querySelectorAll('[data-theme-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTheme(btn.getAttribute('data-theme-btn'));
    });
  });

  // ano dinâmico no footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
