/* =====================================================================
   오늘의 랜딩 (today.html) — data/landings.json 의 숏폼별 랜딩을 같은 틀에 채웁니다.
     today.html?c=코드   그 숏폼의 랜딩      today.html   가장 최근 진행 중 랜딩
   접수 마감(deadline · 없으면 노출 기한 expiresAt)까지 카운트다운하고, 0 이 되면 즉시 '마감' 화면으로 바뀝니다.
   글 · 공고 · 핵심 · 혜택 · 절차 · 사례(자금 종류별) · FAQ 가 랜딩마다 바뀝니다.
   ===================================================================== */
(function () {
  'use strict';
  var FUND = { operating: '운전자금', facility: '시설자금', export: '수출자금', refinance: '대환대출', startup: '창업·기술자금' };
  var REL_RE = /^\.\/[A-Za-z0-9._\-\/?=&#]+$/;
  var HTTPS_RE = /^https:\/\/[^\s"'<>]+$/;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel) { return document.querySelector(sel); }
  function set(key, val) { document.querySelectorAll('[data-lp="' + key + '"]').forEach(function (n) { if (val) n.textContent = val; else if (n.tagName === 'P') n.hidden = true; }); }
  function endOf(l) { return l.deadline || l.expiresAt || null; }
  function kst(iso) {
    var d = new Date(Date.parse(iso) + 9 * 3600e3);
    return (d.getUTCMonth() + 1) + '월 ' + d.getUTCDate() + '일(' + '일월화수목금토'.charAt(d.getUTCDay()) + ') ' + ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2);
  }

  function closed(l) {
    document.querySelectorAll('[data-lp-live]').forEach(function (s) { s.hidden = true; });
    var c = $('#lpClosed'); if (c) c.hidden = false;
    var t = $('[data-lp-closed-title]');
    if (t) t.textContent = l ? '‘' + (l.title || l.headline || '이 이벤트') + '’ 이벤트는 마감되었습니다' : '지금 진행 중인 이벤트가 없습니다';
    if (!l) { var p = c && c.querySelector('p'); if (p) p.innerHTML = '새 숏폼 이벤트가 열리면 이곳에서 바로 확인하실 수 있습니다.<br>지금 접수 중인 정책자금을 먼저 확인해 보세요.'; }
    var others = $('#lpOthers'); if (others) others.querySelector('h2').innerHTML = '지금 접수 중인<br><i>정책자금</i>';
    document.title = '마감된 이벤트 | 오늘의 정책자금';
  }

  function countdown(l) {
    var end = endOf(l), box = $('[data-countdown]');
    if (!end) return;
    var target = Date.parse(end);
    if (box && l.deadline) {
      box.hidden = false;
      set('deadlineLabel', (l.deadlineLabel ? l.deadlineLabel + ' · ' : '') + kst(l.deadline) + ' 마감까지');
    }
    var cells = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
    function tick() {
      var ms = target - Date.now();
      if (ms <= 0) { clearInterval(timer); closed(l); return; }
      var s = Math.floor(ms / 1000);
      if (cells.d) cells.d.textContent = String(Math.floor(s / 86400));
      if (cells.h) cells.h.textContent = ('0' + Math.floor(s % 86400 / 3600)).slice(-2);
      if (cells.m) cells.m.textContent = ('0' + Math.floor(s % 3600 / 60)).slice(-2);
      if (cells.s) cells.s.textContent = ('0' + s % 60).slice(-2);
    }
    var timer = setInterval(tick, 1000); tick();
  }

  function render(l) {
    var fundName = FUND[l.fund] || '정책자금';
    document.title = (l.title || l.headline || '오늘의 정책자금 이벤트') + ' | 오늘의 정책자금';
    var md = document.querySelector('meta[name="description"]'); if (md && l.sub) md.setAttribute('content', l.sub);
    set('badge', l.badge || l.title);
    var h1 = $('[data-lp="headline"]'); if (h1 && l.headline) h1.textContent = l.headline;
    set('sub', l.sub);
    set('cta', l.cta);
    set('effort', l.effort ? '⏱ ' + l.effort : '');
    set('title', l.title || '이벤트 혜택');
    set('benefit', l.benefit);
    set('disclaimer', l.disclaimer);

    var p = l.program || {};
    var chips = $('[data-lp-chips]');
    if (chips) chips.innerHTML = [['기관', p.agency], ['한도', p.amount], ['금리', p.rate]].filter(function (x) { return x[1]; })
      .map(function (x) { return '<span>' + x[0] + ' <b>' + esc(x[1]) + '</b></span>'; }).join('');

    // 공고 한눈에
    set('programName', p.name || fundName + ' 공고 한눈에 보기');
    var dl = $('[data-lp-program]');
    var rows = [['자금', p.name], ['운용 기관', p.agency], ['한도', p.amount], ['금리', p.rate],
      ['대상', (p.target || []).length ? '<ul>' + p.target.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : ''],
      ['접수 기간', p.period], ['접수 마감', l.deadline ? kst(l.deadline) : ''], ['신청 방법', p.apply],
      ['공고 원문', HTTPS_RE.test(p.url || '') ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">원문 공고 보기 ↗</a>' : '']];
    if (dl) dl.innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
      var v = /^<(ul|a)[ >]/.test(r[1]) ? r[1] : esc(r[1]); return '<div><dt>' + r[0] + '</dt><dd>' + v + '</dd></div>';
    }).join('');
    var pts = $('[data-lp-points]');
    if (pts) {
      if ((l.points || []).length) pts.innerHTML = l.points.map(function (t, i) { return '<li><span>' + (i + 1) + '</span>' + esc(t) + '</li>'; }).join('');
      else $('[data-lp-points-wrap]').hidden = true;
    }

    // 혜택 · 절차
    var bl = $('[data-lp-benefits]'); if (bl) bl.innerHTML = (l.benefits || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    var st = $('[data-lp-steps]'); if (st) st.innerHTML = (l.steps || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    if (!l.benefit && !(l.steps || []).length) $('#lpBenefit').hidden = true;

    // 사례 — 이 랜딩의 자금 종류
    var fn = $('[data-lp-fund-name]'); if (fn) fn.textContent = fundName;
    if (window.TF_CASES) window.TF_CASES.renderFor($('#lpCases'), l.fund, l.cases || []);

    // FAQ · 출처 · 정보글
    var fq = $('[data-lp-faq]');
    if (fq) {
      if ((l.faq || []).length) fq.innerHTML = l.faq.map(function (x, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(x.q) + '</summary><p>' + esc(x.a) + '</p></details>'; }).join('');
      else fq.hidden = true;
    }
    var src = $('[data-lp-sources]');
    if (src) src.innerHTML = (l.sources || []).filter(function (s) { return HTTPS_RE.test(s.url || ''); })
      .map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener nofollow">출처 · ' + esc(s.title) + '</a>'; }).join('');
    var post = $('[data-lp-post]'); if (post && REL_RE.test(l.post || '')) { post.href = l.post; post.hidden = false; }

    // 숏폼 영상
    var v = $('[data-lp-video]');
    if (v && /^[A-Za-z0-9_-]{6,20}$/.test(l.youtubeId || '')) {
      v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + l.youtubeId + '?rel=0&playsinline=1" title="오늘의 숏폼" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      v.hidden = false;
    }

    // 신청폼: 자금 종류 미리 선택 · 어느 랜딩에서 신청했는지
    var sel = document.querySelector('#fundForm select[name="fund_type"]');
    if (sel && FUND[l.fund]) { for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === FUND[l.fund] || sel.options[i].text === FUND[l.fund]) sel.selectedIndex = i; }
    var where = '오늘의 랜딩 · ' + (l.title || l.code);
    document.body.setAttribute('data-form-location', where);
    document.querySelectorAll('#fundForm [name="reception_location"]').forEach(function (n) { n.value = where; });
    if (window.TF_PROGRAMS) window.TF_PROGRAMS.setCurrent(l.code);
    countdown(l);
  }

  function boot() {
    var sp; try { sp = new URLSearchParams(location.search); } catch (e) { sp = { get: function () { return null; } }; }
    var code = String(sp.get('c') || '').toLowerCase();
    fetch('./data/landings.json?v=' + Math.floor(Date.now() / 6e4), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (j) {
        var items = (j && j.items) || {}, now = Date.now();
        var l = /^[a-z0-9]{4,24}$/.test(code) ? items[code] : null;
        if (!l) {
          // 코드가 없거나 모르는 코드 → 가장 최근 진행 중 랜딩
          var live = Object.keys(items).map(function (k) { return items[k]; })
            .filter(function (x) { return !x.hidden && (!endOf(x) || Date.parse(endOf(x)) > now); })
            .sort(function (a, b) { return String(b.publishedAt).localeCompare(String(a.publishedAt)); });
          l = live[0] || null;
        }
        if (!l || l.hidden || (endOf(l) && Date.parse(endOf(l)) <= now)) { closed(l); return; }
        render(l);
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
