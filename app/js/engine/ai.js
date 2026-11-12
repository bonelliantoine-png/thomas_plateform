/* Copilote IA optionnel : appel direct navigateur à l'API Claude (Messages, streaming SSE) avec la clé de
   l'utilisateur, stockée en localStorage (`cordes.apikey`), jamais exportée ni partagée.
   Repli : chaque fonction a un gabarit local, l'app reste complète sans clé. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  var KEY = 'cordes.apikey';
  C.AI_MODEL = 'claude-opus-5-5';
  C.ai = {
    key: function () { try { return W.localStorage.getItem(KEY) || ''; } catch (e) { return ''; } },
    setKey: function (k) { try { if (k) W.localStorage.setItem(KEY, k.trim()); else W.localStorage.removeItem(KEY); } catch (e) { /* rien */ } },
    has: function () { return !!C.ai.key(); }
  };

  var SYSTEM = 'Tu es le copilote de Cordes, un bilan de compétences de vie (loisirs, passions, savoir-faire, pas la carrière). ' +
    'Tu écris en français sobre : phrases courtes, concrètes, actionnables, avec des chiffres, des noms de plateformes réelles et des étapes datées quand c’est utile. ' +
    'Pas d’emoji, pas de tirets d’incise, pas de formules creuses. Tutoiement interdit, vouvoiement. ' +
    'Si une information manque dans le bilan, tu le dis en une phrase au lieu d’inventer. Réponds en texte brut avec des titres courts en majuscules si besoin.';

  // envoie une requête en streaming ; onText reçoit le texte cumulé
  C.ai.ask = function (prompt, onText, opts) {
    opts = opts || {};
    var key = C.ai.key();
    if (!key) return Promise.reject(Object.assign(new Error('Aucune clé API enregistrée.'), { code: 'nokey' }));
    var body = {
      model: C.AI_MODEL, max_tokens: opts.maxTokens || 16000, stream: true,
      output_config: { effort: opts.effort || 'low' },
      fallbacks: 'default',
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }]
    };
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    if (opts.onAbort) opts.onAbort(function () { if (ctl) ctl.abort(); });
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctl ? ctl.signal : undefined,
      headers: {
        'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2026-10-21',
        'anthropic-beta': 'server-side-fallback-2026-07-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) {
        var msg = ''; try { msg = JSON.parse(t).error.message; } catch (e) { msg = t.slice(0, 200); }
        var err = new Error(msg || ('Erreur ' + r.status)); err.code = r.status; throw err;
      });
      var reader = r.body.getReader(), dec = new TextDecoder(), buf = '', text = '', stop = null;
      function pump() {
        return reader.read().then(function (res) {
          if (res.done) return { text: text, stop: stop };
          buf += dec.decode(res.value, { stream: true });
          var lines = buf.split('\n'); buf = lines.pop();
          lines.forEach(function (line) {
            if (line.indexOf('data:') !== 0) return;
            var data = line.slice(5).trim(); if (!data || data === '[DONE]') return;
            try {
              var ev = JSON.parse(data);
              if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') { text += ev.delta.text; if (onText) onText(text); }
              else if (ev.type === 'message_delta' && ev.delta && ev.delta.stop_reason) stop = ev.delta.stop_reason;
              else if (ev.type === 'error') { var e = new Error(ev.error && ev.error.message || 'Erreur de flux'); e.code = 'stream'; throw e; }
            } catch (e) { if (e.code === 'stream') throw e; }
          });
          return pump();
        });
      }
      return pump();
    }).then(function (res) {
      if (res.stop === 'refusal') { var e = new Error('Le modèle a décliné cette demande.'); e.code = 'refusal'; throw e; }
      return res.text;
    });
  };
  C.ai.errorText = function (e) {
    var c = e && e.code;
    if (c === 'nokey') return 'Ajouter une clé API Claude dans les réglages du copilote, ou utiliser la version gabarit.';
    if (c === 401) return 'Clé API refusée. Vérifier la clé dans les réglages du copilote.';
    if (c === 429) return 'Trop de requêtes : réessayer dans une minute.';
    if (c === 529 || c === 503) return 'Service momentanément surchargé : réessayer dans une minute.';
    if (c === 'refusal') return e.message;
    if (e && e.name === 'AbortError') return 'Génération interrompue.';
    return 'Appel impossible (' + ((e && e.message) || 'réseau') + '). La version gabarit reste disponible.';
  };

  /* ---------- contexte du bilan envoyé au modèle (aucune donnée personnelle au-delà du prénom et de la ville) ---------- */
  C.ai.profileText = function (st) {
    var lines = [];
    var c = st.context || {};
    lines.push('Prénom : ' + (c.firstName || 'non précisé') + ' · ville : ' + (c.city || 'non précisée') + ' · ' + U.num(c.hoursPerWeek, 3) + ' h par semaine · budget ' + U.num(c.budgetPerMonth, 50) + ' € par mois');
    lines.push('Parcours : ' + ({ learn: 'apprendre', offer: 'transmettre', both: 'apprendre et transmettre' }[st.mode] || 'apprendre'));
    var sk = Object.keys(st.skills || {}).filter(function (id) { return C.data.sById[id] && st.skills[id].level > 0; }).sort(function (a, b) { return st.skills[b].level - st.skills[a].level; });
    if (sk.length) lines.push('Compétences : ' + sk.map(function (id) { var v = st.skills[id]; return C.data.sById[id].name + ' (niveau ' + v.level + '/4' + (v.years ? ', ' + v.years + ' ans' : '') + ')'; }).join(' ; '));
    var ds = C.yesDesires(st);
    if (ds.length) lines.push('Envies : ' + ds.map(function (id) { var d = st.desires[id]; return C.data.sById[id].name + ' (cible ' + (d.target || 2) + '/4, horizon ' + (d.horizon || '3m') + ')'; }).join(' ; '));
    var a = st.style && st.style.archetype && C.ARCHETYPES.filter(function (x) { return x.id === st.style.archetype; })[0];
    if (a) lines.push('Profil d’apprenant : ' + a.name + '. ' + a.pref);
    if (st.mode !== 'learn' && st.offer) lines.push('Objectifs de transmission : ' + U.arr(st.offer.goals).map(function (g) { return C.GOALS[g] || g; }).join(', ') + ' · revenu visé ' + U.num(st.offer.incomeTarget) + ' € par mois · ' + U.num(st.offer.hoursPerWeek) + ' h par semaine');
    return lines.join('\n');
  };

  /* ---------- gabarits de repli ---------- */
  C.ai.templateSynthesis = function (st) {
    var c = st.context || {}, out = [];
    var arch = st.style && st.style.archetype && C.ARCHETYPES.filter(function (x) { return x.id === st.style.archetype; })[0];
    var soft = C.softProfile(st).slice(0, 3).map(function (x) { return x.soft.name.toLowerCase(); });
    var top = Object.keys(st.skills || {}).filter(function (id) { return C.data.sById[id] && st.skills[id].level >= 3; }).map(function (id) { return C.data.sById[id].name.toLowerCase(); });
    var ds = C.yesDesires(st);
    out.push('EN BREF');
    out.push((c.firstName ? c.firstName + ', vous' : 'Vous') + ' maîtrisez ' + (top.length ? top.slice(0, 3).join(', ') : 'déjà plusieurs choses') + (soft.length ? ', des pratiques qui développent ' + soft.join(', ') : '') + '.');
    if (ds.length) {
      var p = C.learnPlan(st, ds[0]);
      out.push('Votre envie prioritaire est ' + p.s.name.toLowerCase() + ' : environ ' + p.hours + ' h pour atteindre « ' + p.s.levels[p.target - 1].toLowerCase() + ' », soit ' + p.weeks + ' semaines à ' + p.hpw + ' h par semaine.');
      out.push('Premier pas cette semaine : ' + p.first.text.charAt(0).toLowerCase() + p.first.text.slice(1) + '.');
    }
    if (arch) out.push(arch.pref + ' Conseil : ' + arch.tips[0].charAt(0).toLowerCase() + arch.tips[0].slice(1) + '.');
    var sh = C.shareable(st);
    if (sh.length) out.push('À partager : ' + sh.slice(0, 2).map(function (x) { return x.s.name.toLowerCase(); }).join(' et ') + ' se transmettent bien en petit groupe, entre ' + U.eur(sh[0].range.lo) + ' et ' + U.eur(sh[0].range.hi) + ' la place.');
    return out.join('\n\n');
  };
})(window);
