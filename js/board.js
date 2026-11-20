/* =====================================================================
   정책자금 소식 — 공지 · 이벤트(board: notice) · 정책자금 정보(board: info)
   분류가 「이벤트」인 글은 eventStart ~ eventEnd 로 예정 · 진행중 · 종료를 자동 표시합니다.
   data/notice.json (관리자 「게시판」에서 저장) 을 읽어 목록을 그립니다.
     · [data-board-list="notice|info"]    게시판 목록 (검색 · 분류 · 페이지)
     · [data-board-preview="notice|info"] 메인 미리보기 (data-limit)
   ===================================================================== */
(function () {
  'use strict';

  var URL_ = './data/notice.json';
  var cache = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function dot(d) { return String(d || '').replace(/-/g, '.'); }
  function boardOf(n) { return n.board === 'info' ? 'info' : 'notice'; }
  function linkOf(n) {
    var l = String(n.link || ('./' + n.slug + '.html'));
    return /^(\.\/|https?:\/\/)/i.test(l) ? l : '#';
  }
  function linkAttr(n) { return n.openExternal ? ' target="_blank" rel="noopener"' : ''; }
  function today() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
  function eventState(n) {
    if (n.category !== '이벤트') return '';
    var t = today();
    if (n.eventStart && t < n.eventStart) return 'soon';
    if (n.eventEnd && t > n.eventEnd) return 'end';
    return 'on';
  }
  var STATE_LABEL = { soon: '예정', on: '진행중', end: '종료' };
  function stateChip(n) {
    var s = eventState(n);
    return s ? '<b class="ev ev-' + s + '">' + STATE_LABEL[s] + '</b>' : '';
  }
  function period(n) {
    if (n.category !== '이벤트' || (!n.eventStart && !n.eventEnd)) return '';
    return '<small class="per">' + esc(dot(n.eventStart) || '상시') + ' ~ ' + esc(dot(n.eventEnd) || '') + '</small>';
  }
  function isNew(n) {
    var t = Date.parse(n.date);
    return t && (Date.now() - t) < 7 * 864e5;
  }

  function load() {
    if (cache) return cache;
    cache = (window.fetch ? fetch(URL_ + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }) : Promise.resolve(null))
      .then(function (d) { return d && Array.isArray(d.items) ? d.items.filter(function (n) { return n && !n.hidden; }) : []; })
      .catch(function () { return []; });
    return cache;
  }

  /* ───────── 게시판 목록 ───────── */
  function list(root) {
    var board = root.getAttribute('data-board-list');
    var per = Number(root.getAttribute('data-per') || (board === 'info' ? 9 : 10));
    var state = { q: '', cat: '', page: 1 };
    var box = root.querySelector('.bd-items');
    var pager = root.querySelector('.bd-pager');
    var count = root.querySelector('.bd-count');
    var search = root.querySelector('.bd-search input');
    var cats = root.querySelector('.bd-cats');
    var all = [];

    try {
      var sp = new URLSearchParams(location.search);
      state.cat = sp.get('cat') || '';
      state.q = sp.get('q') || '';
      if (search) search.value = state.q;
    } catch (e) {}

    function filtered() {
      var q = state.q.trim().toLowerCase();
      return all.filter(function (n) {
        if (state.cat && n.category !== state.cat) return false;
        if (q && (n.title + ' ' + (n.excerpt || '')).toLowerCase().indexOf(q) < 0) return false;
        return true;
      });
    }

    function render() {
      var rows = filtered();
      var last = Math.max(1, Math.ceil(rows.length / per));
      if (state.page > last) state.page = last;
      var slice = rows.slice((state.page - 1) * per, state.page * per);
      if (count) count.textContent = '전체 ' + rows.length + '건';

      if (!slice.length) {
        box.innerHTML = '<div class="bd-empty">' + (all.length ? '검색 결과가 없습니다.' : '아직 등록된 글이 없습니다.') + '</div>';
      } else if (board === 'info') {
        box.innerHTML = '<ul class="bd-cards">' + slice.map(function (n) {
          return '<li><a href="' + esc(linkOf(n)) + '"' + linkAttr(n) + '>' +
            '<div class="th">' + (n.img ? '<img src="' + esc(n.img) + '" alt="" loading="lazy">' : '<span class="ph">오늘의<br>정책자금</span>') +
              (n.category ? '<em>' + esc(n.category) + '</em>' : '') + '</div>' +
            '<div class="tx"><strong>' + (n.pinned ? '<i class="pin">추천</i>' : '') + esc(n.title) + '</strong>' +
            '<p>' + esc(n.excerpt || '') + '</p><time>' + esc(dot(n.date)) + '</time></div></a></li>';
        }).join('') + '</ul>';
      } else {
        var start = rows.length - (state.page - 1) * per;
        box.innerHTML = '<ul class="bd-rows">' + slice.map(function (n, i) {
          return '<li' + (n.pinned ? ' class="pinned"' : '') + '><a href="' + esc(linkOf(n)) + '"' + linkAttr(n) + '>' +
            '<span class="no">' + (n.pinned ? '<i>중요</i>' : (start - i)) + '</span>' +
            '<span class="t">' + (n.category ? '<em class="cat' + (n.category === '이벤트' ? ' is-ev' : '') + '">' + esc(n.category) + '</em>' : '') + stateChip(n) + esc(n.title) + (isNew(n) ? '<b class="new">N</b>' : '') + period(n) + '</span>' +
            '<time>' + esc(dot(n.date)) + '</time></a></li>';
        }).join('') + '</ul>';
      }

      if (pager) {
        var html = '';
        if (last > 1) {
          html += '<button type="button" data-p="' + Math.max(1, state.page - 1) + '" aria-label="이전"' + (state.page === 1 ? ' disabled' : '') + '>‹</button>';
          for (var p = 1; p <= last; p++) html += '<button type="button" data-p="' + p + '"' + (p === state.page ? ' class="on" aria-current="page"' : '') + '>' + p + '</button>';
          html += '<button type="button" data-p="' + Math.min(last, state.page + 1) + '" aria-label="다음"' + (state.page === last ? ' disabled' : '') + '>›</button>';
        }
        pager.innerHTML = html;
      }
    }

    function renderCats() {
      if (!cats) return;
      var seen = [];
      all.forEach(function (n) { if (n.category && seen.indexOf(n.category) < 0) seen.push(n.category); });
      if (!seen.length) { cats.innerHTML = ''; return; }
      cats.innerHTML = ['<button type="button" data-cat=""' + (!state.cat ? ' class="on"' : '') + '>전체</button>'].concat(seen.map(function (c) {
        return '<button type="button" data-cat="' + esc(c) + '"' + (state.cat === c ? ' class="on"' : '') + '>' + esc(c) + '</button>';
      })).join('');
    }

    root.addEventListener('click', function (e) {
      var p = e.target.closest('[data-p]');
      if (p && !p.disabled) { state.page = Number(p.getAttribute('data-p')); render(); root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      var c = e.target.closest('[data-cat]');
      if (c) { state.cat = c.getAttribute('data-cat'); state.page = 1; renderCats(); render(); }
    });
    if (search) {
      var t;
      search.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { state.q = search.value; state.page = 1; render(); }, 180); });
      var f = search.closest('form');
      if (f) f.addEventListener('submit', function (e) { e.preventDefault(); state.q = search.value; state.page = 1; render(); });
    }

    box.innerHTML = '<div class="bd-empty">불러오는 중입니다…</div>';
    load().then(function (items) {
      all = items.filter(function (n) { return boardOf(n) === board; });
      renderCats();
      render();
    });
  }

  /* ───────── 메인 미리보기 ───────── */
  function preview(root) {
    var board = root.getAttribute('data-board-preview');
    var limit = Number(root.getAttribute('data-limit') || 4);
    load().then(function (items) {
      var rows = items.filter(function (n) { return boardOf(n) === board && (n.showOnMain !== false); }).slice(0, limit);
      if (!rows.length) { root.innerHTML = '<li class="empty">새 소식을 준비하고 있습니다.</li>'; return; }
      root.innerHTML = rows.map(function (n) {
        return '<li><a href="' + esc(linkOf(n)) + '"' + linkAttr(n) + '>' +
          (board === 'info' && n.img ? '<span class="th"><img src="' + esc(n.img) + '" alt="" loading="lazy"></span>' : '') +
          '<span class="tx">' + (n.category ? '<em' + (n.category === '이벤트' ? ' class="is-ev"' : '') + '>' + esc(n.category) + (eventState(n) ? ' · ' + STATE_LABEL[eventState(n)] : '') + '</em>' : (n.pinned ? '<em>중요</em>' : '')) +
          '<strong>' + esc(n.title) + '</strong><time>' + esc(dot(n.date)) + '</time></span></a></li>';
      }).join('');
    });
  }

  function boot() {
    document.querySelectorAll('[data-board-list]').forEach(list);
    document.querySelectorAll('[data-board-preview]').forEach(preview);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
