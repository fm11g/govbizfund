/* =====================================================================
   #fundForm — 무료 자금 진단 신청 폼
   Supabase 의 INSERT 전용 뷰(fund_requests)로 저장합니다. anon 키로는 조회가 불가능합니다.
   ===================================================================== */
(function () {
  'use strict';


  /* 연매출 4억 이상만 접수합니다. DB(sql/04_policy_fund.sql)도 같은 목록만 허용합니다. */
  var ALLOWED_SALES = ['4억 ~ 10억', '10억 ~ 30억', '30억 ~ 50억', '50억 이상'];

  /* 순서대로 확인합니다. 첫 번째로 비어 있는 항목의 안내가 버튼에 표시됩니다. */
  var RULES = [
    { name: 'name', msg: '성함을 입력해 주세요', test: function (v) { return /^[가-힣a-zA-Z\s]{2,20}$/.test(v.trim()); } },
    { name: 'phone', msg: '연락처를 정확히 입력해 주세요', test: function (v) { return /^01[016789][0-9]{7,8}$/.test(v.replace(/[^0-9]/g, '')); } },
    { name: 'company_name', msg: '회사명을 입력해 주세요', test: function (v) { return v.trim().length >= 1; } },
    { name: 'region', msg: '지역을 선택해 주세요' },
    { name: 'industry', msg: '업태를 선택해 주세요' },
    { name: 'biz_years', msg: '사업 연혁을 선택해 주세요' },
    { name: 'annual_sales', msg: '연매출을 선택해 주세요 (4억 이상만 신청 가능)', test: function (v) { return ALLOWED_SALES.indexOf(v) > -1; } },
    { name: 'credit_score', msg: '신용점수를 선택해 주세요' },
    { name: 'overdue', msg: '연체·체납 여부를 선택해 주세요' },
    { name: 'fund_type', msg: '필요한 자금을 선택해 주세요' },
    { name: 'call_time', msg: '통화 가능 시간을 선택해 주세요' },
    { name: 'agree', msg: '개인정보 수집·이용에 동의해 주세요', test: function (_v, el) { return el.checked; } }
  ];

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function utm() {
    var out = {};
    try {
      var sp = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(function (k) {
        var v = sp.get(k); if (v) out[k] = v.slice(0, 200);
      });
      if (Object.keys(out).length) sessionStorage.setItem('tf_utm', JSON.stringify(out));
      else out = JSON.parse(sessionStorage.getItem('tf_utm') || '{}');
    } catch (e) {}
    return out;
  }

  function init(root) {
    var form = root.querySelector('form');
    var btn = root.querySelector('.ff-submit');
    var note = root.querySelector('.ff-note');
    var overlay = root.querySelector('.ff-terms');
    if (!form || !btn) return;
    var busy = false;
    var UTM = utm();

    // 접수 위치 기본값: 페이지 제목
    var loc = form.querySelector('[name="reception_location"]');
    if (loc && !loc.value) loc.value = (document.body.getAttribute('data-form-location') || document.title.split('|')[0]).trim();

    // 페이지에서 미리 고를 자금 종류 (예: 시설자금 페이지)
    var preset = root.getAttribute('data-fund');
    if (preset) {
      var sel = form.querySelector('[name="fund_type"]');
      if (sel) sel.value = preset;
    }

    var phone = form.querySelector('[name="phone"]');
    phone.addEventListener('input', function () { phone.value = phone.value.replace(/[^0-9]/g, '').slice(0, 11); });

    function firstError() {
      for (var i = 0; i < RULES.length; i++) {
        var r = RULES[i];
        var el = form.querySelector('[name="' + r.name + '"]');
        if (!el) continue;
        var v = el.value || '';
        var ok = r.test ? r.test(v, el) : v !== '';
        if (!ok) return { rule: r, el: el };
      }
      return null;
    }

    function refresh() {
      if (busy) return;
      var err = firstError();
      btn.disabled = !!err;
      btn.textContent = err ? err.rule.msg : '무료 자금 진단 신청하기';
      root.classList.toggle('is-ready', !err);
    }

    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    refresh();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var err = firstError();
      if (err) { err.el.focus(); refresh(); return; }

      var CFG = window.TODAY_FUND || {};
      var SB = CFG.supabase || {};
      if (!SB.url || /YOUR-PROJECT/.test(SB.url) || !SB.anonKey || /YOUR_/.test(SB.anonKey)) {
        note.textContent = '상담 접수 설정이 아직 완료되지 않았습니다. js/config.js 의 Supabase 정보를 입력하세요.';
        note.className = 'ff-note err';
        return;
      }

      var fd = new FormData(form);
      var payload = {
        name: String(fd.get('name') || '').trim(),
        phone: String(fd.get('phone') || '').replace(/[^0-9]/g, ''),
        company_name: String(fd.get('company_name') || '').trim(),
        region: fd.get('region'),
        industry: fd.get('industry'),
        biz_years: fd.get('biz_years'),
        annual_sales: fd.get('annual_sales'),
        credit_score: fd.get('credit_score'),
        overdue: fd.get('overdue'),
        fund_type: fd.get('fund_type'),
        call_time: fd.get('call_time'),
        message: String(fd.get('message') || '').trim().slice(0, 1000) || null,
        agree_privacy: true,
        source: '무료 자금 진단',
        reception_location: String(fd.get('reception_location') || '').slice(0, 80),
        referrer: document.referrer ? document.referrer.slice(0, 500) : null,
        page_url: location.href.slice(0, 500),
        user_agent: navigator.userAgent.slice(0, 300),
        utm: UTM,
        request_id: uuid()
      };
      // 유입 추적: 숏폼 고유 코드 · 채널 · 첫/마지막 유입 (js/site.js TF_TRACK)
      try {
        var tr = window.TF_TRACK ? window.TF_TRACK.payload() : null;
        if (tr) for (var tk in tr) payload[tk] = tr[tk];
      } catch (eTr) {}

      busy = true;
      btn.disabled = true;
      btn.textContent = '접수 중입니다…';
      note.textContent = '';

      fetch(SB.url.replace(/\/$/, '') + '/rest/v1/' + (SB.table || 'fund_requests'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SB.anonKey,
          Authorization: 'Bearer ' + SB.anonKey,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(payload)
      })
        .then(function (r) {
          if (!r.ok) return r.text().then(function (t) { throw new Error(t || String(r.status)); });
          try { if (window.gtag) gtag('event', 'generate_lead', { form: 'fund_diagnosis' }); } catch (e1) {}
          try { if (window.fbq) fbq('track', 'Lead'); } catch (e2) {}
          try { if (window.karrotPixel) karrotPixel.track('SubmitApplication'); } catch (e3) {}
          try { sessionStorage.setItem('tf_done_name', payload.name); } catch (e4) {}
          var next = CFG.completePage || './complete.html';
          location.href = next;
        })
        .catch(function (ex) {
          busy = false;
          var m = String(ex && ex.message || '');
          note.textContent = /SALES_NOT_ELIGIBLE/.test(m) ? '연매출 4억 이상 사업자만 신청할 수 있습니다.'
            : /INVALID_PHONE/.test(m) ? '연락처 형식을 다시 확인해 주세요.'
            : /INVALID_NAME/.test(m) ? '성함을 다시 확인해 주세요.'
            : '일시적인 오류로 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.';
          note.className = 'ff-note err';
          refresh();
        });
    });

    // 개인정보 동의 자세히 보기
    root.addEventListener('click', function (e) {
      if (e.target.closest('.ff-terms-open')) { e.preventDefault(); overlay.hidden = false; document.documentElement.style.overflow = 'hidden'; }
      if (e.target.closest('[data-terms-close]') || e.target === overlay) { overlay.hidden = true; document.documentElement.style.overflow = ''; }
    });
  }

  function initAll() {
    document.querySelectorAll('[data-fund-form]').forEach(function (el) {
      if (el.dataset.ffBound) return;
      el.dataset.ffBound = '1';
      init(el);
    });
  }

  /* 게시글 상세처럼 폼 마크업이 없는 페이지: [data-fund-form-mount] 자리에 partials/fund-form.html 을 불러옵니다 */
  function boot() {
    var mounts = document.querySelectorAll('[data-fund-form-mount]');
    if (!mounts.length || !window.fetch) return initAll();
    fetch('./partials/fund-form.html', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (html) {
        if (html) mounts.forEach(function (m, i) {
          if (i > 0) return m.remove();            // 한 페이지에 폼은 하나만
          var box = document.createElement('div');
          box.innerHTML = html;
          var sec = box.querySelector('[data-fund-form]');
          if (!sec) return;
          var preset = m.getAttribute('data-fund');
          if (preset) sec.setAttribute('data-fund', preset);
          m.replaceWith(sec);
        });
        initAll();
        if (location.hash === '#fundForm') { var t = document.getElementById('fundForm'); if (t) t.scrollIntoView(); }
      })
      .catch(initAll);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
