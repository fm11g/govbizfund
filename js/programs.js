/* =====================================================================
   진행 중인 정책자금 — data/programs.json (홈페이지 관리자 「진행 중인 정책자금」 · 숏폼 공장이 저장)
     · [data-programs]            카드 자리 (data-limit=0 이면 전부, data-tabs 면 자금 종류 탭)
     · [data-programs-section]    data-hide-empty 면 진행 중 공고가 없을 때 섹션째 숨김
     · [data-exclude-current]     오늘의 랜딩에서 지금 보고 있는 공고는 빼고
   접수 마감 시각(deadline)이 지나면 화면에서 바로 사라집니다 (30초마다 다시 확인).
   ===================================================================== */
(function () {
  'use strict';
  var FUND = { operating: '운전자금', facility: '시설자금', export: '수출자금', refinance: '대환대출', startup: '창업·기술자금' };
  var REL_RE = /^\.\/[A-Za-z0-9._\-\/?=&#]+$/;
  var HTTPS_RE = /^https:\/\/[^\s"'<>]+$/;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function end(p) { return p.deadline || p.until || null; }
  function live(p, now) { var e = end(p); return !p.hidden && (!e || Date.parse(e) > now); }
  function kst(iso) {
    var d = new Date(Date.parse(iso) + 9 * 3600e3);
    var w = '일월화수목금토'.charAt(d.getUTCDay());
    return d.getUTCFullYear() + '.' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '.' + ('0' + d.getUTCDate()).slice(-2) + '(' + w + ') ' + ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2);
  }
  function dday(p, now) {
    if (!p.deadline) return { t: '상시 접수', cls: 'is-always' };
    var ms = Date.parse(p.deadline) - now, d = Math.floor(ms / 864e5);
    if (d >= 1) return { t: 'D-' + d, cls: d <= 3 ? 'is-soon' : '' };
    var h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    return { t: h > 0 ? '오늘 마감 · ' + h + '시간 ' + m + '분' : m + '분 남음', cls: 'is-soon' };
  }
  function card(p, now) {
    var dd = dday(p, now);
    var row = function (k, v) { return v ? '<div><dt>' + k + '</dt><dd>' + esc(v) + '</dd></div>' : ''; };
    var go = REL_RE.test(p.landing || '') ? p.landing : (REL_RE.test(p.post || '') ? p.post : '#fundForm');
    if (go === '#fundForm' && !document.getElementById('fundForm')) go = './contact.html';
    return '<article class="pg-card" data-end="' + esc(end(p) || '') + '">' +
      '<div class="pg-top"><span class="pg-fund">' + esc(FUND[p.fund] || '정책자금') + '</span><span class="pg-dday ' + dd.cls + '">' + esc(dd.t) + '</span></div>' +
      '<h3>' + esc(p.name) + '</h3>' + (p.agency ? '<p class="pg-agency">' + esc(p.agency) + '</p>' : '') +
      '<dl class="pg-meta">' + row('한도', p.amount) + row('금리', p.rate) + row('대상', p.target) + row('접수', p.period) + '</dl>' +
      (p.deadline ? '<p class="pg-end">마감 ' + esc(kst(p.deadline)) + '</p>' : '') +
      '<div class="pg-acts"><a class="go" href="' + esc(go) + '">내 조건 무료 확인</a>' + (HTTPS_RE.test(p.url || '') ? '<a class="src" href="' + esc(p.url) + '" target="_blank" rel="noopener">공고 원문</a>' : '') + '</div>' +
      '</article>';
  }

  var data = null, current = null, tab = '';
  function render() {
    if (!data) return;
    var now = Date.now();
    var items = data.filter(function (p) { return live(p, now); }).sort(function (a, b) {
      var ea = a.deadline ? Date.parse(a.deadline) : Infinity, eb = b.deadline ? Date.parse(b.deadline) : Infinity;
      return ea - eb;
    });
    document.querySelectorAll('[data-programs]').forEach(function (box) {
      var rows = items;
      if (box.hasAttribute('data-exclude-current') && current) rows = rows.filter(function (p) { return p.code !== current; });
      if (box.hasAttribute('data-tabs') && tab) rows = rows.filter(function (p) { return p.fund === tab; });
      var lim = Number(box.getAttribute('data-limit') || 0);
      if (lim > 0) rows = rows.slice(0, lim);
      box.style.setProperty('--cols', String(Math.max(1, Math.min(3, rows.length))));
      box.innerHTML = rows.length ? rows.map(function (p) { return card(p, now); }).join('')
        : '<p class="pg-empty">지금 접수 중인 공고가 없습니다.<br>새 공고가 열리면 이곳에 바로 올려 드립니다.</p>';
      var sec = box.closest('[data-programs-section]');
      if (sec && sec.hasAttribute('data-hide-empty')) sec.hidden = !rows.length;
    });
    document.querySelectorAll('[data-programs-count]').forEach(function (n) { n.textContent = String(tab ? items.filter(function (p) { return p.fund === tab; }).length : items.length); });
    var tabs = document.querySelector('[data-programs-tabs]');
    if (tabs && !tabs.childElementCount) {
      var keys = Object.keys(FUND).filter(function (k) { return items.some(function (p) { return p.fund === k; }); });
      if (keys.length > 1) {
        tabs.innerHTML = '<button type="button" class="on" data-k="">전체</button>' + keys.map(function (k) { return '<button type="button" data-k="' + k + '">' + FUND[k] + '</button>'; }).join('');
        tabs.addEventListener('click', function (e) {
          var b = e.target.closest('button'); if (!b) return;
          tab = b.getAttribute('data-k') || '';
          tabs.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
          render();
        });
      }
    }
  }

  function boot() {
    if (!document.querySelector('[data-programs]')) return;
    fetch('./data/programs.json?v=' + Math.floor(Date.now() / 6e4), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : { items: [] }; })
      .catch(function () { return { items: [] }; })
      .then(function (j) {
        data = Array.isArray(j && j.items) ? j.items.filter(function (p) { return p && p.name; }) : [];
        render();
        setInterval(render, 30000);   // 마감 시각이 지나면 30초 안에 사라짐
      });
  }
  window.TF_PROGRAMS = { setCurrent: function (code) { current = code; render(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
