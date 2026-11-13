/* Point d'entrée : démarre l'application une fois le DOM prêt. */
(function (W) {
  'use strict';
  function start() {
    try { W.Cordes.ui.boot(); }
    catch (e) {
      console.error(e);
      var v = document.getElementById('view');
      if (v) v.innerHTML = '<div class="wrap narrow"><div class="note no" style="margin-top:40px"><span class="lbl">Démarrage impossible</span><span class="sp">' + String(e && e.message || e).replace(/</g, '&lt;') + '. Vérifier que les fichiers de données (js/data) sont présents.</span></div></div>';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window);
