/* =====================================================================
   자금 확보 사례 — data/cases.json (관리자 「자금 확보 사례」에서 저장) 을 읽어
   아래 자리에 자동으로 그립니다. 사례를 추가하면 관련 페이지 전부에 함께 늘어납니다.
     · [data-cases="main"]                메인 슬라이드 (자금별 탭)
     · [data-cases="list"]                사례 페이지 전체 목록 (자금별 탭 · 건수)
     · [data-cases="fund"][data-fund=키]  자금별 페이지 하단 (해당 자금 사례만, 없으면 섹션 숨김)
   ===================================================================== */
(function () {
  'use strict';

  /* 정책자금 종류 — 순서대로 탭이 만들어집니다. 관리자 lib/caseTypes.ts 의 FUNDS 와 같습니다. */
  var FUNDS = [
    { key: 'operating', name: '운전자금', file: 'fund-operating.html' },
    { key: 'facility', name: '시설자금', file: 'fund-facility.html' },
    { key: 'export', name: '수출자금', file: 'fund-export.html' },
    { key: 'refinance', name: '대환대출', file: 'fund-refinance.html' },
    { key: 'startup', name: '창업·기술자금', file: 'fund-startup.html' }
  ];
  var NAME = {};
  FUNDS.forEach(function (f) { NAME[f.key] = f.name; });

  var NOTE = '* 실제 상담 사례를 바탕으로 재구성했으며, 기업 보호를 위해 일부 정보를 변경했습니다. 승인 금액 · 기간은 기업별 심사 결과에 따라 달라집니다.';
  var IMG_RE = /^img\/[a-z0-9\/_-]+\.(jpg|jpeg|png|webp|gif)$/i;
  var ID_RE = /^[a-z0-9-]{2,60}$/;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function img(c) { return IMG_RE.test(c.img || '') ? './' + c.img : './img/og-image.jpg'; }
  function cid(c) { return ID_RE.test(c.id || '') ? c.id : ''; }

  var loading = null;
  function load() {
    if (loading) return loading;
    loading = (window.fetch ? fetch('./data/cases.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }) : Promise.resolve(null))
      .then(function (d) {
        var items = d && Array.isArray(d.items) ? d.items : [];
        return items.filter(function (c) { return c && !c.hidden && NAME[c.fund] && cid(c); });
      })
      .catch(function () { return []; });
    return loading;
  }

  function kpi(c) {
    return '<dl class="cs-kpi">' +
      '<div class="big"><dt>승인 금액</dt><dd>' + esc(c.amount) + '</dd></div>' +
      '<div><dt>연매출</dt><dd>' + esc(c.sales) + '</dd></div>' +
      '<div><dt>업력</dt><dd>' + esc(c.years) + '</dd></div>' +
      '<div><dt>소요 기간</dt><dd>' + esc(c.period) + '</dd></div></dl>';
  }

  function fullCard(c) {
    return '<article class="cs-card" id="case-' + cid(c) + '" data-fund="' + esc(c.fund) + '">' +
      '<div class="cs-media"><img src="' + esc(img(c)) + '" alt="" loading="lazy"><span class="cs-badge">' + esc(NAME[c.fund]) + '</span></div>' +
      '<div class="cs-body">' +
        '<span class="cs-pin">' + esc(c.region) + ' · ' + esc(c.industry) + '</span>' +
        '<h3>' + esc(c.title) + '</h3>' + kpi(c) +
        '<ol class="cs-story">' +
          '<li><b>상황</b><p>' + esc(c.before) + '</p></li>' +
          '<li><b>해결</b><p>' + esc(c.solution) + '</p></li>' +
          '<li><b>결과</b><p>' + esc(c.after) + '</p></li>' +
        '</ol>' +
        (c.route ? '<p class="cs-route"><span>활용 자금</span>' + esc(c.route) + '</p>' : '') +
      '</div></article>';
  }

  function slideCard(c) {
    return '<a class="sc-card" href="./cases.html#case-' + cid(c) + '" data-fund="' + esc(c.fund) + '">' +
      '<div class="sc-media"><img src="' + esc(img(c)) + '" alt="" loading="lazy"><span>' + esc(NAME[c.fund]) + '</span></div>' +
      '<div class="sc-body">' +
        '<em>' + esc(c.region) + ' · ' + esc(c.industry) + ' · 연매출 ' + esc(c.sales) + '</em>' +
        '<strong>' + esc(c.title) + '</strong>' +
        '<div class="sc-amt"><small>승인 금액</small><b>' + esc(c.amount) + '</b><i>' + esc(c.period) + ' 소요</i></div>' +
        '<p>' + esc(c.after) + '</p><u>사례 자세히 보기 →</u>' +
      '</div></a>';
  }

  function tabs(items, withCount, active) {
    var html = '<button type="button" data-f=""' + (!active ? ' class="on"' : '') + '>전체' + (withCount ? ' <i>' + items.length + '</i>' : '') + '</button>';
    FUNDS.forEach(function (f) {
      var n = items.filter(function (c) { return c.fund === f.key; }).length;
      if (!n) return;
      html += '<button type="button" data-f="' + f.key + '"' + (active === f.key ? ' class="on"' : '') + '>' + esc(f.name) + (withCount ? ' <i>' + n + '</i>' : '') + '</button>';
    });
    return html;
  }

  function filterTo(root, selector, f) {
    root.querySelectorAll('[data-f]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-f') === f); });
    root.querySelectorAll(selector).forEach(function (c) { c.hidden = !!f && c.getAttribute('data-fund') !== f; });
  }

  /* ───────── 메인 슬라이드 ───────── */
  function renderMain(root, items) {
    var track = root.querySelector('.sc-track');
    var tabBox = root.querySelector('.sc-tabs');
    var rows = items.filter(function (c) { return c.showOnMain !== false; });
    if (!rows.length) { root.hidden = true; return; }
    tabBox.innerHTML = tabs(rows, false, '');
    track.innerHTML = rows.map(slideCard).join('');
    var stop = false;
    tabBox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]'); if (!b) return;
      stop = true; filterTo(root, '.sc-card', b.getAttribute('data-f')); track.scrollTo({ left: 0, behavior: 'smooth' });
    });
    root.querySelector('.sc-ctrl').addEventListener('click', function (e) {
      var b = e.target.closest('[data-dir]'); if (!b) return;
      var c = track.querySelector('.sc-card:not([hidden])');
      var w = c ? c.getBoundingClientRect().width + 20 : 350;
      var d = Number(b.getAttribute('data-dir'));
      if (d > 0 && track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) track.scrollTo({ left: 0, behavior: 'smooth' });
      else track.scrollBy({ left: d * w, behavior: 'smooth' });
    });
    if (!matchMedia('(prefers-reduced-motion:reduce)').matches) {
      setInterval(function () { if (stop || document.hidden) return; var n = root.querySelector('[data-dir="1"]'); if (n) n.click(); }, 5000);
    }
    track.addEventListener('pointerdown', function () { stop = true; }, { once: true });
  }

  /* ───────── 사례 페이지 ───────── */
  function renderList(root, items) {
    var grid = root.querySelector('.cl-grid');
    var tabBox = root.querySelector('.cl-tabs');
    var count = root.querySelector('[data-case-count]');
    if (count) count.textContent = items.length + '건';
    if (!items.length) { grid.innerHTML = '<p class="cl-empty">등록된 사례가 없습니다.</p>'; tabBox.innerHTML = ''; return; }
    var active = '';
    try { active = new URLSearchParams(location.search).get('fund') || ''; } catch (e) {}
    if (active && !items.some(function (c) { return c.fund === active; })) active = '';
    tabBox.innerHTML = tabs(items, true, active);
    grid.innerHTML = items.map(fullCard).join('');
    filterTo(root, '.cs-card', active);
    tabBox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]'); if (b) filterTo(root, '.cs-card', b.getAttribute('data-f'));
    });
    // 메인에서 넘어온 #case-아이디 로 스크롤
    if (location.hash) {
      var t = document.getElementById(location.hash.slice(1));
      if (t) { filterTo(root, '.cs-card', ''); setTimeout(function () { t.scrollIntoView({ block: 'start' }); }, 60); }
    }
  }

  /* ───────── 자금별 페이지 ───────── */
  function renderFund(root, items) {
    var key = root.getAttribute('data-fund');
    var rows = items.filter(function (c) { return c.fund === key; });
    if (!rows.length) { root.hidden = true; return; }
    var grid = root.querySelector('.fc-grid');
    grid.style.setProperty('--cols', String(Math.min(rows.length, 3)));
    grid.innerHTML = rows.map(fullCard).join('');
    var more = root.querySelector('.fc-more');
    if (more) more.href = './cases.html?fund=' + key;
    var cnt = root.querySelector('[data-fund-count]');
    if (cnt) cnt.textContent = rows.length;
  }

  function boot() {
    var mains = document.querySelectorAll('[data-cases="main"]');
    var lists = document.querySelectorAll('[data-cases="list"]');
    var funds = document.querySelectorAll('[data-cases="fund"]');
    if (!mains.length && !lists.length && !funds.length) return;
    load().then(function (items) {
      mains.forEach(function (r) { renderMain(r, items); });
      lists.forEach(function (r) { renderList(r, items); });
      funds.forEach(function (r) { renderFund(r, items); });
      document.querySelectorAll('[data-case-note]').forEach(function (n) { n.textContent = NOTE; });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
