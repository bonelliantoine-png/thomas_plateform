/* Adaptateur « page publiée » : quand l'app tourne comme artifact claude.ai (bac à sable), les téléchargements,
   le réseau externe, confirm(), print() et le partage natif sont bloqués. Ce module les remplace par les
   capacités de la plateforme (downloads, sample) ou par un repli clair. Sans `window.claude`, il ne fait rien :
   la version locale (file://) garde son comportement d'origine. */
(function (W) {
  'use strict';
  var host = W.claude;
  if (!host || typeof host.use !== 'function') return;
  var C = W.Cordes, ui = C && C.ui;
  if (!C) return;
  C.hosted = true;

  var downloads = null, sample = null;
  host.use('downloads').then(function (d) { downloads = d; }, function () { downloads = null; });
  host.use('sample').then(function (s) { sample = s; if (s && ui && ui.render && ui.st && C.data) { try { ui.render(); } catch (e) { /* rien */ } } }, function () { sample = null; });

  function toast(msg, kind) { if (ui && ui.toast) ui.toast(msg, kind); }
  var ALLOWED = /\.(png|jpe?g|webp|gif|txt|json|md|csv|html|svg|pdf|zip)$/i;

  // Téléchargements : passent par la confirmation de la plateforme.
  C.download = function (name, content, mime) {
    if (!ALLOWED.test(name)) {
      toast(/\.ics$/i.test(name) ? 'Export agenda indisponible dans la version publiée : ouvrir l’app en local' : 'Format indisponible dans la version publiée', 'wait');
      return false;
    }
    if (!downloads) { toast('Téléchargement indisponible dans cette vue', 'wait'); return false; }
    var data = content instanceof Blob ? content : String(content);
    downloads.save({ filename: name, data: data }).then(function () { toast('Fichier proposé au téléchargement'); }, function (e) {
      var c = e && e.code;
      if (c === 'declined') return;
      toast(c === 'rate_limited' ? 'Une demande est déjà ouverte : réessayer' : 'Téléchargement indisponible dans cette vue', 'wait');
    });
    return true;
  };
  if (ui && ui.actions) {
    var cardName = function () { return C.fileSlug(ui.st) + '-carte-' + (ui._cardOut ? ui._cardOut.fmt : 'carre') + '.png'; };
    ui.actions.cardDl = function () { if (ui._cardOut) C.download(cardName(), ui._cardOut.blob, 'image/png'); };
    ui.actions.cardShare = function () { toast('Partage natif indisponible ici : télécharger l’image', 'wait'); };
    ui.actions.print = function () { toast('Impression indisponible dans la version publiée : exporter le passeport HTML puis l’imprimer', 'wait'); };
  }
  try { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); } catch (e) { /* rien */ }

  // confirm() est refusé : confirmation en deux clics (le second dans les 6 s confirme).
  var pending = { msg: '', at: 0 };
  W.confirm = function (msg) {
    var now = Date.now();
    if (pending.msg === msg && now - pending.at < 6000) { pending = { msg: '', at: 0 }; return true; }
    pending = { msg: msg, at: now };
    toast('Cliquer une seconde fois pour confirmer', 'wait');
    return false;
  };

  // Réseau externe bloqué : message explicite pour « Autour de moi ».
  var nativeFetch = W.fetch;
  W.fetch = function (url) {
    var u = String(url && url.url || url);
    if (/openstreetmap\.org|overpass/i.test(u)) {
      return Promise.reject(new Error('Recherche de lieux indisponible dans la version publiée (réseau externe bloqué). Ouvrir l’app en local ou utiliser les recherches préparées.'));
    }
    return nativeFetch.apply(W, arguments);
  };

  // Copilote : la capacité `sample` remplace la clé API. Sans elle, repli gabarit inchangé.
  if (C.ai) {
    var nativeHas = C.ai.has, nativeAsk = C.ai.ask;
    C.ai.has = function () { return !!sample || nativeHas(); };
    C.ai.ask = function (prompt, onText, opts) {
      if (!sample) return nativeAsk(prompt, onText, opts);
      opts = opts || {};
      var ctl = typeof AbortController === 'function' ? new AbortController() : null;
      if (opts.onAbort) opts.onAbort(function () { if (ctl) ctl.abort(); });
      var sys = 'Consignes : écrire en français sobre, phrases courtes, concrètes et actionnables, avec des plateformes réelles et des étapes datées. Pas d’emoji, pas de tirets d’incise, vouvoiement. Si une information manque, le dire au lieu d’inventer. Texte brut, titres courts en majuscules si besoin.\n\n';
      return sample(sys + prompt, { signal: ctl ? ctl.signal : undefined, modelTier: 'default', cache: false,
        onText: function (o) { if (onText && o && typeof o.text === 'string') onText(o.text); } })
        .then(function (r) { return r.text; }, function (e) {
          var err = new Error((e && e.message) || 'Copilote indisponible'); err.code = e && e.code === 'rate_limited' ? 429 : (e && e.code) || 'host'; throw err;
        });
    };
  }
})(window);
