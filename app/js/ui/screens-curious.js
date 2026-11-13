/* Curieux : « Idées à vivre » (#/idees, #i=) et « Ta corde cachée » (#/test, #t=). Tutoiement sur ces écrans grand public.
   Aucun appel réseau : tout est calculé dans le navigateur ; l'IA est facultative (réécriture du message). */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util, ui = C.ui, E = ui.e;
  var sname = function (id) { var s = C.data.sById[id]; return s ? s.name : id; };
  var eurR = function (lo, hi) { return lo === hi ? U.eur(lo) : U.fmt(lo) + ' à ' + U.eur(hi); };

  /* ---------- état local ---------- */
  function idStore() { var s = C.LS.get(C.KEYS.ideas, null); return s && typeof s === 'object' ? s : { sel: [], from: '', when: '' }; }
  function idSave(s) { C.LS.set(C.KEYS.ideas, s); }
  function qzStore() { var s = C.LS.get(C.KEYS.quiz, null); return s && typeof s === 'object' ? s : null; }
  function qzSave(s) { C.LS.set(C.KEYS.quiz, s); }
  function ensure() { if (!C.occasions) C.loadOccasions(); if (!C.quiz) C.loadQuiz(); }

  /* =====================================================================
     A · IDÉES À VIVRE
     ===================================================================== */
  function occState(occ, seed) {
    var f = ui._idf;
    if (!f || f.o !== occ.id) {
      f = ui._idf = { o: occ.id, people: occ.people, budget: occ.budget, place: occ.place, zone: (ui.st.context && C.zoneOf(ui.st.context.city)) || '', tastes: [], kids: null, page: 1, seed: [] };
    }
    if (seed) f.seed = seed;
    return f;
  }
  function chipRow(label, key, opts, val, multi) {
    return '<div class="idrow"><span class="lbl">' + E(label) + '</span><div class="chips" role="group" aria-label="' + E(label) + '">' + opts.map(function (o) {
      var on = multi ? U.arr(val).indexOf(o[0]) >= 0 : String(o[0]) === String(val);
      return '<button type="button" class="chip sm' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="idOpt" data-k="' + key + '" data-v="' + E(o[0]) + '"><i></i>' + E(o[1]) + '</button>';
    }).join('') + '</div></div>';
  }
  ui.routes.idees = {
    title: function (st, p) { ensure(); return p && C.occById[p] ? 'Idées · ' + C.occById[p].label : 'Idées à vivre'; },
    render: function (st, param) {
      ensure();
      if (!param || !C.occById[param]) return occasionsHTML();
      return ideasHTML(st, C.occById[param]);
    },
    mount: function (root, st, param) {
      var z = ui.$('#id-zone', root);
      if (z) z.addEventListener('change', function () { ui._idf.zone = z.value.trim(); C.track('idees_filter', { k: 'zone' }); ui.render(); });
      if (param && C.occById[param] && ui._idOpenTrack !== param) { ui._idOpenTrack = param; C.track('idees_open', { o: param }); }
    }
  };
  function occasionsHTML() {
    var list = C.occasionsOrdered(new Date());
    return '<div class="wrap"><div class="kicker">Idées à vivre · gratuit · sans compte</div><h1 class="h1 disp">Qu’est-ce qu’on fait ?</h1>' +
      '<p class="lead">Une idée de sortie ou de cadeau qui sort de l’ordinaire, en 30 secondes. Chaque idée s’apprend en une heure, avec un vrai résultat à la fin.</p>' +
      '<div class="occgrid" style="margin-top:20px">' + list.map(function (o) {
        return '<a class="occ" href="#/idees/' + o.id + '"><span class="k">' + (o.inSeason ? '<i></i>de saison' : E(o.kicker)) + '</span><span class="t">' + E(o.label) + '</span><span class="d">' + E(o.inSeason ? o.kicker : o.intro.split(' : ')[0].split(',')[0]) + '</span><span class="go">' + ui.icon('arrowR') + '</span></a>';
      }).join('') + '</div>' +
      '<p class="sp" style="margin-top:18px"><a href="#/test" data-act="idToTest">Je ne sais pas pour qui : faire passer le test</a></p></div>';
  }
  function ideaCard(it, sel, f) {
    var on = sel.indexOf(it.s.id) >= 0, b = it.budgetHome, o = it.budgetOut;
    return '<article class="idea' + (on ? ' on' : '') + '"><div class="spread">' + ui.uniTag(it.s.universe) + (it.novelty >= 0.6 ? ui.pill('pépite', 'int') : it.pinned ? ui.pill('classique', 'idle') : '') + '</div>' +
      '<h3 class="it"><button type="button" class="linkbtn" data-act="idSheet" data-id="' + E(it.s.id) + '">' + E(it.title) + '</button></h3>' +
      '<p class="is">' + E(it.sub) + '</p><p class="iw">' + E(it.why) + '</p>' +
      '<div class="ib"><span>Chez soi <b>' + (b.hi <= 0 ? '≈ 0 €' : eurR(b.lo, b.hi)) + '</b>' + (f.people > 1 && b.hi > 0 ? ' / pers.' : '') + '</span><span>En atelier <b>' + eurR(o.lo, o.hi) + '</b></span></div>' +
      '<div class="row ia"><button type="button" class="btn sm' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="idAdd" data-id="' + E(it.s.id) + '">' + ui.icon(on ? 'check' : 'plus') + (on ? ' Ajoutée' : ' Ajouter') + '</button><button type="button" class="btn ghost sm" data-act="idSheet" data-id="' + E(it.s.id) + '">Voir la fiche</button></div></article>';
  }
  function ideasHTML(st, occ) {
    var f = occState(occ), S = idStore(), sel = U.arr(S.sel);
    var r = C.ideas(occ.id, { people: f.people, budget: f.budget, place: f.place, zone: f.zone, tastes: f.tastes, kids: f.kids, seed: f.seed, desires: C.yesDesires(st) });
    ui._ideas = r;
    var shown = r.items.slice(0, f.page * C.IDEAS.page);
    var html = '<div class="wrap"><div class="kicker"><a href="#/idees">Idées à vivre</a> · ' + E(occ.kicker || occ.label) + '</div><h1 class="h1 disp">' + E(occ.label) + '</h1><p class="lead">' + E(occ.intro) + '</p>';
    html += '<section class="panel idset" aria-label="Réglages"><div class="pb">' +
      chipRow('Personnes', 'people', C.IDEA_PEOPLE, f.people) + chipRow('Budget par personne', 'budget', C.IDEA_BUDGETS, f.budget) + chipRow('Lieu', 'place', C.IDEA_PLACES, f.place) +
      (occ.id === 'offrir' ? chipRow('Ses goûts', 'tastes', [['_none', 'je ne sais pas']].concat(C.data.universes.map(function (u) { return [u.id, u.short]; })), f.tastes.length ? f.tastes : ['_none'], true) : '') +
      (occ.kidsSafe ? chipRow('Âge des enfants', 'kids', C.IDEA_KIDS, f.kids) : '') +
      '<div class="idrow"><label class="lbl" for="id-zone">Arrondissement ou ville</label><input class="input sm" id="id-zone" value="' + E(f.zone) + '" placeholder="Paris 11e, Lyon…" autocomplete="address-level2"></div></div></section>';
    html += '<div class="idlayout"><div><div class="spread" style="margin:4px 0 12px"><span class="faint">' + r.total + ' idées possibles · prix en fourchette indicative' + (shown[0] && shown[0].budgetOut.paris ? ', Paris +15 %' : '') + '</span></div>';
    if (!shown.length) html += '<div class="note wait"><span class="lbl">Aucune idée avec ces réglages</span><span class="sp">Élargir le budget ou passer le lieu sur « les deux ».</span></div>';
    html += '<div class="ideas">' + shown.map(function (it) { return ideaCard(it, sel, f); }).join('') + '</div>';
    if (r.items.length > shown.length) html += '<div style="margin-top:14px"><button class="btn" data-act="idMore">Voir 6 autres</button></div>';
    if (occ.b2b) html += '<div class="note int" style="margin-top:18px"><span class="lbl">Pour une équipe de 8 à 20</span><span class="sp">Une séance d’équipe clé en main, animée par un hôte, dans un lieu partenaire du quartier.</span> <a href="#/attente" data-act="idWait" data-src="idees-entreprise">Être prévenu</a></div>';
    html += '</div>' + selPanel(sel, occ) + '</div>';
    html += '<div class="selbar" aria-live="polite"><span>Ta sélection <b>' + sel.length + '</b></span><button class="btn primary sm" data-act="idSend"' + (sel.length ? '' : ' disabled') + '>Envoyer au groupe</button></div>';
    return html + '</div>';
  }
  function selPanel(sel, occ) {
    return '<aside class="selaside"><section class="panel"><div class="ph"><span class="t">Ta sélection</span><span class="count">' + sel.length + '</span></div><div class="pb tight">' +
      (sel.length ? sel.map(function (id) { return '<div class="resitem" style="grid-template-columns:1fr auto"><div class="nm" style="font-size:15px">' + E(sname(id)) + '</div><button class="btn ghost sm" data-act="idAdd" data-id="' + E(id) + '" aria-label="Retirer ' + E(sname(id)) + '">' + ui.icon('x') + '</button></div>'; }).join('') : '<p class="empty">Ajoute 2 à 5 idées, puis envoie-les au groupe pour voter.</p>') +
      '</div><div class="pb" style="border-top:1px solid var(--line)"><button class="btn primary" style="width:100%" data-act="idSend"' + (sel.length ? '' : ' disabled') + '>Envoyer au groupe</button></div></section></aside>';
  }
  ui.actions.idOpt = function (el) {
    var f = ui._idf, k = el.getAttribute('data-k'), v = el.getAttribute('data-v');
    if (k === 'tastes') {
      if (v === '_none') f.tastes = [];
      else { var i = f.tastes.indexOf(v); if (i >= 0) f.tastes.splice(i, 1); else if (f.tastes.length < 6) f.tastes.push(v); else ui.toast('6 univers au plus', 'wait'); }
    } else if (k === 'kids') f.kids = f.kids === v ? null : v;
    else f[k] = v === 'any' ? 'any' : /^\d+$/.test(v) ? +v : v;
    f.page = 1; C.track('idees_filter', { k: k });
    var y = W.scrollY; ui.render(); W.scrollTo(0, y);
  };
  ui.actions.idMore = function () { ui._idf.page++; var y = W.scrollY; ui.render(); W.scrollTo(0, y); };
  ui.actions.idAdd = function (el) {
    var id = el.getAttribute('data-id'), S = idStore(), i = S.sel.indexOf(id);
    if (i >= 0) S.sel.splice(i, 1);
    else { if (S.sel.length >= 5) { ui.toast('5 idées au plus', 'wait'); return; } S.sel.push(id); C.track('idees_add', { id: id }); }
    S.o = (ui._idf && ui._idf.o) || S.o; idSave(S);
    var dOpen = !ui.$('#drawer').hidden && ui.$('#drawer [data-sheet]');
    var y = W.scrollY; ui.render(); W.scrollTo(0, y);
    if (dOpen) ui.actions.idSheet({ getAttribute: function () { return id; } });
    else ui.toast(i >= 0 ? 'Retirée de ta sélection' : 'Ajoutée à ta sélection');
  };
  ui.actions.idToTest = function () { C.track('idees_to_test'); ui.go('#/test'); };

  /* A4 · fiche idée */
  ui.actions.idSheet = function (el) {
    var id = el.getAttribute('data-id'), f = ui._idf || {}, x = C.ideaSheet(id, { zone: f.zone, people: f.people });
    if (!x) return;
    C.track('idees_card', { id: id });
    var on = U.arr(idStore().sel).indexOf(id) >= 0, s = x.s;
    ui.drawer(s.name, '<div data-sheet="' + E(id) + '">' + ui.uniTag(s.universe) +
      '<div class="lbl" style="margin-top:14px">À la fin de l’heure</div><p class="prose" style="color:var(--fg)">' + E(x.end) + '</p>' +
      '<div class="lbl" style="margin-top:12px">Pour aller plus loin</div><ul class="clean">' + x.further.map(function (t) { return '<li>' + E(t) + '</li>'; }).join('') + '</ul>' +
      '<div class="counters" style="grid-template-columns:1fr 1fr;margin-top:14px">' + ui.counter('Pour les bases', '≈ ' + x.hours + '<small> h</small>', 'jusqu’au niveau 2') + ui.counter('Chez soi', x.budgetHome.hi <= 0 ? '≈ 0<small> €</small>' : U.fmt(x.budgetHome.lo) + '–' + U.fmt(x.budgetHome.hi) + '<small> €</small>', 'matériel' + ((f.people || 1) > 1 ? ', par personne' : ''), 'sent') +
      ui.counter('En atelier', U.fmt(x.budgetOut.lo) + '–' + U.fmt(x.budgetOut.hi) + '<small> €</small>', 'par personne' + (x.budgetOut.paris ? ', Paris' : ''), 'int') + ui.counter('Forces', '<span style="font-size:14px;letter-spacing:0">' + E(x.soft.join(', ') || '·') + '</span>', 'mobilisées') + '</div>' +
      '<p class="faint" style="font-size:11.5px;margin-top:6px">Fourchettes indicatives, issues du catalogue et des prix relevés.</p>' +
      '<div class="lbl" style="margin-top:14px" id="idlinks" tabindex="-1">Où le faire</div><div class="linkgrid" style="margin-top:8px">' + x.links.map(function (l) { return '<a href="' + E(l.url) + '" target="_blank" rel="noopener noreferrer" data-act="idOut" data-p="' + E(l.id) + '">' + E(l.name) + ui.icon('ext') + '</a>'; }).join('') + '</div>' +
      '<div class="lbl" style="margin-top:14px">Le faire chez soi</div><p class="sp">' + E(x.home.text) + (x.home.link ? ' ' + ui.extLink(x.home.link, x.home.label) : '') + '</p>' +
      (x.neighbors.length ? '<div class="lbl" style="margin-top:14px">Si ça te plaît</div><div class="chips" style="margin-top:6px">' + x.neighbors.map(function (n) { return '<button class="chip sm" data-act="idSheet" data-id="' + E(n.id) + '"><i></i>' + E(n.name) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="row" style="margin-top:18px"><button class="btn primary" data-act="idAdd" data-id="' + E(id) + '" aria-pressed="' + on + '">' + (on ? 'Retirer' : 'Ajouter') + '</button><button class="btn" data-act="idGift" data-id="' + E(id) + '">Offrir</button><button class="btn ghost" data-act="scrollTo" data-target="idlinks">Où le faire</button></div></div>');
  };
  ui.actions.idOut = function (el) { C.track('idees_out', { platform: el.getAttribute('data-p') }); return true; };

  /* A5 · envoyer au groupe */
  function selection() { var S = idStore(); return { o: S.o || (ui._idf && ui._idf.o) || '', ids: U.arr(S.sel).filter(function (id) { return C.data.sById[id]; }), from: S.from || '', when: S.when || '' }; }
  ui.actions.idSend = function () {
    var sel = selection();
    if (!sel.ids.length) { ui.toast('Ajouter au moins une idée', 'wait'); return; }
    C.encodeIdeas(sel).then(function (code) {
      var link = C.shareUrl(code).replace('#b=', '#i=');
      ui._idMsg = ui._idMsg && ui._idMsg.code === code ? ui._idMsg : { code: code, text: C.ideasMessage(sel, link), link: link };
      ui._copyStore = ui._copyStore || {}; ui._copyStore.idmsg = ui._idMsg.text;
      var noBilan = !(ui.st && ui.st.mode);
      ui.drawer('Envoyer au groupe', '<ol class="clean selol">' + sel.ids.map(function (id) { return '<li>' + E(sname(id)) + '</li>'; }).join('') + '</ol>' +
        (sel.ids.length < 2 ? '<p class="faint" style="font-size:11.5px">Avec 2 à 5 idées, le groupe peut voter.</p>' : '') +
        '<div class="grid2 tightgrid"><label class="field"><span class="lbl">Ton prénom (facultatif)</span><input class="input" id="id-from" value="' + E(sel.from) + '" maxlength="40" autocomplete="given-name"></label>' +
        '<label class="field"><span class="lbl">Pour quand</span><input class="input" id="id-when" value="' + E(sel.when) + '" maxlength="60" placeholder="samedi 14 déc., l’EVJF de Léa…"></label></div>' +
        '<label class="field"><span class="lbl">Message</span><textarea class="input" id="id-msg" style="min-height:120px" aria-label="Message à envoyer">' + E(ui._idMsg.text) + '</textarea></label>' +
        (C.ai.has() ? '<div class="row" style="margin-top:8px">' + ui.seg('_', [['drôle', 'Drôle'], ['sobre', 'Sobre']], ui._idTone || 'drôle', 'Ton').replace(/data-act="set" data-bind="_"/g, 'data-act="idTone"') + '<button class="btn ghost sm" data-act="idAi">' + ui.icon('spark') + ' Réécrire le message</button></div>' : '') +
        '<div class="row" style="margin-top:14px"><button class="btn primary" data-act="idCopy">' + ui.icon('copy') + ' Copier le message</button><button class="btn" data-act="idShare">' + ui.icon('share') + ' Partager</button><button class="btn" data-act="idGift">Bon cadeau</button><button class="btn" data-act="idToDesires">Ajouter à mes envies</button></div>' +
        (noBilan ? '<div class="note int" style="margin-top:16px" id="id-bilan"><span class="lbl">Aller plus loin</span><span class="sp">Le bilan part de ces idées pour te proposer des voisines et un plan concret.</span> <button class="btn sm" data-act="idBilan">Faire mon bilan avec ces envies</button></div>' : '') +
        '<p class="faint" style="margin-top:12px;font-size:11.5px">Le lien contient les idées, ton prénom et la date, rien d’autre. Aucun serveur.</p>', { focus: '#id-from' });
      var upd = function () {
        var S = idStore(); S.from = ui.$('#id-from').value.trim(); S.when = ui.$('#id-when').value.trim(); idSave(S);
        var s2 = selection();
        C.encodeIdeas(s2).then(function (c2) { var l2 = C.shareUrl(c2).replace('#b=', '#i='); ui._idMsg = { code: c2, text: C.ideasMessage(s2, l2), link: l2 }; var m = ui.$('#id-msg'); if (m) m.value = ui._idMsg.text; ui._copyStore.idmsg = ui._idMsg.text; });
      };
      ['#id-from', '#id-when'].forEach(function (q) { var i = ui.$(q); if (i) i.addEventListener('change', upd); });
    });
  };
  function msgText() { var m = ui.$('#id-msg'); return m ? m.value : (ui._idMsg && ui._idMsg.text) || ''; }
  ui.actions.idCopy = function () { ui.copy(msgText()); C.track('idees_share', { n: selection().ids.length, via: 'copie' }); };
  ui.actions.idShare = function () {
    var t = msgText();
    if (navigator.share) navigator.share({ title: 'Idées à vivre', text: t }).then(function () { C.track('idees_share', { n: selection().ids.length, via: 'natif' }); }).catch(function () { /* annulé */ });
    else { ui.copy(t); C.track('idees_share', { n: selection().ids.length, via: 'copie' }); }
  };
  ui.actions.idTone = function (el) { ui._idTone = el.getAttribute('data-val'); ui.$$('[data-act="idTone"]').forEach(function (b) { var on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); };
  ui.actions.idAi = function (el) {
    var sel = selection(), occ = C.occById[sel.o], out = ui.$('#id-msg'); if (!out) return;
    el.disabled = true;
    var prompt = 'Réécris ce message d’invitation entre amis, en tutoyant, ton ' + (ui._idTone || 'drôle') + ', 400 caractères au plus, sans emoji, en gardant le lien tel quel à la fin. Occasion : ' + (occ ? occ.label : 'une sortie') + '. Idées : ' + sel.ids.map(sname).join(', ') + '. Message actuel : ' + msgText();
    C.ai.ask(prompt, function () { /* attendre la fin */ }).then(function (t) {
      t = String(t || '').trim().slice(0, 400); if (ui._idMsg && t.indexOf(ui._idMsg.link) < 0) t = t.replace(/\s*$/, ' ') + ui._idMsg.link;
      out.value = t; el.disabled = false; ui.toast('Message réécrit');
    }).catch(function () { el.disabled = false; ui.toast('IA indisponible · message standard', 'wait'); });
  };
  ui.actions.idToDesires = function () {
    var sel = selection(), st = ui.st, n = C.yesDesires(st).length;
    sel.ids.forEach(function (id) { if (!st.desires[id] || st.desires[id].verdict !== 'yes') { n++; st.desires[id] = { verdict: 'yes', source: 'idees', target: 2, horizon: '3m', formats: ['atelier'], motive: ['plaisir'], priority: n }; } });
    ui.save(true); ui.toast(sel.ids.length + ' envie' + (sel.ids.length > 1 ? 's' : '') + ' ajoutée' + (sel.ids.length > 1 ? 's' : '') + (st.mode ? ' à ton bilan' : ''));
  };
  ui.actions.idBilan = function () {
    var sel = selection(), st = ui.st;
    // les idées passent en tête du paquet d'inspiration : on les retire des envies pour qu'elles reviennent en cartes
    sel.ids.forEach(function (id) { if (st.desires[id] && st.desires[id].source === 'idees') delete st.desires[id]; });
    st.mode = 'learn'; st.step = 'contexte'; st.deck = st.deck || {}; st.deck.seed = sel.ids.slice(); st.deck.seedFrom = 'idees';
    ui.save(true); C.track('idees_to_bilan'); C.track('start', { m: 'learn' }); ui.go('#/bilan/contexte');
  };
  ui.actions.idWait = function (el) {
    var src = el.getAttribute('data-src') || 'idees';
    ui._prefill = { wants: src === 'idees-entreprise' ? [] : selection().ids, source: src }; ui._wl = null;
    C.track('idees_to_waitlist'); ui.go('#/attente');
  };

  /* A6 · sélection reçue (#i=) */
  ui.routes.recu = {
    title: 'Idées reçues',
    render: function (st, code) {
      ensure();
      var r = ui._recv;
      if (!r || r.code !== code) {
        ui._recv = { code: code, loading: true };
        C.decodeIdeas(code).then(function (sel) { ui._recv = { code: code, sel: sel }; if (sel) C.track('idees_recv', { n: sel.ids.length }); ui.render(); });
        return '<div class="wrap"><div class="status"><span class="spin"></span>Lecture des idées…</div></div>';
      }
      if (r.loading) return '<div class="wrap"><div class="status"><span class="spin"></span>Lecture des idées…</div></div>';
      if (!r.sel) return '<div class="wrap narrow"><div class="note no" style="margin-top:30px"><span class="lbl">Lien incomplet</span><span class="sp">Ce lien a été coupé en route. Demander un nouveau lien à la personne qui l’a envoyé.</span></div><a class="btn primary" href="#/idees" style="margin-top:14px">Voir des idées</a></div>';
      var sel = r.sel, occ = C.occById[sel.o];
      var html = '<div class="wrap"><div class="kicker">Idées à vivre' + (occ ? ' · ' + E(occ.label) : '') + (sel.when ? ' · ' + E(sel.when) : '') + '</div><h1 class="h1 disp">' + E(sel.from || 'Quelqu’un') + ' te propose ' + sel.ids.length + ' idée' + (sel.ids.length > 1 ? 's' : '') + '</h1>' +
        '<p class="lead">Chaque idée s’apprend en une heure, avec un vrai résultat à la fin. Vote pour celle qui te tente : le message de réponse est prêt à copier.</p><div class="ideas" style="margin-top:18px">';
      html += sel.ids.map(function (id) {
        var s = C.data.sById[id], b = C.ideaBudgets(s, { people: occ ? occ.people : 2 });
        return '<article class="idea"><div class="spread">' + ui.uniTag(s.universe) + '</div><h3 class="it">' + E(C.ideaTitle(s, occ, occ ? occ.people : 2)) + '</h3><p class="is">À la fin : ' + E(U.lc(s.levels[0])) + '</p>' +
          '<div class="ib"><span>En atelier <b>' + eurR(b.out.lo, b.out.hi) + '</b></span><span class="faint">fourchette indicative</span></div>' +
          '<div class="row ia"><button class="btn sm" data-act="idVote" data-id="' + E(id) + '">Je vote pour celle-là</button></div></article>';
      }).join('') + '</div><div id="vote-out" aria-live="polite"></div>';
      html += '<div class="grid2" style="margin-top:20px"><section class="panel"><div class="pb"><div class="lbl">Et toi ?</div><p class="prose" style="margin-top:6px">Quelle est ta corde cachée ? 8 questions, 60 secondes, et trois savoir-faire qui te ressemblent.</p><a class="btn primary" style="margin-top:12px" href="#/test" data-act="recvTest">Faire le test · 60 s</a></div></section>' +
        '<section class="panel"><div class="pb"><div class="lbl">Près de chez toi</div><p class="prose" style="margin-top:6px">Ces séances ouvrent quartier par quartier, en petits groupes, dans des lieux partenaires.</p><button class="btn" style="margin-top:12px" data-act="recvWait">Être prévenu</button></div></section></div>';
      return html + '</div>';
    }
  };
  ui.actions.idVote = function (el) {
    var id = el.getAttribute('data-id'), sel = ui._recv && ui._recv.sel, t = C.voteMessage(id, sel && sel.from);
    ui._copyStore = ui._copyStore || {}; ui._copyStore.vote = t;
    ui.$('#vote-out').innerHTML = ui.copyBlock('Ta réponse', t, 'vote');
    ui.$$('[data-act="idVote"]').forEach(function (b) { b.classList.toggle('on', b === el); b.setAttribute('aria-pressed', b === el); });
    ui.copy(t);
  };
  ui.actions.recvTest = function () { C.track('idees_to_test'); ui.go('#/test'); };
  ui.actions.recvWait = function () { ui._prefill = { wants: (ui._recv && ui._recv.sel && ui._recv.sel.ids) || [], source: 'idees-partage' }; ui._wl = null; C.track('idees_to_waitlist'); ui.go('#/attente'); };

  /* A7 · bon cadeau */
  ui.actions.idGift = function (el) {
    var one = el && el.getAttribute && el.getAttribute('data-id');
    var sel = selection();
    var g = ui._gift = Object.assign({ kind: one ? 'one' : (sel.ids.length > 1 ? 'sel' : 'one'), id: one || sel.ids[0], ids: sel.ids, from: sel.from || (ui.st.context && ui.st.context.firstName) || '', to: '', word: '' }, ui._gift && !one ? { from: ui._gift.from, to: ui._gift.to, word: ui._gift.word } : {}, one ? { id: one, kind: 'one' } : {});
    if (!g.id && !g.ids.length) { ui.toast('Choisir une idée d’abord', 'wait'); return; }
    ui.drawer('Bon cadeau', '<div>' + ui.seg('_', [['one', 'Une heure de ' + U.lc(C.data.sById[g.id] ? C.nm(C.data.sById[g.id]) : '…')], ['sel', 'Une sortie à choisir']].filter(function (o) { return o[0] === 'one' || g.ids.length > 1; }), g.kind, 'Type de bon').replace(/data-act="set" data-bind="_"/g, 'data-act="giftKind"') + '</div>' +
      '<div class="grid2 tightgrid"><label class="field"><span class="lbl">De</span><input class="input" id="gf-from" value="' + E(g.from) + '" maxlength="30"></label><label class="field"><span class="lbl">Pour</span><input class="input" id="gf-to" value="' + E(g.to) + '" maxlength="30"></label></div>' +
      '<label class="field"><span class="lbl">Un mot (120 caractères)</span><textarea class="input" id="gf-word" maxlength="120" style="min-height:70px">' + E(g.word) + '</textarea></label>' +
      '<div class="cardprev gift" id="gift-prev"><div class="status"><span class="spin"></span>Dessin du bon…</div></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="giftDl" disabled>' + ui.icon('dl') + ' Télécharger</button><button class="btn" data-act="giftPrint">' + ui.icon('print') + ' Imprimer (A6)</button><span class="faint">1080 × 1350 · PNG</span></div>');
    var redraw = function () { g.from = ui.$('#gf-from').value.trim(); g.to = ui.$('#gf-to').value.trim(); g.word = ui.$('#gf-word').value.slice(0, 120); drawGift(); };
    ['#gf-from', '#gf-to', '#gf-word'].forEach(function (q) { var i = ui.$(q); if (i) i.addEventListener('change', redraw); });
    drawGift();
  };
  function giftData() {
    var g = ui._gift, s = C.data.sById[g.id];
    return { kind: g.kind, from: g.from, to: g.to, word: g.word, title: g.kind === 'sel' ? 'Bon pour une sortie à choisir' : 'Bon pour une heure ' + (s ? C.de(s) : ''), items: g.kind === 'sel' ? g.ids.map(function (id) { return C.data.sById[id]; }).filter(Boolean) : [s].filter(Boolean),
      end: g.kind === 'sel' ? 'À choisir ensemble parmi ' + g.ids.length + ' idées' : (s ? 'À la fin : ' + U.lc(s.levels[0]) : '') };
  }
  function drawGift() {
    ui.cardFontsReady().then(function () {
      var cv = ui.drawGiftCard(document.createElement('canvas'), giftData());
      cv.toBlob(function (b) {
        if (!b) return; ui._giftOut = b;
        var pv = ui.$('#gift-prev'); if (!pv) return;
        pv.innerHTML = '<img src="' + cv.toDataURL('image/png') + '" alt="Aperçu du bon cadeau" class="gift">';
        var dl = ui.$('#drawer [data-act="giftDl"]'); if (dl) dl.disabled = false;
      }, 'image/png');
    });
  }
  ui.actions.giftKind = function (el) { ui._gift.kind = el.getAttribute('data-val'); ui.$$('[data-act="giftKind"]').forEach(function (b) { var on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); drawGift(); };
  ui.actions.giftDl = function () { if (!ui._giftOut) return; C.download('cordes-bon-cadeau.png', ui._giftOut, 'image/png'); C.track('idees_gift', { fmt: 'png' }); };
  ui.actions.giftPrint = function () {
    var d = giftData();
    if (C.hosted) { ui.toast('Impression indisponible dans la version publiée : télécharger l’image', 'wait'); return; }
    var z = ui.$('#giftprint'); if (!z) { z = document.createElement('div'); z.id = 'giftprint'; document.body.appendChild(z); }
    z.innerHTML = '<div class="gp"><div class="gpk">Cordes · bon cadeau</div><div class="gpt">' + E(d.title) + '</div>' + (d.to ? '<div class="gpl">Pour ' + E(d.to) + (d.from ? ', de la part de ' + E(d.from) : '') + '</div>' : '') +
      '<ul>' + d.items.map(function (s) { return '<li>' + E(s.name) + '</li>'; }).join('') + '</ul><div class="gpl">' + E(d.end) + '</div>' + (d.word ? '<p class="gpw">« ' + E(d.word) + ' »</p>' : '') +
      '<div class="gpf">' + (C.PUBLIC_URL ? 'Idée trouvée sur Cordes · ' + E(C.PUBLIC_URL) : 'Idée trouvée sur Cordes') + '</div></div>';
    document.body.classList.add('printgift');
    var done = function () { document.body.classList.remove('printgift'); W.removeEventListener('afterprint', done); };
    W.addEventListener('afterprint', done); setTimeout(done, 4000);
    C.track('idees_gift', { fmt: 'a6' });
    W.print();
  };

  /* =====================================================================
     B · TA CORDE CACHÉE
     ===================================================================== */
  function quizRes() { var q = qzStore(); if (!q || U.arr(q.answers).length < 8) return null; return C.quizScore(q.answers); }
  ui.routes.test = {
    title: function (st, p) { return p === 'r' ? 'Ta corde cachée' : 'Le test'; },
    render: function (st, param) {
      ensure();
      if (param === 'q') return questionHTML();
      if (param === 'r') { var r = quizRes(); return r ? resultHTML(r) : introHTML(); }
      return introHTML();
    },
    mount: function (root, st, param) {
      if (param === 'q') { var b = ui.$('.qopt.on', root) || ui.$('.qopt', root); if (b) b.focus({ preventScroll: true }); }
      if (param === 'r') { var r = quizRes(); if (r && ui._qzDoneTrack !== r.answers.join('')) { ui._qzDoneTrack = r.answers.join(''); C.track('test_done', { profile: r.profile.id }); } }
    },
    onKey: function (ev) {
      var p = ui.current && ui.current.route.param;
      if (p !== 'q') return;
      var q = C.quiz.questions[ui._qi || 0];
      if (/^[1-5]$/.test(ev.key) && q.opts[+ev.key - 1]) { ev.preventDefault(); answer(+ev.key - 1); }
      else if (ev.key === 'ArrowLeft' || ev.key === 'Backspace') { ev.preventDefault(); back(); }
    }
  };
  function introHTML() {
    var prev = quizRes();
    return '<div class="wrap narrow"><section class="qintro"><div class="kicker">Le test · gratuit · sans compte</div><h1 class="h1 disp">Quelle est ta corde cachée ?</h1>' +
      '<p class="lead">8 questions sur ta vie, pas sur tes compétences. Découvre le savoir-faire qui te ressemble, et ce que tu saurais faire en une heure.</p>' +
      '<p class="sp" style="margin-top:10px">8 questions · 60 secondes · sans compte</p>' +
      '<div class="row" style="margin-top:18px"><button class="btn primary lg" data-act="qzStart">Commencer</button>' + (prev ? '<a class="btn lg" href="#/test/r">Voir mon résultat : ' + E(prev.profile.name) + '</a>' : '') + '</div>' +
      '<p class="faint" style="margin-top:14px;font-size:11.5px">Tes réponses restent sur cet appareil.</p></section></div>';
  }
  ui.actions.qzStart = function () { ui._qa = []; ui._qi = 0; C.track('test_start'); ui.go('#/test/q'); };
  function questionHTML() {
    var Q = C.quiz.questions, i = U.clamp(ui._qi || 0, 0, Q.length - 1), q = Q[i], a = ui._qa = ui._qa || [];
    return '<div class="wrap narrow"><div class="qprog" role="progressbar" aria-valuemin="1" aria-valuemax="8" aria-valuenow="' + (i + 1) + '" aria-label="Question ' + (i + 1) + ' sur 8">' + Q.map(function (_, k) { return '<i class="' + (k < i ? 'done' : k === i ? 'cur' : '') + '"></i>'; }).join('') + '</div>' +
      '<div class="kicker" style="margin-top:16px">Question ' + (i + 1) + ' sur 8</div><h1 class="h1 qh" id="qh">' + E(q.q) + '</h1>' +
      '<div class="qopts" role="radiogroup" aria-labelledby="qh">' + q.opts.map(function (o, k) { var on = a[i] === k; return '<button type="button" role="radio" aria-checked="' + on + '" class="qopt' + (on ? ' on' : '') + '" data-act="qzAns" data-k="' + k + '"><kbd>' + (k + 1) + '</kbd><span>' + E(o.t) + '</span></button>'; }).join('') + '</div>' +
      '<div class="spread" style="margin-top:16px"><button class="btn ghost" data-act="qzBack"' + (i ? '' : ' disabled') + '>' + ui.icon('arrowL') + ' Revenir</button><span class="faint" style="font-size:11.5px">touches 1 à ' + q.opts.length + ', ← pour revenir</span></div></div>';
  }
  function answer(k) {
    var Q = C.quiz.questions, i = ui._qi || 0; ui._qa = ui._qa || [];
    ui._qa[i] = k; C.track('test_answer', { q: i + 1 });
    var go = function () {
      if (i >= Q.length - 1) {
        var ans = ui._qa.slice(0, 8);
        qzSave({ answers: ans, surprise: 0, liked: [], defiDone: {}, at: new Date().toISOString(), name: (ui.st.context && ui.st.context.firstName) || '' });
        ui.go('#/test/r');
      } else { ui._qi = i + 1; ui.render({ keepFocus: false }); var b = ui.$('.qopt'); if (b) b.focus({ preventScroll: true }); }
    };
    var el = ui.$('.qopt[data-k="' + k + '"]'); if (el) el.classList.add('on');
    if (W.matchMedia('(prefers-reduced-motion: reduce)').matches) go(); else setTimeout(go, 140);
  }
  function back() { if ((ui._qi || 0) > 0) { ui._qi--; ui.render({ keepFocus: false }); var b = ui.$('.qopt.on') || ui.$('.qopt'); if (b) b.focus({ preventScroll: true }); } }
  ui.actions.qzAns = function (el) { answer(+el.getAttribute('data-k')); };
  ui.actions.qzBack = back;

  function picksFor(r) { var q = qzStore() || {}; return C.quizPicks(r, { surprise: q.surprise || 0 }); }
  function resultHTML(r) {
    var q = qzStore(), P = picksFor(r), liked = U.arr(q.liked), p = r.profile;
    ui._qzP = P;
    var html = '<div class="wrap"><div class="kicker">Ta corde cachée</div><h1 class="cordename" aria-live="polite">' + E(p.name) + '</h1><p class="lead">' + E(p.portrait) + '</p>';
    html += '<div class="qres"><section class="panel"><div class="ph"><span class="t">Tes quatre axes</span></div><div class="pb chart">' + C.charts.axesSVG(r.axes, null, { size: 260 }) + '</div></section>' +
      '<div class="picks">' + P.picks.map(function (x) {
        var on = liked.indexOf(x.s.id) >= 0;
        return '<article class="pick ' + x.role + '"><div class="spread"><span class="lbl">' + E(x.label) + '</span>' + ui.uniTag(x.s.universe) + '</div><h3 class="it">' + E(x.s.name) + '</h3>' +
          '<p class="is">En 1 h tu sauras : ' + E(U.lc(x.oneHour)) + '</p>' + (x.role === 'surprise' ? '<p class="iw">Une passerelle depuis ' + E(C.nm(P.picks[0].s)) + ', dans un autre univers</p>' : '') +
          '<div class="row ia"><button class="btn sm' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="qzLike" data-id="' + E(x.s.id) + '">' + ui.icon(on ? 'check' : 'plus') + ' Ça me tente</button>' + (x.role === 'surprise' && P.surprises.length > 1 ? '<button class="btn ghost sm" data-act="qzMore">Une autre surprise</button>' : '') + '</div></article>';
      }).join('') + '</div></div>';
    var d = C.quizDefi(P.picks[0].s.id), done = !!(q.defiDone || {})[d.id];
    html += '<section class="panel defi" style="margin-top:16px"><div class="ph"><span class="t">Défi de la semaine</span><span class="hint">cette semaine, en ' + d.minutes + ' minutes</span></div><div class="pb"><div class="h3">' + E(d.titre) + '</div>' +
      '<p class="sp" style="margin-top:4px">Matériel : ' + E(d.materiel) + '</p><ol class="defisteps">' + d.etapes.map(function (e) { return '<li>' + E(e) + '</li>'; }).join('') + '</ol>' +
      '<div class="row" style="margin-top:10px"><label class="toggle"><input type="checkbox" data-act="qzDefi" data-id="' + E(d.id) + '"' + (done ? ' checked' : '') + '> Fait</label>' + (done ? '<span class="sp" style="color:var(--int)">' + E(d.reussi) + '</span><button class="btn sm" data-act="qzCard" data-defi="1">' + ui.icon('img') + ' Partager ma réussite</button>' : '') + '</div></div></section>';
    html += '<div class="section-h"><span class="kicker">Et maintenant</span><h2 class="h2">Partager, comparer, aller plus loin</h2></div><div class="tiles qtiles">' +
      [['qzCard', 'Partager ma carte', 'Une image story ou carrée de ta corde'], ['qzCompare', 'Comparer avec un ami', 'Un lien : ses réponses, les tiennes, ce que vous pourriez apprendre ensemble'], ['qzIdeas', 'Trouver une idée à vivre', 'Des sorties à plusieurs autour de tes trois savoir-faire'],
        ['qzBilan', 'Aller plus loin · bilan 10 min', 'Le bilan part de ta corde : tes trois savoir-faire en tête'], ['qzWait', 'Être prévenu près de chez moi', 'Séances d’une heure en petit groupe, quartier par quartier'], ['qzRedo', 'Refaire le test', 'Nouvelles réponses, nouvelle corde']]
        .map(function (t) { return '<button class="tile" data-act="' + t[0] + '"><span class="t">' + E(t[1]) + '</span><span class="d">' + E(t[2]) + '</span></button>'; }).join('') + '</div>';
    return html + '</div>';
  }
  ui.actions.qzLike = function (el) {
    var q = qzStore(), id = el.getAttribute('data-id'), l = q.liked = U.arr(q.liked), i = l.indexOf(id);
    if (i >= 0) l.splice(i, 1); else l.push(id);
    qzSave(q); var y = W.scrollY; ui.render(); W.scrollTo(0, y);
  };
  ui.actions.qzMore = function () {
    var q = qzStore(), r = quizRes(), P = C.quizPicks(r, {});
    q.surprise = ((q.surprise || 0) + 1) % Math.max(1, P.surprises.length); q.picksSeen = U.uniq(U.arr(q.picksSeen).concat([P.surprises[q.surprise]]));
    qzSave(q); C.track('test_more'); var y = W.scrollY; ui.render(); W.scrollTo(0, y); ui.toast('Nouvelle surprise');
  };
  ui.actions.qzDefi = function (el) {
    var q = qzStore(); q.defiDone = q.defiDone || {};
    if (el.checked) { q.defiDone[el.getAttribute('data-id')] = new Date().toISOString(); C.track('test_defi_done'); } else delete q.defiDone[el.getAttribute('data-id')];
    qzSave(q); var y = W.scrollY; ui.render(); W.scrollTo(0, y);
  };
  ui.actions.qzRedo = function () { ui.actions.qzStart(); };
  ui.actions.qzIdeas = function () {
    var P = ui._qzP; occState(C.occById.amis, P ? P.picks.map(function (x) { return x.s.id; }) : []);
    C.track('test_to_idees'); ui.go('#/idees/amis');
  };
  ui.actions.qzWait = function () {
    var q = qzStore() || {}; ui._prefill = { wants: U.arr(q.liked).length ? q.liked.slice() : (ui._qzP ? ui._qzP.picks.map(function (x) { return x.s.id; }) : []), source: 'test' }; ui._wl = null;
    C.track('test_to_waitlist'); ui.go('#/attente');
  };
  ui.actions.qzBilan = function () {
    var r = quizRes(), P = ui._qzP || C.quizPicks(r, {}), st = ui.st;
    if (st && st.mode && !st.demo && Object.keys(st.skills || {}).length) {
      st.deck = st.deck || {}; st.deck.seed = P.picks.map(function (x) { return x.s.id; }); st.deck.seedFrom = 'test'; st.step = st.step === 'done' ? 'done' : st.step;
      ui.save(true); C.track('test_to_bilan'); ui.go('#/bilan/envies'); return;
    }
    ui.st = C.quizToState(r, P.picks); ui.st.step = 'contexte';
    ui.save(true); C.track('test_to_bilan'); C.track('start', { m: 'learn' }); ui.go('#/bilan/contexte');
  };
  ui.actions.qzCompare = function () {
    var r = quizRes(), q = qzStore();
    C.encodeQuiz(r, q.name || (ui.st.context && ui.st.context.firstName) || '').then(function (code) {
      var link = C.shareUrl(code).replace('#b=', '#t=');
      ui._copyStore = ui._copyStore || {}; ui._copyStore.qzlink = 'Ma corde cachée : ' + r.profile.name + '. Et toi ? ' + link;
      ui.drawer('Comparer avec un ami', '<p class="sp">Envoie ce lien : ton ami voit ta corde, fait le test, et découvre ce que vous pourriez apprendre ensemble.</p>' +
        '<label class="field"><span class="lbl">Ton prénom (facultatif)</span><input class="input" id="qz-name" value="' + E(q.name || '') + '" maxlength="40"></label>' +
        '<textarea class="input" readonly id="qz-link" style="margin-top:12px;font:12px var(--f-mono);min-height:90px" aria-label="Lien à envoyer">' + E(ui._copyStore.qzlink) + '</textarea>' +
        '<div class="row" style="margin-top:10px"><button class="btn primary" data-act="qzCopy">' + ui.icon('copy') + ' Copier le lien</button></div><p class="faint" style="margin-top:10px;font-size:11.5px">Le lien contient tes 8 réponses et ton prénom si tu l’indiques. Rien d’autre.</p>');
      var n = ui.$('#qz-name'); if (n) n.addEventListener('change', function () { var q2 = qzStore(); q2.name = n.value.trim(); qzSave(q2); ui.actions.qzCompare(); });
    });
  };
  ui.actions.qzCopy = function () { ui.copy(ui._copyStore.qzlink); C.track('test_compare'); C.track('test_share', { fmt: 'lien' }); };

  /* carte de la corde (story ou carré) */
  ui._qzFmt = 'story';
  ui.actions.qzCard = function (el) {
    var r = quizRes(); if (!r) return;
    var defi = el && el.getAttribute && el.getAttribute('data-defi') ? C.quizDefi(picksFor(r).picks[0].s.id) : null;
    ui._qzDefiCard = defi; var fmt = ui._qzFmt;
    ui.drawer('Partager ma carte', ui.seg('_', [['story', 'Story'], ['carre', 'Carré']], fmt, 'Format').replace(/data-act="set" data-bind="_"/g, 'data-act="qzFmt"') +
      '<div class="cardprev" id="qz-prev"><div class="status"><span class="spin"></span>Dessin de la carte…</div></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="qzDl" disabled>' + ui.icon('dl') + ' Télécharger</button>' + (navigator.share ? '<button class="btn" data-act="qzShareImg" disabled>' + ui.icon('share') + ' Partager</button>' : '') + '<span class="faint">' + E(ui.CARD_FORMATS[fmt][2]) + ' · PNG</span></div>');
    ui.cardFontsReady().then(function () {
      var cv = ui.drawQuizCard(document.createElement('canvas'), { r: r, picks: picksFor(r).picks, defi: defi }, fmt);
      cv.toBlob(function (b) {
        ui._qzOut = { blob: b, fmt: fmt };
        var pv = ui.$('#qz-prev'); if (!pv) return;
        pv.innerHTML = '<img src="' + cv.toDataURL('image/png') + '" alt="Carte de ta corde cachée : ' + E(r.profile.name) + '" class="' + fmt + '">';
        ui.$$('#drawer [data-act="qzDl"], #drawer [data-act="qzShareImg"]').forEach(function (x) { x.disabled = false; });
      }, 'image/png');
    });
  };
  ui.actions.qzFmt = function (el) { ui._qzFmt = el.getAttribute('data-val'); ui.actions.qzCard(ui._qzDefiCard ? { getAttribute: function () { return '1'; } } : null); };
  ui.actions.qzDl = function () { if (!ui._qzOut) return; C.download('cordes-corde-' + ui._qzOut.fmt + '.png', ui._qzOut.blob, 'image/png'); C.track('test_share', { fmt: ui._qzOut.fmt }); };
  ui.actions.qzShareImg = function () {
    if (!ui._qzOut || !navigator.share) return;
    var file = new File([ui._qzOut.blob], 'cordes-corde.png', { type: 'image/png' }), data = { files: [file], title: 'Ma corde cachée', text: 'Et toi, quelle est ta corde cachée ?' };
    if (navigator.canShare && !navigator.canShare(data)) { ui.toast('Partage d’image non pris en charge : télécharger l’image', 'wait'); return; }
    navigator.share(data).then(function () { C.track('test_share', { fmt: ui._qzOut.fmt }); }).catch(function () { /* annulé */ });
  };

  /* B4 · résultat reçu (#t=) */
  ui.routes.corde = {
    title: 'Corde cachée reçue',
    render: function (st, code) {
      ensure();
      var x = ui._trecv;
      if (!x || x.code !== code) {
        ui._trecv = { code: code, loading: true };
        C.decodeQuiz(code).then(function (o) { ui._trecv = { code: code, o: o }; if (o) C.track('test_recv'); ui.render(); });
        return '<div class="wrap"><div class="status"><span class="spin"></span>Lecture du résultat…</div></div>';
      }
      if (x.loading) return '<div class="wrap"><div class="status"><span class="spin"></span>Lecture du résultat…</div></div>';
      if (!x.o) return '<div class="wrap narrow"><div class="note no" style="margin-top:30px"><span class="lbl">Lien incomplet</span><span class="sp">Ce lien a été coupé en route. Demander un nouveau lien, ou faire le test.</span></div><a class="btn primary" href="#/test" style="margin-top:14px">Faire le test</a></div>';
      var them = C.quizScore(x.o.answers), tp = C.quizPicks(them, {}), name = x.o.name || 'Ton ami';
      var html = '<div class="wrap"><div class="kicker">Ta corde cachée · résultat reçu</div><h1 class="h1 disp">La corde cachée de ' + E(name) + ' : <span class="accent">' + E(them.profile.name) + '</span></h1><p class="lead">' + E(them.profile.portrait) + '</p>' +
        '<div class="ideas" style="margin-top:16px">' + tp.picks.map(function (p) { return '<article class="idea"><div class="spread"><span class="lbl">' + E(p.label) + '</span>' + ui.uniTag(p.s.universe) + '</div><h3 class="it">' + E(p.s.name) + '</h3><p class="is">En 1 h : ' + E(U.lc(p.oneHour)) + '</p></article>'; }).join('') + '</div>';
      var mine = quizRes();
      if (!mine) return html + '<div class="note int" style="margin-top:20px"><span class="lbl">Et toi ?</span><span class="sp">Fais le test pour comparer vos cordes et trouver ce que vous pourriez apprendre ensemble.</span></div><div class="row" style="margin-top:14px"><a class="btn primary lg" href="#/test" data-act="qzStartFromRecv">Faire le test</a></div></div>';
      var cmp = C.quizCompare(mine, them);
      if (ui._tcmpTrack !== code) { ui._tcmpTrack = code; C.track('test_compare'); }
      ui._together = cmp.together.map(function (s) { return s.id; });
      html += '<div class="section-h"><span class="kicker">Comparaison</span><h2 class="h2">Toi, ' + E(mine.profile.name) + ' · ' + E(name) + ', ' + E(them.profile.name) + '</h2></div>' +
        '<div class="grid2"><section class="panel"><div class="ph"><span class="t">Vos axes</span><span class="legend"><span><span class="sw" style="background:var(--accent)"></span>toi</span><span><span class="sw" style="border:1.5px dashed var(--int)"></span>' + E(name) + '</span></span></div><div class="pb chart">' + C.charts.axesSVG(mine.axes, them.axes, { size: 260 }) + '</div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Ce que vous pourriez apprendre ensemble</span></div><div class="pb tight">' + cmp.together.map(function (s) { return '<div class="resitem"><div class="nm">' + E(s.name) + '</div>' + ui.uniTag(s.universe) + '<div class="d">En 1 h : ' + E(U.lc(s.levels[0])) + '</div></div>'; }).join('') +
        '<a class="btn primary" style="margin-top:14px" href="#/idees/amis" data-act="tTogether">Trouver une idée à vivre ensemble</a></div></section></div>';
      return html + '</div>';
    }
  };
  ui.actions.qzStartFromRecv = function () { ui.actions.qzStart(); };
  ui.actions.tTogether = function () { occState(C.occById.amis, ui._together || []); C.track('test_to_idees'); ui.go('#/idees/amis'); };

  /* ---------- passerelles depuis les résultats du bilan ---------- */
  ui.actions.goIdeas = function () { ensure(); occState(C.occById.amis, C.yesDesires(ui.st).slice(0, 5)); C.track('use', { k: 'idees' }); ui.go('#/idees/amis'); };
  ui.actions.goTest = function () { C.track('use', { k: 'test' }); ui.go('#/test'); };
})(window);
