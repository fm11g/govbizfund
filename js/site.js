/* =====================================================================
   유입 추적 (TF_TRACK)
   · 숏폼 공장 추적 링크  go.html?c=코드&ch=yt|ytc|ig|igc|igp  → 코드 · 채널
   · utm_source / utm_medium / 리퍼러로 채널 판정 (검색 · 유튜브 · 인스타 · 광고 …)
   · 숏폼에서 만든 정보글(body data-short-code)로 검색 유입되면 그 코드 + 채널 'seo'
   · 첫 유입 / 마지막 유입을 30일 보관 → 신청폼이 함께 저장 (leads.track_code · channel …)
   ===================================================================== */
(function () {
  'use strict';
  var TTL = 30 * 864e5;
  var CODE_RE = /^[a-z0-9]{4,24}$/;
  var CH = { yt: 'youtube', ytc: 'youtube', ytd: 'youtube', ig: 'instagram', igc: 'instagram', igp: 'instagram', igs: 'instagram',
    fb: 'facebook', kk: 'kakao', nb: 'blog', bl: 'blog', em: 'email', ad: 'ads', sp: 'factory' };
  var SRC = [
    [/youtube|youtu\.be|^yt$/i, 'youtube'], [/instagram|^ig$/i, 'instagram'], [/facebook|^fb$|meta/i, 'facebook'],
    [/kakao/i, 'kakao'], [/blog/i, 'blog'], [/naver/i, 'naver'], [/google|daum|bing|zum|search/i, 'seo'],
    [/factory|shorts/i, 'factory'], [/mail|newsletter/i, 'email']
  ];
  function get(k) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v && Date.now() - (v.ts || 0) < TTL ? v : null; } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }

  var sp; try { sp = new URLSearchParams(location.search); } catch (e) { sp = { get: function () { return null; } }; }
  var code = String(sp.get('c') || '').toLowerCase();
  if (!CODE_RE.test(code)) code = '';
  var chParam = String(sp.get('ch') || '').toLowerCase();
  var us = sp.get('utm_source') || '', um = sp.get('utm_medium') || '', uc = sp.get('utm_campaign') || '';
  var ref = document.referrer || '';
  var refHost = host(ref), selfHost = location.hostname.replace(/^www\./, '');
  var external = refHost && refHost !== selfHost;
  var pageCode = String((document.body && document.body.getAttribute('data-short-code')) || '').toLowerCase();
  if (!CODE_RE.test(pageCode)) pageCode = '';
  var path = (location.pathname.split('/').pop() || 'index.html') + (location.hash && location.hash.length < 40 ? location.hash : '');

  function refChannel(h) {
    if (/(^|\.)google\.|(^|\.)bing\.com|(^|\.)daum\.net|(^|\.)zum\.com|search\.naver\.com|(^|\.)search\./.test(h)) return 'seo';
    if (/blog\.naver\.com|tistory\.com|brunch\.co\.kr/.test(h)) return 'blog';
    if (/naver\.com/.test(h)) return 'seo';
    if (/youtube\.com|youtu\.be/.test(h)) return 'youtube';
    if (/instagram\.com/.test(h)) return 'instagram';
    if (/facebook\.com|fb\.me|threads\.net/.test(h)) return 'facebook';
    if (/kakao/.test(h)) return 'kakao';
    return 'referral';
  }

  var channel = '';
  if (CH[chParam]) channel = CH[chParam];
  else if (/cpc|paid|ads?$|display/i.test(um) || sp.get('gclid') || sp.get('fbclid') && /paid/i.test(um)) channel = 'ads';
  else if (us) { for (var i = 0; i < SRC.length; i++) if (SRC[i][0].test(us)) { channel = SRC[i][1]; break; } if (!channel) channel = 'referral'; }
  else if (external) channel = refChannel(refHost);

  // 정보글로 바로 들어온 경우(검색 · 외부) → 그 글의 숏폼 코드
  if (!code && pageCode && (channel || !ref)) { code = pageCode; if (!channel) channel = 'seo'; } // 리퍼러 없는 검색 앱 유입 포함
  if (!channel && code) channel = 'factory';

  var now = new Date().toISOString();
  var first = get('tf_ft'), last = get('tf_lt');
  if (channel || code) {
    var t = { ts: Date.now(), at: now, channel: channel || 'direct', code: code || null, source: us || null, medium: um || null,
      campaign: uc || null, ch: chParam || null, ref: external ? ref.slice(0, 200) : null, landing: path };
    if (!first) put('tf_ft', first = t);
    put('tf_lt', last = t);
  } else if (!first) {
    var d = { ts: Date.now(), at: now, channel: 'direct', code: null, ref: null, landing: path };
    put('tf_ft', first = d); put('tf_lt', last = d);
  }
  // 사이트 안에서 숏폼 정보글을 읽은 경우 — 유입 채널은 그대로, 코드만 보조로 기억
  if (pageCode) { try { sessionStorage.setItem('tf_viewed_code', pageCode); } catch (e) {} }

  function strip(t) { if (!t) return {}; var o = {}; for (var k in t) if (k !== 'ts' && t[k] != null) o[k] = t[k]; return o; }
  window.TF_TRACK = {
    payload: function () {
      var f = get('tf_ft') || first, l = get('tf_lt') || last, viewed = '';
      try { viewed = sessionStorage.getItem('tf_viewed_code') || ''; } catch (e) {}
      var tc = (l && l.code) || (f && f.code) || (CODE_RE.test(viewed) ? viewed : '') || null;
      var ch = (l && l.code ? l.channel : null) || (f && f.code ? f.channel : null) || (l && l.channel) || (tc ? 'blog' : 'direct');
      return {
        track_code: tc, channel: ch,
        landing_page: String((f && f.landing) || path).slice(0, 300),
        first_touch: strip(f), last_touch: strip(l)
      };
    }
  };
})();

/* =====================================================================
   오늘의 정책자금 — 헤더 · 모바일 메뉴 · 푸터 · 퀵 버튼 · 서브 비주얼
   메뉴는 data/site-menu.json (관리자 「메뉴 구성」에서 저장) 을 읽어 그립니다.
   파일을 읽지 못하면 아래 DEFAULT_MENU 를 그대로 씁니다.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.TODAY_FUND || {};
  var MENU_URL = './data/site-menu.json';
  var CACHE_KEY = 'tf_site_menu_v1';

  var DEFAULT_MENU = [
    { id: 'g-about', label: '회사소개', href: './about.html', header: true, footer: true, items: [
      { id: 'm-about', label: '회사소개', href: './about.html', newTab: false, header: true, footer: true },
      { id: 'm-ceo', label: '인사말', href: './ceo.html', newTab: false, header: true, footer: true },
      { id: 'm-vision', label: '비전', href: './vision.html', newTab: false, header: true, footer: true }
    ] },
    { id: 'g-biz', label: '정책자금 종류', href: './business.html', header: true, footer: true, items: [
      { id: 'm-biz', label: '정책자금 종류 안내', href: './business.html', newTab: false, header: true, footer: true },
      { id: 'm-operating', label: '운전자금', href: './fund-operating.html', newTab: false, header: true, footer: true },
      { id: 'm-facility', label: '시설자금', href: './fund-facility.html', newTab: false, header: true, footer: true },
      { id: 'm-export', label: '수출자금', href: './fund-export.html', newTab: false, header: true, footer: true },
      { id: 'm-refinance', label: '대환대출', href: './fund-refinance.html', newTab: false, header: true, footer: true },
      { id: 'm-startup', label: '창업·기술자금', href: './fund-startup.html', newTab: false, header: true, footer: true },
      { id: 'm-cases', label: '자금 확보 사례', href: './cases.html', newTab: false, header: true, footer: true }
    ] },
    { id: 'g-news', label: '정책자금 소식', href: './notice.html', header: true, footer: true, items: [
      { id: 'm-notice', label: '공지 · 이벤트', href: './notice.html', newTab: false, header: true, footer: true },
      { id: 'm-info', label: '정책자금 정보', href: './fund-info.html', newTab: false, header: true, footer: true }
    ] },
    { id: 'g-contact', label: '문의하기', href: './contact.html', header: true, footer: true, items: [
      { id: 'm-contact', label: '상담 신청', href: './contact.html', newTab: false, header: true, footer: true }
    ] }
  ];

  var ICON = {
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/></svg>',
    up: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>'
  };

  /* ───────── 도우미 ───────── */
  var HREF_RE = /^(\.\/|\/(?!\/)|https?:\/\/|#)[^\s"'<>`\\]*$/i;
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeHref(h) { h = String(h || ''); return HREF_RE.test(h) ? h : '#'; }
  function pageOf(href) {
    var m = String(href || '').match(/([^\/?#]+\.html)/);
    return m ? m[1] : '';
  }
  var CURRENT = (function () {
    var p = location.pathname.split('/').pop() || 'index.html';
    var alias = document.body.getAttribute('data-page'); // 상세 페이지가 속한 목록 (notice.html · fund-info.html)
    return alias || p;
  })();
  function isOn(href) { return pageOf(href) === CURRENT; }
  function groupOn(g) {
    if (isOn(g.href)) return true;
    return (g.items || []).some(function (m) { return isOn(m.href); });
  }
  function target(m) { return m.newTab ? ' target="_blank" rel="noopener"' : ''; }
  function store(get, val) {
    try {
      if (get) return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      localStorage.setItem(CACHE_KEY, JSON.stringify(val));
    } catch (e) { return null; }
  }

  /* ───────── 헤더 ───────── */
  function headerHtml(groups) {
    var hg = groups.filter(function (g) { return g.header !== false; });
    var gnb = hg.map(function (g) {
      var items = (g.items || []).filter(function (m) { return m.header !== false; });
      var sub = items.length ? '<div class="hd-sub">' + items.map(function (m) {
        return '<a href="' + esc(safeHref(m.href)) + '"' + target(m) + (isOn(m.href) ? ' class="on"' : '') + '>' + esc(m.label) + '</a>';
      }).join('') + '</div>' : '';
      return '<li' + (groupOn(g) ? ' class="on"' : '') + '><a href="' + esc(safeHref(g.href)) + '">' + esc(g.label) + '</a>' + sub + '</li>';
    }).join('');

    var mnav = hg.map(function (g) {
      var items = (g.items || []).filter(function (m) { return m.header !== false; });
      if (!items.length) return '<details><summary onclick="location.href=\'' + esc(safeHref(g.href)) + '\'">' + esc(g.label) + '</summary></details>';
      return '<details' + (groupOn(g) ? ' open' : '') + '><summary>' + esc(g.label) + '</summary><div>' + items.map(function (m) {
        return '<a href="' + esc(safeHref(m.href)) + '"' + target(m) + (isOn(m.href) ? ' class="on"' : '') + '>' + esc(m.label) + '</a>';
      }).join('') + '</div></details>';
    }).join('');

    return '' +
      '<div class="hd-in">' +
        '<a class="hd-logo" href="./index.html" aria-label="' + esc(CFG.brand || '오늘의 정책자금') + ' 홈">' +
          '<img class="lg-w" src="./img/logo-w.svg" alt="" width="196" height="38">' +
          '<img class="lg-d" src="./img/logo.svg" alt="" width="196" height="38">' +
        '</a>' +
        '<nav class="hd-gnb" aria-label="주 메뉴"><ul>' + gnb + '</ul></nav>' +
        '<div class="hd-right">' +
          '<a class="hd-cta" href="./contact.html#fundForm">무료 자금 진단</a>' +
          '<a class="hd-call" href="./contact.html#fundForm" aria-label="무료 자금 진단 신청">' + ICON.doc + '</a>' +
          '<button class="hd-burger" type="button" aria-label="메뉴 열기" aria-expanded="false"><i></i><i></i><i></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="hd-sheet" role="dialog" aria-label="전체 메뉴">' +
        '<div class="dim" data-close></div>' +
        '<div class="pane">' +
          '<div class="pane-top"><img src="./img/logo.svg" alt="' + esc(CFG.brand || '') + '"><button class="pane-x" type="button" aria-label="메뉴 닫기" data-close>✕</button></div>' +
          '<nav class="pane-nav" aria-label="모바일 메뉴">' + mnav + '</nav>' +
          '<div class="pane-foot">' +
            '<a class="p-cta" href="./contact.html#fundForm">무료 자금 진단 신청</a>' +
            '<small>상담은 신청서 접수 후 담당 전문가가 순차적으로 연락드립니다.</small>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function bindHeader(H) {
    var solidAlways = document.body.hasAttribute('data-solid-header') ||
      (!document.getElementById('subVisual') && !document.querySelector('[data-hero]'));
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      H.classList.toggle('is-solid', solidAlways || y > 40 || H.classList.contains('menu-open'));
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    H.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('.hd-burger')) { setOpen(true); }
      else if (t.closest('[data-close]')) { setOpen(false); }
      else if (t.closest('.pane a')) { setOpen(false); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    function setOpen(v) {
      H.classList.toggle('menu-open', v);
      var b = H.querySelector('.hd-burger');
      if (b) b.setAttribute('aria-expanded', v ? 'true' : 'false');
      document.documentElement.style.overflow = v ? 'hidden' : '';
    }
  }

  /* ───────── 푸터 ───────── */
  function footerHtml(groups) {
    var c = CFG.company || {};
    var cols = groups.filter(function (g) { return g.footer !== false; }).map(function (g) {
      var items = (g.items || []).filter(function (m) { return m.footer !== false; });
      return '<div><strong>' + esc(g.label) + '</strong>' + items.map(function (m) {
        return '<a href="' + esc(safeHref(m.href)) + '"' + target(m) + '>' + esc(m.label) + '</a>';
      }).join('') + '</div>';
    }).join('');
    var info = [
      ['상호', c.name || CFG.brand], ['대표', c.ceo], ['사업자등록번호', c.bizNo],
      ['주소', c.address], ['', c.extra]
    ].filter(function (r) { return r[1]; }).map(function (r) {
      return '<span>' + (r[0] ? '<b>' + esc(r[0]) + '</b>' : '') + esc(r[1]) + '</span>';
    }).join('');

    return '' +
      '<div class="ft-in">' +
        '<div class="ft-top">' +
          '<div class="ft-brand">' +
            '<img src="./img/logo-w.svg" alt="' + esc(CFG.brand || '') + '" width="210" height="42">' +
            '<p>연매출 4억 이상 사업자를 위한 정책자금 컨설팅. 운전 · 시설 · 수출 · 대환 · 창업자금까지 매출 규모에 맞는 자금을 찾아 함께합니다.</p>' +
            '<div class="ft-contact"><a class="apply" href="./contact.html#fundForm">무료 자금 진단 신청 →</a><span>상담은 신청서로만 접수합니다.</span></div>' +
          '</div>' +
          '<nav class="ft-menu" aria-label="푸터 메뉴">' + cols + '</nav>' +
        '</div>' +
        '<div class="ft-info">' + info + '</div>' +
        '<p class="ft-notice"><strong>안내</strong> · ' + esc(c.name || CFG.brand || '') + '은(는) 정부·공공기관이 아닌 민간 경영컨설팅 기업입니다. ' +
          '정책자금의 최종 승인 여부와 한도·금리는 각 운용기관의 심사 결과에 따라 결정되며, 당사는 승인을 보장하지 않습니다. ' +
          '정부기관 사칭, 서류 위조, 승인 대가의 부당한 수수료 요구 등 불법 브로커 행위를 하지 않습니다.</p>' +
        '<div class="ft-bottom">' +
          '<span>© ' + new Date().getFullYear() + ' ' + esc(c.name || CFG.brand || '') + '. All rights reserved.</span>' +
          '<nav aria-label="약관"><a class="strong" href="./privacy.html">개인정보처리방침</a><a href="./contact.html">상담 신청</a></nav>' +
        '</div>' +
      '</div>';
  }

  /* ───────── 퀵 버튼 ───────── */
  function dockHtml() {
    return '' +
      '<div class="qd-side">' +
        '<a class="qd-btn mint" href="./contact.html#fundForm">' + ICON.doc + '자금진단</a>' +
        '<button class="qd-top" type="button" aria-label="맨 위로">' + ICON.up + '</button>' +
      '</div>' +
      '<div class="qd-bar">' +
        '<a class="apply" href="./contact.html#fundForm">' + ICON.doc + '무료 자금 진단</a>' +
      '</div>';
  }

  function bindDock(D) {
    var top = D.querySelector('.qd-top');
    if (!top) return;
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    window.addEventListener('scroll', function () {
      top.classList.toggle('show', (window.scrollY || window.pageYOffset) > 600);
    }, { passive: true });
  }

  /* ───────── 서브 비주얼 ───────── */
  function bindSubVisual(groups) {
    var V = document.getElementById('subVisual');
    if (!V) return;
    var tabs = V.querySelector('.sv-tabs[data-auto]');
    if (tabs) {
      var g = groups.filter(groupOn)[0];
      var items = g ? (g.items || []).filter(function (m) { return m.header !== false; }) : [];
      if (items.length > 1) {
        tabs.innerHTML = '<ul>' + items.map(function (m) {
          return '<li><a href="' + esc(safeHref(m.href)) + '"' + target(m) + (isOn(m.href) ? ' class="on" aria-current="page"' : '') + '>' + esc(m.label) + '</a></li>';
        }).join('') + '</ul>';
      } else tabs.remove();
    }
    if (V.dataset.bound) return;
    V.dataset.bound = '1';
    var dur = parseInt(getComputedStyle(V).getPropertyValue('--reveal-dur'), 10) || 900;
    requestAnimationFrame(function () { V.classList.add('play'); });
    setTimeout(function () { V.classList.add('in'); }, dur * 0.7);
  }

  /* ───────── 섹션 진입 표시: [data-io] 섹션에 .in 클래스를 붙입니다 (효과는 각 섹션 CSS 가 정합니다) ───────── */
  function bindIO() {
    var els = document.querySelectorAll('[data-io]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); if (!en.target.hasAttribute('data-io-repeat')) io.unobserve(en.target); }
        else if (en.target.hasAttribute('data-io-repeat')) en.target.classList.remove('in');
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ───────── 그리기 ───────── */
  function mount(groups) {
    var H = document.getElementById('siteHeader');
    if (!H) { H = document.createElement('header'); H.id = 'siteHeader'; document.body.insertBefore(H, document.body.firstChild); }
    var wasOpen = H.classList.contains('menu-open');
    H.innerHTML = headerHtml(groups);
    if (wasOpen) H.classList.add('menu-open');
    if (!H.dataset.bound) { H.dataset.bound = '1'; bindHeader(H); }

    var F = document.getElementById('siteFooter');
    if (!F) { F = document.createElement('footer'); F.id = 'siteFooter'; document.body.appendChild(F); }
    F.innerHTML = footerHtml(groups);

    bindSubVisual(groups);
  }

  function valid(d) { return d && Array.isArray(d.groups) && d.groups.length ? d.groups : null; }

  function init() {
    var cached = valid(store(true));
    var groups = cached || DEFAULT_MENU;
    mount(groups);

    var D = document.getElementById('quickDock');
    if (!D) { D = document.createElement('div'); D.id = 'quickDock'; document.body.appendChild(D); }
    D.innerHTML = dockHtml();
    bindDock(D);
    bindIO();

    if (!window.fetch) return;
    fetch(MENU_URL + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var fresh = valid(d);
        if (!fresh) return;
        if (JSON.stringify(fresh) !== JSON.stringify(groups)) mount(fresh);
        store(false, d);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.TodayFundSite = { esc: esc };
})();

/* =====================================================================
   오늘의 이벤트 알림 (모든 페이지 · today.html 제외)
   data/landings.json 의 가장 최근 진행 중 랜딩을 화면 왼쪽 아래에 카운트다운과 함께 띄웁니다.
   마감 시각이 지나면 사라지고, [닫기]를 누르면 이번 방문 동안 다시 안 뜹니다.
   ===================================================================== */
(function () {
  'use strict';
  if (/today\.html$/.test(location.pathname) || !window.fetch) return;
  var KEY = 'tf_evbar_closed';
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  fetch('./data/landings.json?v=' + Math.floor(Date.now() / 6e4), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    .then(function (j) {
      var items = (j && j.items) || {}, now = Date.now();
      var l = Object.keys(items).map(function (k) { return items[k]; })
        .filter(function (x) { var e = x.deadline || x.expiresAt; return x && !x.hidden && x.deadline && (!e || Date.parse(e) > now); })
        .sort(function (a, b) { return Date.parse(a.deadline) - Date.parse(b.deadline); })[0];
      if (!l) return;
      var st = document.createElement('style');
      st.textContent = '#evBar{position:fixed;left:22px;bottom:28px;z-index:790;display:flex;align-items:center;gap:12px;max-width:min(440px,calc(100vw - 120px));padding:12px 12px 12px 16px;border-radius:18px;background:linear-gradient(135deg,#0b7a70,#13b5a3);color:#fff;box-shadow:0 20px 44px -18px rgba(11,122,112,.65);font-family:Pretendard,"Noto Sans KR",sans-serif;animation:evIn .5s ease both}' +
        '#evBar a{display:grid;gap:3px;color:#fff;text-decoration:none;min-width:0}' +
        '#evBar em{font-style:normal;font-size:12px;font-weight:800;color:#bff5ec;letter-spacing:.04em}' +
        '#evBar strong{font-size:15px;font-weight:800;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
        '#evBar .ev-cd{flex:0 0 auto;font-weight:900;font-size:15px;font-variant-numeric:tabular-nums;background:#fff;color:#0b7a70;padding:8px 10px;border-radius:12px}' +
        '#evBar button{flex:0 0 auto;width:28px;height:28px;border:0;border-radius:50%;background:rgba(255,255,255,.2);color:#fff;font-size:16px;cursor:pointer}' +
        '@keyframes evIn{from{opacity:0;transform:translateY(16px)}}' +
        '@media (max-width:760px){#evBar{left:10px;right:10px;max-width:none;bottom:calc(84px + env(safe-area-inset-bottom))}}' +
        '@media (prefers-reduced-motion:reduce){#evBar{animation:none}}';
      document.head.appendChild(st);
      var bar = document.createElement('aside');
      bar.id = 'evBar'; bar.setAttribute('aria-label', '진행 중인 이벤트');
      bar.innerHTML = '<a href="./today.html?c=' + encodeURIComponent(l.code) + '"><em>진행 중인 이벤트 · 마감까지</em><strong>' + esc(l.title || l.headline) + '</strong></a><span class="ev-cd" aria-live="off"></span><button type="button" aria-label="닫기">×</button>';
      document.body.appendChild(bar);
      var cd = bar.querySelector('.ev-cd'), end = Date.parse(l.deadline);
      function tick() {
        var ms = end - Date.now();
        if (ms <= 0) { clearInterval(t); bar.remove(); return; }
        var s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
        cd.textContent = (d ? 'D-' + d + ' ' : '') + ('0' + Math.floor(s % 86400 / 3600)).slice(-2) + ':' + ('0' + Math.floor(s % 3600 / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2);
      }
      var t = setInterval(tick, 1000); tick();
      bar.querySelector('button').addEventListener('click', function () { clearInterval(t); bar.remove(); try { sessionStorage.setItem(KEY, '1'); } catch (e) {} });
    });
})();
