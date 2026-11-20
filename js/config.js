/* =====================================================================
   오늘의 정책자금 — 사이트 공통 설정
   이 파일 하나만 고치면 헤더·푸터·상담폼·플로팅 버튼에 모두 반영됩니다.
   ===================================================================== */
window.TODAY_FUND = {
  brand: '오늘의 정책자금',

  /* 상담은 홈페이지 신청 폼(DB)으로만 받습니다. 전화 · 이메일 · 카카오 연결은 화면에 노출하지 않습니다. */

  /* 푸터 사업자 정보 — 실제 정보로 교체하세요 */
  company: {
    name: '오늘의 정책자금',
    ceo: '최지웅',
    bizNo: '643-77-00532',
    address: '서울시 영등포구 선유로 53길 22 502호',
    extra: ''             
  },

  /* 상담 신청 저장 (Supabase) — anon(public) 키만 넣습니다. service_role 키는 절대 넣지 마세요. */
  supabase: {
    url: 'https://raqnzvummwqygjsnngcz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhcW56dnVtbXdxeWdqc25uZ2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMDA2ODMsImV4cCI6MjExMDY3NjY4M30.owBQDWE5ZpwqjtYKQj16DRWVp4P2knuNiXyaY3WJ9r0',
    table: 'fund_requests'   // sql/05_policy_fund.sql 이 만드는 INSERT 전용 뷰
  },

  /* 신청 완료 후 이동할 페이지 (광고 전환 추적용) */
  completePage: './complete.html'
};
