// AI Magic Pointer Simulation Core

// DOM Elements
const cursorDot = document.getElementById('magic-cursor-dot');
const cursorHalo = document.getElementById('magic-cursor-halo');
const progressCircle = document.querySelector('.progress-ring__circle');
const cursorIcon = cursorHalo.querySelector('.cursor-icon');
const cards = document.querySelectorAll('.sim-card');
const popupMenu = document.getElementById('ai-popup-menu');
const popupActionsList = document.getElementById('popup-actions-list');
const responseModal = document.getElementById('ai-response-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalTitle = document.getElementById('modal-title');
const modalLoader = document.getElementById('modal-loader');
const modalResult = document.getElementById('modal-result');

// State Variables
const mouse = { x: 0, y: 0 };
const cursor = { dot: { x: 0, y: 0 }, halo: { x: 0, y: 0 } };
let activeCard = null;
let scanningTimer = null;
let isScanned = false;
let isPopupOpen = false;
let cursorState = 'idle'; // idle, scanning, recognized, interacting
let targetWidth = 48;
let targetHeight = 48;

// Magnetic Cursor State
let isMagnetic = false;
let magneticCenter = { x: 0, y: 0 };
let magneticRect = null;

// LERP (Linear Interpolation) constant for fluid movement
const LERP_FACTOR = 0.15;

// Circle path length for progress ring
const CIRCLE_LENGTH = 138.2;

// Initialize Cursor Position (Center of Screen)
mouse.x = window.innerWidth / 2;
mouse.y = window.innerHeight / 2;
cursor.dot.x = mouse.x;
cursor.dot.y = mouse.y;
cursor.halo.x = mouse.x;
cursor.halo.y = mouse.y;

// Track Mouse Movement
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Cursor Engine Loop (runs at 60fps)
function updateCursor() {
    // 1. Move Dot instantly to mouse coordinates
    cursor.dot.x = mouse.x;
    cursor.dot.y = mouse.y;
    cursorDot.style.left = `${cursor.dot.x}px`;
    cursorDot.style.top = `${cursor.dot.y}px`;

    // 2. Interpolated movement for Halo (lag/fluid feel)
    if (isMagnetic && magneticRect) {
        // Snap halo to the hovered button
        cursor.halo.x = lerp(cursor.halo.x, magneticCenter.x, LERP_FACTOR);
        cursor.halo.y = lerp(cursor.halo.y, magneticCenter.y, LERP_FACTOR);
    } else {
        // Normal cursor tracking
        cursor.halo.x = lerp(cursor.halo.x, mouse.x, LERP_FACTOR);
        cursor.halo.y = lerp(cursor.halo.y, mouse.y, LERP_FACTOR);
    }

    cursorHalo.style.left = `${cursor.halo.x}px`;
    cursorHalo.style.top = `${cursor.halo.y}px`;

    requestAnimationFrame(updateCursor);
}

// Lerp Function
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Start cursor loop
requestAnimationFrame(updateCursor);

// Action Database
const AI_ACTIONS = {
    image: [
        { label: '길 찾기 (Route)', icon: 'directions_car', action: 'find_route', color: '#4285f4' },
        { label: '비슷한 장소 검색 (Visual Search)', icon: 'travel_explore', action: 'visual_search', color: '#4285f4' },
        { label: '안내판 번역 (Translate Sign)', icon: 'translate', action: 'translate_sign', color: '#4285f4' }
    ],
    text: [
        { label: '요약하기 (Summarize)', icon: 'summarize', action: 'summarize', color: '#34a853' },
        { label: '번역하기 (Translate)', icon: 'g_translate', action: 'translate', color: '#34a853' },
        { label: '핵심 개념 설명 (Explain)', icon: 'menu_book', action: 'explain_concept', color: '#34a853' }
    ],
    weather: [
        { label: 'AI 기후 상세 보고 (Forecast Report)', icon: 'analytics', action: 'climate_report', color: '#fbbc05' },
        { label: '외출 및 옷차림 추천 (Outfit Guide)', icon: 'checkroom', action: 'outfit_guide', color: '#fbbc05' },
        { label: '야외 활동 지수 (Activity Score)', icon: 'directions_run', action: 'activity_score', color: '#fbbc05' }
    ],
    product: [
        { label: '최저가 비교 (Compare Prices)', icon: 'compare', action: 'compare_price', color: '#a142f4' },
        { label: 'AI 리뷰 분석 (Summarize Reviews)', icon: 'rate_review', action: 'review_summary', color: '#a142f4' },
        { label: '가격 추이 예측 (Price Forecast)', icon: 'trending_down', action: 'price_forecast', color: '#a142f4' }
    ],
    youtube: [
        { label: '영상 핵심 요약 (Summarize Video)', icon: 'article', action: 'youtube_summary', color: '#ea4335' },
        { label: '주요 하이라이트 추출 (Highlights)', icon: 'auto_awesome', action: 'youtube_highlights', color: '#ea4335' },
        { label: '자막 실시간 번역 (Translate Transcript)', icon: 'translate', action: 'youtube_translation', color: '#ea4335' }
    ],
    news: [
        { label: '신뢰성 검증 (Fact Check)', icon: 'fact_check', action: 'news_verification', color: '#00e5ff' },
        { label: '정치적 편향도 체크 (Bias Meter)', icon: 'balance', action: 'news_bias', color: '#00e5ff' },
        { label: '교차 보도 관련 뉴스 (Related Coverage)', icon: 'chrome_reader_mode', action: 'news_coverage', color: '#00e5ff' }
    ],
    stock: [
        { label: 'AI 30일 시세 예측 (Price Forecast)', icon: 'show_chart', action: 'stock_forecast', color: '#34a853' },
        { label: '기업 분기 실적 요약 (Earnings Summary)', icon: 'table_chart', action: 'stock_financials', color: '#34a853' },
        { label: '경쟁 빅테크사 지표 비교 (Compare Peers)', icon: 'bar_chart', action: 'stock_competitors', color: '#34a853' }
    ]
};

// Response Simulation Contents
const ACTION_RESPONSES = {
    find_route: {
        title: '길 찾기 시뮬레이션',
        html: `
            <h4>교토 글라스 에코 리조트 경로 검색 완료</h4>
            <p><strong>아라시야마 역</strong>에서 출발하는 맞춤형 최적 경로를 산출했습니다.</p>
            <div class="route-map-mock">
                <span class="route-label start-lbl">Arashiyama Stn</span>
                <span class="route-label end-lbl">Glass Resort</span>
                <div class="route-line"></div>
                <div class="route-dot start"></div>
                <div class="route-dot end"></div>
                <div class="route-pulse"></div>
            </div>
            <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
                <span class="material-symbols-rounded" style="font-size:1rem; vertical-align:middle; color:var(--success-color);">directions_walk</span> 도보 약 12분 (소나무 숲길 경유, 경사 완만)<br>
                <span class="material-symbols-rounded" style="font-size:1rem; vertical-align:middle; color:var(--primary-color);">electric_car</span> 셔틀 차량 호출 시 3분 내 도착 가능
            </p>
        `
    },
    visual_search: {
        title: '유사 장소 검색 결과',
        html: `
            <h4>글라스 돔 건축 리조트 매칭</h4>
            <p>전세계 친환경 글라스 하우스 숙소 데이터베이스 분석 결과:</p>
            <ul class="modal-list">
                <li class="modal-list-item">
                    <span>🌲 핀란드 버블 리조트 (Kakslauttanen)</span>
                    <strong style="color: var(--primary-color);">94% 일치</strong>
                </li>
                <li class="modal-list-item">
                    <span>🌴 코스타리카 바이오스피어 돔</span>
                    <strong style="color: var(--primary-color);">89% 일치</strong>
                </li>
                <li class="modal-list-item">
                    <span>🍂 캐나다 포레스트 캐빈 팟</span>
                    <strong style="color: var(--primary-color);">81% 일치</strong>
                </li>
            </ul>
        `
    },
    translate_sign: {
        title: '실시간 안내판 번역',
        html: `
            <h4>카메라 영역 인식 텍스트 번역</h4>
            <div class="code-output">원문 (일본어):
【靴をお脱ぎになり、スリッパにお履き替えください】

번역 결과 (한국어):
【신발을 벗고 비치된 실내화(슬리퍼)로 갈아 신어 주십시오】</div>
            <p style="margin-top: 0.75rem; font-size: 0.85rem;">⚠️ 리조트 로비 진입 시 다다미 바닥 보호를 위한 객실 규정 안내입니다.</p>
        `
    },
    summarize: {
        title: 'AI 텍스트 핵심 요약',
        html: `
            <h4>해당 영어 단락 요약 결과</h4>
            <p class="modal-blockquote">
                "구글 딥마인드의 최신 인터랙션 모델은 마우스 포인터가 맥락 인식 렌즈처럼 작동하여, 복잡한 프롬프트 입력 없이 호버만으로 다중 모드 컨텍스트를 이해하고 맞춤형 액션을 제시하여 사용자 경험을 크게 간소화한다."
            </p>
            <p style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--text-secondary);">압축률: 약 72% 감소 | 키워드: Context-aware Cursor, Multimodal VLM, Interaction</p>
        `
    },
    translate: {
        title: 'AI 실시간 번역',
        html: `
            <h4>한국어 자연스러운 번역</h4>
            <div class="code-output" style="max-height: 150px; overflow-y: auto;">"구글 딥마인드의 새로운 상호작용 패러다임은 마우스 포인터가 맥락을 인식하는 렌즈 역할을 하도록 제안합니다. 텍스트를 복사하거나 이미지를 업로드하는 번거로움 없이 포인터 스스로가 감지된 의미적 경계를 분석하고 의도 기반 액션을 표시합니다. 시각-언어 모델을 활용해 최적의 추천 작업을 팝업하여 일반 사용자의 프롬프트 작성 장벽을 해소합니다."</div>
        `
    },
    explain_concept: {
        title: '용어 사전 & 개념 설명',
        html: `
            <h4>Multimodal Visual-Linguistic Context 란?</h4>
            <p>글자와 그림을 동시에 보고 이해하는 AI의 다중 감각 능력을 뜻합니다.</p>
            <ul style="margin-left: 1.25rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem;">
                <li><strong>시각(Visual)</strong>: 웹 화면 상의 위치, 이미지 픽셀, 레이아웃 상의 특징 감지.</li>
                <li><strong>언어(Linguistic)</strong>: 글자의 문맥, 상품 정보, 숫자 데이터 해독.</li>
                <li><strong>결합</strong>: 포인터가 가리킨 요소를 캡처해 두 모달리티를 동시에 추론합니다.</li>
            </ul>
        `
    },
    climate_report: {
        title: 'AI 메테오 분석 리포트',
        html: `
            <h4>서울 관측소 기상 정밀 분석</h4>
            <p>기온은 <strong>26°C</strong>이나 습도가 <strong>72%</strong>로 높아 불쾌지수가 다소 높은 밤입니다.</p>
            <div class="modal-grid-2">
                <div class="modal-grid-box">
                    <span>체감 온도</span>
                    <h5>28.2°C</h5>
                </div>
                <div class="modal-grid-box">
                    <span>열대야 가능성</span>
                    <h5 style="color: var(--warning-color);">중간 (40%)</h5>
                </div>
            </div>
            <p style="font-size: 0.85rem;">자정이 지나면서 서풍의 영향으로 일시적으로 습도가 낮아질 전망입니다.</p>
        `
    },
    outfit_guide: {
        title: 'AI 옷차림 추천 가이드',
        html: `
            <h4>오늘의 스마트 코디네이션</h4>
            <p>높은 습도와 온도를 고려한 추천 코디입니다:</p>
            <div class="modal-outfit-container">
                <span class="modal-outfit-tag">
                    👕 상의<br>린넨 셔츠 / 반팔티
                </span>
                <span class="modal-outfit-tag">
                    🩳 하의<br>시어서커 팬츠 / 반바지
                </span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.75rem;">💡 실내 냉방 방비용 가벼운 셔츠 겉옷 휴대를 권장합니다.</p>
        `
    },
    activity_score: {
        title: '야외 활동 지수 가이드',
        html: `
            <h4>실시간 활동 추천도: 65%</h4>
            <p>미세먼지 수준은 매우 쾌적하나 습한 날씨로 격렬한 실외 운동은 적합하지 않습니다.</p>
            <ul class="modal-list">
                <li class="modal-list-item">
                    <span>🚶‍♂️ 밤 산책 (가벼운 워킹)</span>
                    <span style="color:var(--success-color); font-weight: 600;">최적 (90%)</span>
                </li>
                <li class="modal-list-item">
                    <span>🏃‍♂️ 실외 런닝</span>
                    <span style="color:var(--warning-color); font-weight: 600;">보통 (50%)</span>
                </li>
                <li class="modal-list-item">
                    <span>🚴 야외 사이클</span>
                    <span style="color:var(--warning-color); font-weight: 600;">보통 (55%)</span>
                </li>
            </ul>
        `
    },
    compare_price: {
        title: 'AI 스마트 가격 비교',
        html: `
            <h4>전체 유통사 실시간 크롤링</h4>
            <p><strong>Nova Chronograph V2</strong> 최저가 검색 정보:</p>
            <table class="modal-table">
                <tr>
                    <th>쇼핑몰</th>
                    <th style="text-align: right;">가격</th>
                </tr>
                <tr>
                    <td>아마존 직구 (Prime)</td>
                    <td style="text-align: right; font-weight: 600; color: var(--purple-color);">$289.00</td>
                </tr>
                <tr>
                    <td>공식 파트너샵 (쿠폰 적용)</td>
                    <td style="text-align: right; text-decoration: line-through;">$299.00</td>
                </tr>
                <tr>
                    <td>이베이 셀러샵 (미개봉 새제품)</td>
                    <td style="text-align: right; font-weight: 600; color: var(--purple-color);">$274.50</td>
                </tr>
            </table>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.75rem;">💡 이베이 쇼핑몰에서 관세 미포함가로 최저가 등록 상태입니다.</p>
        `
    },
    review_summary: {
        title: 'AI 글로벌 리뷰 감성 분석',
        html: `
            <h4>구매 만족도: 4.7 / 5.0 (총 148건)</h4>
            <div style="margin: 0.75rem 0;">
                <div style="margin-bottom: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--success-color); font-weight: 600; display: block;">➕ 긍정 요인 (85% 비율)</span>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">"홀로그램 투사 시인성이 낮 밤 가리지 않고 뛰어남", "고급스러운 베젤 마감"</p>
                </div>
                <div>
                    <span style="font-size: 0.8rem; color: var(--danger-color); font-weight: 600; display: block;">➖ 부정 요인 (15% 비율)</span>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">"생각보다 배터리가 이틀 반밖에 가지 않음", "다소 무거운 스틸 밴드 무게"</p>
                </div>
            </div>
        `
    },
    price_forecast: {
        title: '인공지능 시세 변동 예측',
        html: `
            <h4>향후 3개월 가치 추이 모델링</h4>
            <p>제품 시계열 가격 데이터 모델 가중치 반영 결과:</p>
            <div class="modal-grid-box" style="padding: 0.75rem; border: 1px dashed rgba(161, 66, 244, 0.3);">
                <span style="font-size: 0.8rem;">7월 여름 세일 예상 하락치</span>
                <h4 style="color: var(--success-color); font-size: 1.3rem; margin-top: 0.25rem;">💰 -$30 (약 10% 가격 인하)</h4>
            </div>
            <p style="font-size: 0.85rem; margin-top: 0.75rem;">급한 필요가 아니라면 3주 후에 시작될 여름 세일 기간까지 구매 대기를 강력히 추천합니다.</p>
        `
    },
    youtube_summary: {
        title: '유튜브 타임라인 요약',
        html: `
            <h4>영상 14:25 분량 핵심 구간 요약</h4>
            <p><strong>주요 토픽별 분량 및 설명:</strong></p>
            <ul class="modal-list">
                <li class="modal-list-item-stacked">
                    <span style="color:var(--danger-color); font-weight:600;">00:00 - 03:15</span> 휴머노이드 로봇의 최신 기술 수준 (경량 하드웨어 및 동작 자유도 향상)
                </li>
                <li class="modal-list-item-stacked">
                    <span style="color:var(--danger-color); font-weight:600;">03:15 - 08:40</span> 스마트 팩토리 조립 공정 투입 사례 (작업 속도 및 적응도 분석)
                </li>
                <li class="modal-list-item-stacked">
                    <span style="color:var(--danger-color); font-weight:600;">08:40 - 14:25</span> 향후 10년 제조 단가 하락 전망 및 AI 제어 자율성 고도화 방향
                </li>
            </ul>
        `
    },
    youtube_highlights: {
        title: '가장 많이 본 하이라이트 구간',
        html: `
            <h4>AI 시청 관심 데이터 기반 구간 추출</h4>
            <p>시청자가 가장 높은 밀도로 반복 학습하거나 스킵 없이 시청한 구간입니다.</p>
            <ul class="modal-list">
                <li class="modal-list-item">
                    <span>🔥 [05:22] 로봇 손가락의 정밀 구슬 조작 및 나사 체결 시험</span>
                    <span class="material-symbols-rounded" style="color:var(--danger-color); font-size:1.25rem;">play_arrow</span>
                </li>
                <li class="modal-list-item">
                    <span>🔥 [11:10] 돌발 장애물 출현 시 AI 판단 회피 제어 기술</span>
                    <span class="material-symbols-rounded" style="color:var(--danger-color); font-size:1.25rem;">play_arrow</span>
                </li>
            </ul>
        `
    },
    youtube_translation: {
        title: '비디오 자막 번역',
        html: `
            <h4>AI 실시간 다국어 번역 스크립트</h4>
            <div class="code-output" style="max-height: 140px; overflow-y: auto; font-size:0.8rem; line-height:1.5;">[03:40] "These humanoid units aren't just programmed loops. They run real-time neural networks."
-> "이 휴머노이드 유닛들은 단순히 고정적으로 프로그래밍된 반복 루프로 작동하는 것이 아닙니다. 실시간 신경망 추론을 수행합니다."

[04:15] "The manufacturing cost of hardware has plummeted by 40% in two years."
-> "하드웨어의 제조 원가는 최근 2년 동안 40% 이상 급락했습니다."</div>
        `
    },
    news_verification: {
        title: '신뢰성 검증 리포트',
        html: `
            <h4>AI 팩트체크 엔진 실시간 가공 결과</h4>
            <div class="modal-factcheck-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>신뢰도 등급 (Fact Check Rank)</span>
                    <strong style="color:var(--cyan-color); font-size:1.2rem;">96% (매우 신뢰)</strong>
                </div>
            </div>
            <p style="font-size:0.85rem; line-height:1.5; color:var(--text-secondary);">
                <strong>주요 근거:</strong> 국제에너지기구(IEA)의 Q1 공식 시장 보고서와 기사에 수록된 수치 데이터(태양광/풍력 설치 총량 대비 가스/석탄 비율)가 소수점 단위까지 일치하며, 공신력 있는 기관의 원문 링크가 수반되어 있습니다.
            </p>
        `
    },
    news_bias: {
        title: '정치적/경제적 편향도 분석',
        html: `
            <h4>빅데이터 언사 톤앤매너 매핑 결과</h4>
            <p>작성된 기사 문장들의 중립성 지표입니다:</p>
            <div class="modal-bias-track">
                <div class="modal-bias-pin"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-secondary);">
                <span>친환경/진보적 치중</span>
                <span style="color:var(--cyan-color); font-weight:600;">중립 (Neutral)</span>
                <span>산업성장/보수적 치중</span>
            </div>
            <p style="font-size:0.85rem; margin-top:1rem; color:var(--text-secondary);">해당 보도자료는 주관적 감성 형용사 사용율이 1.2% 미만으로 극도로 낮으며, 학술적 수치를 단순 나열하여 완벽히 중립적인 스탠스를 취하고 있습니다.</p>
        `
    },
    news_coverage: {
        title: '동일 보도 교차 분석',
        html: `
            <h4>주요 외신/국내 매체별 보도 관점 차이</h4>
            <ul class="modal-list">
                <li class="modal-list-item">
                    <span>📰 Reuters: "Renewables hit historic record milestone"</span>
                    <span style="color:var(--cyan-color); font-size:0.75rem; font-weight:600;">객관/긍정적</span>
                </li>
                <li class="modal-list-item">
                    <span>📰 Bloomberg: "Investment shifts as solar pod costs dive"</span>
                    <span style="color:var(--purple-color); font-size:0.75rem; font-weight:600;">시장투자관점</span>
                </li>
                <li class="modal-list-item">
                    <span>📰 Wall Street Journal: "Clean energy grids hit capacity bottlenecks"</span>
                    <span style="color:var(--danger-color); font-size:0.75rem; font-weight:600;">규제/보수적</span>
                </li>
            </ul>
        `
    },
    stock_forecast: {
        title: 'GOOGL 30일 시세 전망',
        html: `
            <h4>시계열 딥러닝(LSTM) 가격 예측 모델링</h4>
            <p>개별 실적 가중치를 반영한 30일 가격 예측 추이입니다:</p>
            <div class="route-map-mock" style="height:120px; background:radial-gradient(circle at center, #112211 0%, #051105 100%); border-color:var(--success-color);">
                <span class="route-label start-lbl" style="color:var(--success-color); top: 50%;">현재가 ($178)</span>
                <span class="route-label end-lbl" style="color:var(--success-color); top: 20%;">예측가 ($192)</span>
                <svg width="100%" height="100%" style="position:absolute; inset:0; overflow:visible;">
                    <path d="M 45 80 Q 110 75, 170 55 T 255 35" fill="none" stroke="var(--success-color)" stroke-width="2.5" stroke-dasharray="4" stroke-dashoffset="0"/>
                    <circle cx="45" cy="80" r="4" fill="var(--success-color)"/>
                    <circle cx="255" cy="35" r="4.5" fill="var(--success-color)" class="pulsing"/>
                </svg>
            </div>
            <p style="margin-top:0.75rem; font-size:0.8rem; text-align:center; color:var(--text-secondary);">모델 시뮬레이션 결과 예측 구간 신뢰도: 89% (변동성 지수 기준)</p>
        `
    },
    stock_financials: {
        title: 'Alphabet Inc. 재무 성과',
        html: `
            <h4>최근 정식 공시 분기 실적 요약</h4>
            <table class="modal-table">
                <tr>
                    <th>지표 (Key Metrics)</th>
                    <th style="text-align: right;">분기 실적</th>
                    <th style="text-align: right;">YoY 대비</th>
                </tr>
                <tr>
                    <td style="font-weight:500;">총 매출액 (Revenue)</td>
                    <td style="text-align: right;">$80.54 Billion</td>
                    <td style="text-align: right; color:var(--success-color); font-weight:600;">+15.4%</td>
                </tr>
                <tr>
                    <td style="font-weight:500;">영업이익 (Operating Income)</td>
                    <td style="text-align: right;">$25.77 Billion</td>
                    <td style="text-align: right; color:var(--success-color); font-weight:600;">+24.2%</td>
                </tr>
                <tr>
                    <td style="font-weight:500;">주당순이익 (EPS)</td>
                    <td style="text-align: right;">$1.89</td>
                    <td style="text-align: right; color:var(--success-color); font-weight:600;">+26.1%</td>
                </tr>
            </table>
        `
    },
    stock_competitors: {
        title: '동일 업계 빅테크 비교',
        html: `
            <h4>주요 빅테크 기업 투자 분석 지표</h4>
            <table class="modal-table">
                <tr>
                    <th>TICKER</th>
                    <th style="text-align: center;">P/E Ratio</th>
                    <th style="text-align: center;">영업이익률</th>
                    <th style="text-align: right;">시가총액</th>
                </tr>
                <tr>
                    <td style="font-weight:600; color:var(--success-color);">GOOGL</td>
                    <td style="text-align: center;">25.4x</td>
                    <td style="text-align: center;">32.0%</td>
                    <td style="text-align: right;">$2.25 Trillion</td>
                </tr>
                <tr>
                    <td style="font-weight:600;">MSFT</td>
                    <td style="text-align: center;">36.2x</td>
                    <td style="text-align: center;">43.5%</td>
                    <td style="text-align: right;">$3.18 Trillion</td>
                </tr>
                <tr>
                    <td style="font-weight:600;">AAPL</td>
                    <td style="text-align: center;">30.8x</td>
                    <td style="text-align: center;">30.1%</td>
                    <td style="text-align: right;">$3.24 Trillion</td>
                </tr>
            </table>
            <p style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.75rem; line-height:1.4;">💡 경쟁사 대비 구글(GOOGL)은 상대적으로 낮은 P/E 밸류에이션 부담이 가장 낮은 축에 속합니다.</p>
        `
    }
};

// Reset State (Helper)
function resetScanning() {
    clearTimeout(scanningTimer);
    cursorHalo.classList.remove('scanning');
    
    // Reset progress circle animation
    progressCircle.style.transition = 'none';
    progressCircle.style.strokeDashoffset = CIRCLE_LENGTH;
}

// 1. Element Interaction Setup
cards.forEach(card => {
    const cardType = card.getAttribute('data-ai-type');
    
    // Hover Enter
    card.addEventListener('mouseenter', (e) => {
        if (isPopupOpen || cursorState === 'interacting') return;
        
        activeCard = card;
        cursorState = 'scanning';
        cursorHalo.classList.add('scanning');
        card.classList.add('scanning');

        // Circular sweep animation trigger via strokeDashoffset
        // Wait 10ms for style to clean and ensure transitions apply correctly
        setTimeout(() => {
            if (cursorState === 'scanning') {
                progressCircle.style.transition = 'stroke-dashoffset 600ms linear';
                progressCircle.style.strokeDashoffset = '0';
            }
        }, 10);

        // Define color theme based on element type
        let themeColor = 'var(--primary-color)';
        let themeGlow = '66, 133, 244';
        if (cardType === 'text') { themeColor = 'var(--success-color)'; themeGlow = '52, 168, 83'; }
        if (cardType === 'weather') { themeColor = 'var(--warning-color)'; themeGlow = '251, 188, 5'; }
        if (cardType === 'product') { themeColor = 'var(--purple-color)'; themeGlow = '161, 66, 244'; }
        if (cardType === 'youtube') { themeColor = 'var(--danger-color)'; themeGlow = '234, 67, 53'; }
        if (cardType === 'news') { themeColor = 'var(--cyan-color)'; themeGlow = '0, 229, 255'; }
        if (cardType === 'stock') { themeColor = 'var(--success-color)'; themeGlow = '52, 168, 83'; }
        
        card.style.setProperty('--theme-color', themeColor);
        card.style.setProperty('--theme-glow', themeGlow);

        // Hover Time threshold (600ms) to simulate AI comprehension
        scanningTimer = setTimeout(() => {
            if (activeCard === card) {
                triggerRecognition(card, cardType);
            }
        }, 600);
    });

    // Hover Leave
    card.addEventListener('mouseleave', () => {
        card.classList.remove('scanning');
        
        if (isPopupOpen && activeCard === card) {
            // Keep card highlighted if popup is still open
            return;
        }

        resetScanning();
        
        if (isScanned && activeCard === card) {
            card.classList.remove('recognized');
            cursorHalo.classList.remove(`morph-${cardType}`);
            cursorIcon.innerHTML = 'select_all';
            isScanned = false;
            cursorState = 'idle';
            activeCard = null;
        } else if (activeCard === card) {
            cursorState = 'idle';
            activeCard = null;
        }
    });

    // Clicking recognized element
    card.addEventListener('click', (e) => {
        if (isScanned && activeCard === card) {
            e.stopPropagation();
            openActionMenu(e.clientX, e.clientY, cardType);
        }
    });
});

// 2. Trigger Recognition State
function triggerRecognition(card, type) {
    resetScanning();
    isScanned = true;
    cursorState = 'recognized';
    
    // Change Cursor Morphing
    cursorHalo.classList.add(`morph-${type}`);
    
    // Set appropriate icon
    if (type === 'image') cursorIcon.innerHTML = 'crop_free';
    else if (type === 'text') cursorIcon.innerHTML = 'edit_note';
    else if (type === 'weather') cursorIcon.innerHTML = 'radar';
    else if (type === 'product') cursorIcon.innerHTML = 'sell';
    else if (type === 'youtube') cursorIcon.innerHTML = 'play_arrow';
    else if (type === 'news') cursorIcon.innerHTML = 'verified';
    else if (type === 'stock') cursorIcon.innerHTML = 'trending_up';
    
    // Highlight Card
    card.classList.add('recognized');
}

// 3. Context-Aware Popup Menu Handling
function openActionMenu(x, y, type) {
    isPopupOpen = true;
    cursorState = 'interacting';

    // Clear previous items
    popupActionsList.innerHTML = '';

    // Fetch matching actions
    const actions = AI_ACTIONS[type] || [];
    actions.forEach(act => {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.style.setProperty('--btn-hover-color', act.color);
        btn.innerHTML = `
            <span class="material-symbols-rounded">${act.icon}</span>
            <span>${act.label}</span>
        `;
        
        // Setup action trigger
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            executeAIAction(act.action, act.color);
        });

        // Set Magnetic Interaction Listeners (iPad Cursor Wow effect)
        btn.addEventListener('mouseenter', () => {
            isMagnetic = true;
            magneticRect = btn.getBoundingClientRect();
            
            // Calculate absolute center point of target button
            magneticCenter.x = magneticRect.left + magneticRect.width / 2;
            magneticCenter.y = magneticRect.top + magneticRect.height / 2;

            // Change cursor appearance to adapt to button boundary
            cursorHalo.classList.add('magnetic');
            cursorDot.classList.add('magnetic');
            cursorHalo.style.setProperty('--magnetic-width', `${magneticRect.width}px`);
            cursorHalo.style.setProperty('--magnetic-height', `${magneticRect.height}px`);
        });

        btn.addEventListener('mouseleave', () => {
            isMagnetic = false;
            magneticRect = null;
            
            cursorHalo.classList.remove('magnetic');
            cursorDot.classList.remove('magnetic');
        });

        popupActionsList.appendChild(btn);
    });

    // Position Menu
    popupMenu.classList.remove('hidden');
    
    // Ensure the menu doesn't flow off the screen borders
    const menuWidth = 230;
    const menuHeight = popupMenu.offsetHeight || 160;
    let posX = x + 15;
    let posY = y + 15;
    
    if (posX + menuWidth > window.innerWidth) {
        posX = x - menuWidth - 15;
    }
    if (posY + menuHeight > window.innerHeight) {
        posY = y - menuHeight - 15;
    }

    popupMenu.style.left = `${posX}px`;
    popupMenu.style.top = `${posY}px`;
    
    // Animate display class
    setTimeout(() => {
        popupMenu.classList.add('show');
    }, 10);
}

// Close Popup Menu
function closeActionMenu() {
    isPopupOpen = false;
    popupMenu.classList.remove('show');
    setTimeout(() => {
        popupMenu.classList.add('hidden');
    }, 200);

    // Reset cursor snapping
    isMagnetic = false;
    magneticRect = null;
    cursorHalo.classList.remove('magnetic');
    cursorDot.classList.remove('magnetic');

    // Reset card highlight if cursor has left card boundary
    if (activeCard) {
        // Run a small check to see if cursor is currently within the activeCard rect
        const cardRect = activeCard.getBoundingClientRect();
        const insideX = mouse.x >= cardRect.left && mouse.x <= cardRect.right;
        const insideY = mouse.y >= cardRect.top && mouse.y <= cardRect.bottom;
        
        if (!insideX || !insideY) {
            activeCard.classList.remove('recognized');
            const cardType = activeCard.getAttribute('data-ai-type');
            cursorHalo.classList.remove(`morph-${cardType}`);
            cursorIcon.innerHTML = 'select_all';
            isScanned = false;
            cursorState = 'idle';
            activeCard = null;
        } else {
            // Re-apply morphing cursor
            cursorState = 'recognized';
        }
    } else {
        cursorState = 'idle';
    }
}

// Global click handler to close menu when clicking outside
window.addEventListener('click', (e) => {
    if (isPopupOpen && !popupMenu.contains(e.target)) {
        closeActionMenu();
    }
});

// Esc key closes popup menu and modal
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (isPopupOpen) closeActionMenu();
        if (!responseModal.classList.contains('hidden')) closeModal();
    }
});

// 4. Action Execution with Simulated AI Loading
function executeAIAction(action, themeColor) {
    closeActionMenu();

    // Configure Modal Colors
    document.documentElement.style.setProperty('--modal-theme-color', themeColor);
    
    // Dynamic real-time weather, stock, travel & news calculations
    if (action === 'climate_report') {
        ACTION_RESPONSES.climate_report.html = getClimateReportHTML();
    } else if (action === 'outfit_guide') {
        ACTION_RESPONSES.outfit_guide.html = getOutfitGuideHTML();
    } else if (action === 'activity_score') {
        ACTION_RESPONSES.activity_score.html = getActivityScoreHTML();
    } else if (action === 'stock_forecast') {
        ACTION_RESPONSES.stock_forecast.html = getStockForecastHTML();
    } else if (action === 'stock_financials') {
        ACTION_RESPONSES.stock_financials.html = getStockFinancialsHTML();
    } else if (action === 'stock_competitors') {
        ACTION_RESPONSES.stock_competitors.html = getStockCompetitorsHTML();
    } else if (action === 'find_route') {
        ACTION_RESPONSES.find_route.html = getFindRouteHTML();
    } else if (action === 'visual_search') {
        ACTION_RESPONSES.visual_search.html = getVisualSearchHTML();
    } else if (action === 'translate_sign') {
        ACTION_RESPONSES.translate_sign.html = getTranslateSignHTML();
    } else if (action === 'news_verification') {
        ACTION_RESPONSES.news_verification.html = getNewsVerificationHTML();
    } else if (action === 'news_bias') {
        ACTION_RESPONSES.news_bias.html = getNewsBiasHTML();
    } else if (action === 'news_coverage') {
        ACTION_RESPONSES.news_coverage.html = getNewsCoverageHTML();
    }
    
    // Open Modal and display loading
    responseModal.classList.remove('hidden');
    setTimeout(() => {
        responseModal.classList.add('show');
    }, 10);

    modalLoader.classList.remove('hidden');
    modalResult.classList.add('hidden');

    const res = ACTION_RESPONSES[action];
    modalTitle.textContent = res ? res.title : 'AI 처리 결과';

    // Simulate Processing Delay
    setTimeout(() => {
        modalLoader.classList.add('hidden');
        modalResult.classList.remove('hidden');
        
        if (res) {
            modalResult.innerHTML = res.html;
        } else {
            modalResult.innerHTML = `<p>요청하신 작업이 성공적으로 처리되었습니다.</p>`;
        }
    }, 1200);
}

// Modal closing
function closeModal() {
    responseModal.classList.remove('show');
    setTimeout(() => {
        responseModal.classList.add('hidden');
    }, 300);
}

closeModalBtn.addEventListener('click', closeModal);
responseModal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

// Dynamic hover effect on Close Modal button
closeModalBtn.addEventListener('mouseenter', () => {
    cursorHalo.classList.add('magnetic');
    cursorDot.classList.add('magnetic');
    const rect = closeModalBtn.getBoundingClientRect();
    isMagnetic = true;
    magneticRect = rect;
    magneticCenter.x = rect.left + rect.width / 2;
    magneticCenter.y = rect.top + rect.height / 2;
    cursorHalo.style.setProperty('--magnetic-width', `${rect.width + 10}px`);
    cursorHalo.style.setProperty('--magnetic-height', `${rect.height + 10}px`);
});

closeModalBtn.addEventListener('mouseleave', () => {
    isMagnetic = false;
    magneticRect = null;
    cursorHalo.classList.remove('magnetic');
    cursorDot.classList.remove('magnetic');
});


// --- Real-time API Integration (Weather & Stock) ---

// Weather State
let currentWeatherData = { temp: 26, humidity: 72, windSpeed: 3.2, weatherCode: 3, isNight: true };

// Stock State
let currentStockPrice = 2382000;
let stockBasePrice = 2288000;
const stockHistory = [];
const maxHistoryPoints = 15;
let forceSimulationMode = false;

function isKSTMarketOpen() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (3600000 * 9));
    const day = kst.getDay();
    const hours = kst.getHours();
    const minutes = kst.getMinutes();
    if (day === 0 || day === 6) return false;
    const timeVal = hours * 100 + minutes;
    return timeVal >= 900 && timeVal <= 1530;
}

function updateMarketStatusUI() {
    const open = isKSTMarketOpen();
    const badges = document.querySelectorAll('.market-status-badge');
    badges.forEach(badge => {
        if (open) {
            badge.textContent = '● 정규장';
            badge.className = 'market-status-badge open';
            badge.title = '한국 표준시(KST) 정규 거래 시간 내 실시간 시세 반영 중';
        } else {
            if (forceSimulationMode) {
                badge.textContent = '● 장마감 (모의 변동)';
                badge.className = 'market-status-badge closed simulation';
                badge.title = '장 마감 상태이나 클릭하여 정적 시세로 전환';
            } else {
                badge.textContent = '● 장마감 (시세 고정)';
                badge.className = 'market-status-badge closed';
                badge.title = '정규장 마감 상태. 클릭하면 모의 변동 시뮬레이션이 활성화됩니다.';
            }
        }
    });
}

// Initialize stock history
for (let i = 0; i < maxHistoryPoints; i++) {
    const progress = i / (maxHistoryPoints - 1);
    const mockVal = stockBasePrice + (currentStockPrice - stockBasePrice) * progress + (Math.random() - 0.5) * 40000;
    stockHistory.push(Math.round(mockVal / 1000) * 1000);
}

// News State
let currentNewsArticle = {
    title: "Global Green Energy Transition Reaches Critical Milestone",
    description: "Renewable energy installations have officially surpassed fossil fuel deployment in major grids for the first quarter, signaling a faster pivot than previously projected by models.",
    source: "Scientific Horizon Daily"
};

// Check if embedded inside iframe
const isEmbedded = window.self !== window.top && window.parent;

function getStockPrice() {
    return (isEmbedded && typeof window.parent.getCurrentStockPrice === 'function') 
        ? window.parent.getCurrentStockPrice() 
        : currentStockPrice;
}

function getStockHistory() {
    return (isEmbedded && typeof window.parent.getCurrentStockHistory === 'function') 
        ? window.parent.getCurrentStockHistory() 
        : stockHistory;
}

function getStockBasePrice() {
    return (isEmbedded && typeof window.parent.getCurrentStockBasePrice === 'function') 
        ? window.parent.getCurrentStockBasePrice() 
        : stockBasePrice;
}

function getWeatherData() {
    return (isEmbedded && typeof window.parent.getCurrentWeatherData === 'function') 
        ? window.parent.getCurrentWeatherData() 
        : currentWeatherData;
}

// Weather Icon Mapping
function getWeatherIconAndDesc(code, isNight) {
    let icon = 'light_mode';
    let desc = '맑음';
    if (isNight && (code === 0 || code === 1)) {
        icon = 'dark_mode';
    }
    if (code === 0) {
        desc = isNight ? '맑은 밤' : '맑음';
    } else if (code === 1 || code === 2 || code === 3) {
        icon = isNight ? 'nightlight' : 'cloudy';
        desc = '구름 조금';
        if (code === 3) desc = '흐림';
    } else if (code === 45 || code === 48) {
        icon = 'foggy';
        desc = '안개';
    } else if (code >= 51 && code <= 67) {
        icon = 'rainy';
        desc = '비';
    } else if (code >= 71 && code <= 77) {
        icon = 'ac_unit';
        desc = '눈';
    } else if (code >= 80 && code <= 82) {
        icon = 'rainy';
        desc = '소나기';
    } else if (code >= 95) {
        icon = 'thunderstorm';
        desc = '뇌우';
    }
    return { icon, desc };
}

// Update Weather UI
function updateWeatherUI(temp, humidity, windSpeed, weatherCode, isNight) {
    const weatherCard = document.querySelector('.card-weather');
    if (!weatherCard) return;
    
    const tempEl = weatherCard.querySelector('.weather-temp h2');
    const iconEl = weatherCard.querySelector('.weather-icon');
    const conditionEl = weatherCard.querySelector('.weather-condition');
    const metricsEl = weatherCard.querySelectorAll('.weather-metrics .metric');
    
    if (tempEl) tempEl.innerHTML = `${Math.round(temp)}<span>°C</span>`;
    
    const { icon, desc } = getWeatherIconAndDesc(weatherCode, isNight);
    if (iconEl) {
        iconEl.textContent = icon;
        if (icon === 'light_mode' || icon === 'dark_mode') {
            iconEl.classList.add('animate-spin-slow');
        } else {
            iconEl.classList.remove('animate-spin-slow');
        }
    }
    if (conditionEl) conditionEl.textContent = `${desc} (${isNight ? '밤' : '낮'})`;
    
    if (metricsEl.length >= 2) {
        metricsEl[0].innerHTML = `<span class="material-symbols-rounded">water_drop</span> ${humidity}%`;
        metricsEl[1].innerHTML = `<span class="material-symbols-rounded">air</span> ${windSpeed}m/s`;
    }
}

// Fetch real-time weather
async function fetchRealTimeWeather() {
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=37.6208&longitude=127.0561&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day");
        if (!res.ok) throw new Error("Weather API fetch failed");
        const data = await res.json();
        
        if (data && data.current) {
            const cur = data.current;
            currentWeatherData.temp = cur.temperature_2m;
            currentWeatherData.humidity = cur.relative_humidity_2m;
            currentWeatherData.windSpeed = cur.wind_speed_10m;
            currentWeatherData.weatherCode = cur.weather_code;
            currentWeatherData.isNight = cur.is_day === 0;
            
            updateWeatherUI(currentWeatherData.temp, currentWeatherData.humidity, currentWeatherData.windSpeed, currentWeatherData.weatherCode, currentWeatherData.isNight);
        }
    } catch (err) {
        console.warn("Could not fetch real-time weather, using mock:", err);
        updateWeatherUI(currentWeatherData.temp, currentWeatherData.humidity, currentWeatherData.windSpeed, currentWeatherData.weatherCode, currentWeatherData.isNight);
    }
}

// Update Stock Chart
function updateStockChart() {
    const stockCard = document.querySelector('.card-stock');
    if (!stockCard) return;

    const linePathEl = stockCard.querySelector('.chart-line');
    const areaPathEl = stockCard.querySelector('.chart-area');
    const pointEl = stockCard.querySelector('.chart-point');
    const priceEl = stockCard.querySelector('.stock-price');
    const changeEl = stockCard.querySelector('.stock-change');

    const price = getStockPrice();
    const hist = getStockHistory();
    const basePrice = getStockBasePrice();
    const isUp = price >= basePrice;

    if (priceEl) priceEl.textContent = `₩${Math.round(price).toLocaleString()}`;
    
    const changeVal = price - basePrice;
    const changePercent = (changeVal / basePrice) * 100;
    
    if (changeEl) {
        changeEl.className = `stock-change ${isUp ? 'up' : 'down'}`;
        changeEl.innerHTML = `<span class="material-symbols-rounded">${isUp ? 'trending_up' : 'trending_down'}</span>${isUp ? '+' : ''}${Math.round(changeVal).toLocaleString()}원 (${isUp ? '+' : ''}${changePercent.toFixed(2)}%)`;
        if (isUp) {
            changeEl.style.color = 'var(--success-color)';
            changeEl.style.backgroundColor = 'rgba(52, 168, 83, 0.1)';
        } else {
            changeEl.style.color = 'var(--danger-color)';
            changeEl.style.backgroundColor = 'rgba(234, 67, 53, 0.1)';
        }
    }

    if (hist.length === 0) return;

    const minVal = Math.min(...hist);
    const maxVal = Math.max(...hist);
    const range = maxVal - minVal || 1;

    const points = hist.map((val, idx) => {
        const x = idx * (300 / (maxHistoryPoints - 1));
        const y = 80 - ((val - minVal) / range) * 60;
        return { x, y };
    });

    let lineD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
        lineD += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }
    
    const areaD = `${lineD} L 300 100 L 0 100 Z`;

    if (linePathEl) linePathEl.setAttribute('d', lineD);
    if (areaPathEl) areaPathEl.setAttribute('d', areaD);
    
    const lastPoint = points[points.length - 1];
    if (pointEl) {
        pointEl.setAttribute('cx', lastPoint.x.toFixed(1));
        pointEl.setAttribute('cy', lastPoint.y.toFixed(1));
        pointEl.setAttribute('fill', isUp ? 'var(--success-color)' : 'var(--danger-color)');
    }
}

function tickStock() {
    if (isEmbedded) return;
    if (!isKSTMarketOpen() && !forceSimulationMode) return;
    const change = (Math.random() - 0.5) * 15000;
    currentStockPrice = Math.max(1500000, Math.min(3000000, currentStockPrice + change));
    currentStockPrice = Math.round(currentStockPrice / 1000) * 1000;
    
    stockHistory.shift();
    stockHistory.push(currentStockPrice);
    
    updateStockChart();
}

// Real-time weather/stock dynamic AI reports
function getClimateReportHTML() {
    const data = getWeatherData();
    const sensible = data.temp + (data.humidity - 50) * 0.05 - data.windSpeed * 0.2;
    return `
        <h4>서울 노원구 월계동 (광운인공지능고 관측)</h4>
        <p>현재 실시간 기온은 <strong>${data.temp.toFixed(1)}°C</strong>이며 습도는 <strong>${data.humidity}%</strong>로 기상 분석 리포트 조건이 충족되었습니다.</p>
        <div class="modal-grid-2">
            <div class="modal-grid-box">
                <span>체감 온도</span>
                <h5>${sensible.toFixed(1)}°C</h5>
            </div>
            <div class="modal-grid-box">
                <span>열대야 가능성</span>
                <h5 style="color: var(--warning-color);">${data.temp >= 25 && data.isNight ? '높음 (60%)' : '낮음'}</h5>
            </div>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Open-Meteo 실시간 기상 관측 서버로부터 가져온 실제 기상 데이터를 바탕으로 가공된 보고서입니다.</p>
    `;
}

function getOutfitGuideHTML() {
    const data = getWeatherData();
    const temp = data.temp;
    let top = "린넨 셔츠 / 반팔티";
    let bottom = "시어서커 팬츠 / 반바지";
    let tip = "실내 냉방에 대비해 가벼운 가디건을 준비하세요.";
    
    if (temp >= 25) {
        top = "린넨 셔츠 / 얇은 반팔티";
        bottom = "반바지 / 얇은 슬랙스";
        tip = "습도가 높아 땀 배출이 용이한 통풍성 소재가 좋습니다.";
    } else if (temp >= 18) {
        top = "긴팔 티셔츠 / 얇은 셔츠";
        bottom = "청바지 / 면바지";
        tip = "아침 저녁 일교차에 대비해 가벼운 아우터 활용을 추천합니다.";
    } else if (temp >= 12) {
        top = "맨투맨 / 자켓 / 가디건";
        bottom = "슬랙스 / 청바지";
        tip = "자켓이나 트렌치코트 등 적절한 아우터 레이어링이 적합합니다.";
    } else {
        top = "니트 / 코트 / 가죽자켓";
        bottom = "두꺼운 바지 / 기모팬츠";
        tip = "기온이 낮으니 보온 기능성 이너와 외투를 따뜻하게 착용하세요.";
    }
    
    return `
        <h4>오늘의 스마트 코디네이션</h4>
        <p>실시간 온도 <strong>${temp.toFixed(1)}°C</strong>에 맞춰 실시간으로 추천된 의상 피드입니다:</p>
        <div class="modal-outfit-container">
            <span class="modal-outfit-tag">
                👕 상의<br>${top}
            </span>
            <span class="modal-outfit-tag">
                🩳 하의<br>${bottom}
            </span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.75rem;">💡 ${tip}</p>
    `;
}

function getActivityScoreHTML() {
    const data = getWeatherData();
    let score = 85;
    let desc = "미세먼지 수준이 매우 쾌적하며 야외 활동을 하기에 최적의 기온과 바람입니다.";
    let walkRating = "최적 (95%)";
    let runRating = "최적 (90%)";
    let cycleRating = "최적 (90%)";
    
    if (data.humidity > 80 || data.weatherCode >= 51) {
        score = 30;
        desc = "실시간 강수 또는 가습 상태로 야외 활동이 원활하지 않습니다. 실내 스포츠를 추천합니다.";
        walkRating = "불가 (15%)";
        runRating = "비추천 (5%)";
        cycleRating = "비추천 (5%)";
    } else if (data.temp >= 30) {
        score = 45;
        desc = "기온이 너무 높아 한낮 야외 활동은 삼가시기 바라며, 수분을 충분히 섭취하세요.";
        walkRating = "보통 (55%)";
        runRating = "주의 (25%)";
        cycleRating = "주의 (30%)";
    } else if (data.temp < 10) {
        score = 65;
        desc = "기온이 다소 쌀쌀하므로 관절과 근육을 충분히 예열(스트레칭)한 후 활동하세요.";
        walkRating = "보통 (75%)";
        runRating = "보통 (60%)";
        cycleRating = "보통 (60%)";
    }
    
    return `
        <h4>실시간 활동 추천도: ${score}%</h4>
        <p>${desc}</p>
        <ul class="modal-list">
            <li class="modal-list-item">
                <span>🚶‍♂️ 가벼운 워킹 / 밤산책</span>
                <span style="color:var(--success-color); font-weight: 600;">${walkRating}</span>
            </li>
            <li class="modal-list-item">
                <span>🏃‍♂️ 실외 러닝</span>
                <span style="color:var(--warning-color); font-weight: 600;">${runRating}</span>
            </li>
            <li class="modal-list-item">
                <span>🚴 야외 사이클</span>
                <span style="color:var(--warning-color); font-weight: 600;">${cycleRating}</span>
            </li>
        </ul>
    `;
}

function getStockForecastHTML() {
    const price = getStockPrice();
    const targetPrice = Math.round((price * 1.085) / 500) * 500;
    return `
        <h4>SK하이닉스 30일 시세 전망</h4>
        <p>실시간 가격 데이터 기반의 30일 시세 전망 예측 결과입니다:</p>
        <div class="route-map-mock" style="height:120px; background:radial-gradient(circle at center, #112211 0%, #051105 100%); border-color:var(--success-color);">
            <span class="route-label start-lbl" style="color:var(--success-color); top: 50%;">현재가 (₩${Math.round(price).toLocaleString()})</span>
            <span class="route-label end-lbl" style="color:var(--success-color); top: 20%;">예측가 (₩${targetPrice.toLocaleString()})</span>
            <svg width="100%" height="100%" style="position:absolute; inset:0; overflow:visible;">
                <path d="M 45 80 Q 110 75, 170 55 T 255 35" fill="none" stroke="var(--success-color)" stroke-width="2.5" stroke-dasharray="4" stroke-dashoffset="0"/>
                <circle cx="45" cy="80" r="4" fill="var(--success-color)"/>
                <circle cx="255" cy="35" r="4.5" fill="var(--success-color)" class="pulsing"/>
            </svg>
        </div>
        <p style="margin-top:0.75rem; font-size:0.8rem; text-align:center; color:var(--text-secondary);">실시간 가격 데이터 및 시계열(LSTM) 모델을 활용한 분석치입니다.</p>
    `;
}

function getStockFinancialsHTML() {
    const price = getStockPrice();
    return `
        <h4>SK하이닉스 실시간 재무 분석</h4>
        <p>현재 시장가 ₩${Math.round(price).toLocaleString()} 기준으로 연산한 재무 주요 지표 요약입니다:</p>
        <table class="modal-table">
            <tr>
                <th>지표 (Key Metrics)</th>
                <th style="text-align: right;">분기 실적</th>
                <th style="text-align: right;">YoY 대비</th>
            </tr>
            <tr>
                <td style="font-weight:500;">총 매출액 (Revenue)</td>
                <td style="text-align: right;">12.42조 원</td>
                <td style="text-align: right; color:var(--success-color); font-weight:600;">+144.3%</td>
            </tr>
            <tr>
                <td style="font-weight:500;">영업이익 (Operating Income)</td>
                <td style="text-align: right;">2.88조 원</td>
                <td style="text-align: right; color:var(--success-color); font-weight:600;">흑자전환</td>
            </tr>
            <tr>
                <td style="font-weight:500;">주당순이익 (EPS)</td>
                <td style="text-align: right;">₩3,850</td>
                <td style="text-align: right; color:var(--success-color); font-weight:600;">흑자전환</td>
            </tr>
        </table>
    `;
}

function getStockCompetitorsHTML() {
    return `
        <h4>메모리 반도체 업계 지표 비교</h4>
        <p>SK하이닉스 및 주요 글로벌 반도체 경쟁사의 투자 분석 지표입니다:</p>
        <table class="modal-table">
            <tr>
                <th>TICKER</th>
                <th style="text-align: center;">P/E Ratio</th>
                <th style="text-align: center;">영업이익률</th>
                <th style="text-align: right;">시가총액</th>
            </tr>
            <tr>
                <td style="font-weight:600; color:var(--success-color);">SK하이닉스 (000660)</td>
                <td style="text-align: center;">18.5x</td>
                <td style="text-align: center;">23.2%</td>
                <td style="text-align: right;">163.4조 원</td>
            </tr>
            <tr>
                <td style="font-weight:600;">삼성전자 (005930)</td>
                <td style="text-align: center;">22.1x</td>
                <td style="text-align: center;">11.5%</td>
                <td style="text-align: right;">462.1조 원</td>
            </tr>
            <tr>
                <td style="font-weight:600;">Micron (MU)</td>
                <td style="text-align: center;">24.8x</td>
                <td style="text-align: center;">-4.2%</td>
                <td style="text-align: right;">$142 Billion</td>
            </tr>
            <tr>
                <td style="font-weight:600;">TSMC (TSM)</td>
                <td style="text-align: center;">26.3x</td>
                <td style="text-align: center;">42.5%</td>
                <td style="text-align: right;">$840 Billion</td>
            </tr>
        </table>
        <p style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.75rem; line-height:1.4;">
            💡 고대역폭 메모리(HBM) 시장의 리더십을 바탕으로 SK하이닉스의 영업이익률이 업계 평균 대비 강력한 성장세를 보이고 있습니다.
        </p>
    `;
}

function getFindRouteHTML() {
    return `
        <h4>동대문디자인플라자(DDP) 지하철 연결 경로</h4>
        <p><strong>동대문역사문화공원역 (2, 4, 5호선) 1번 출구</strong>에서 어울림광장 및 디자인거리로 직접 연결되는 도보 가이드입니다:</p>
        <div class="route-map-mock" style="height:100px; position:relative; background:rgba(0,0,0,0.2); border:1px solid var(--modal-item-border); border-radius:8px;">
            <span class="route-label start-lbl" style="left:15px; top:40%; color:var(--primary-color);">역사 대합실 (B2)</span>
            <span class="route-label end-lbl" style="right:15px; top:40%; color:var(--success-color);">DDP 어울림광장</span>
            <svg width="100%" height="100%" style="position:absolute; inset:0; overflow:visible;">
                <path d="M 90 50 Q 150 45, 210 50" fill="none" stroke="var(--primary-color)" stroke-width="2" stroke-dasharray="4"/>
                <circle cx="90" cy="50" r="4.5" fill="var(--primary-color)"/>
                <circle cx="210" cy="50" r="4.5" fill="var(--success-color)" class="pulsing"/>
            </svg>
        </div>
        <p style="margin-top:1rem; font-size:0.85rem; color:var(--text-secondary); line-height:1.5;">
            🚶‍♂️ **이동 방법**: 지하철 개찰구 통과 후 **1번 출구** 방향 무빙워크 탑승 → 지하 어울림광장(Oullim Square)과 배움터 지하 2층 입구가 지하철 출구와 계단 없이 바로 연결되어 유모차 및 휠체어로도 매우 안전하고 편리하게 접근할 수 있습니다.
        </p>
    `;
}

function getVisualSearchHTML() {
    return `
        <h4>비정형 미래 건축물 시각 유사도 검색</h4>
        <p>자하 하디드 설계 특유의 유기적이고 부드러운 곡선 금속 패널 레이아웃 분석 결과:</p>
        <ul class="modal-list">
            <li class="modal-list-item">
                <span>🛸 베이징 갤럭시 소호 (Galaxy SOHO - 자하 하디드)</span>
                <strong style="color: var(--primary-color);">94% 일치</strong>
            </li>
            <li class="modal-list-item">
                <span>🏢 싱가포르 마리나 베이 샌즈 (Moshe Safdie)</span>
                <strong style="color: var(--primary-color);">87% 일치</strong>
            </li>
            <li class="modal-list-item">
                <span>🌿 싱가포르 주얼 창이 공항 (내부 돔 곡선 구조)</span>
                <strong style="color: var(--primary-color);">81% 일치</strong>
            </li>
        </ul>
    `;
}

function getTranslateSignHTML() {
    return `
        <h4>DDP 이용객 수칙 실시간 번역</h4>
        <div class="code-output" style="font-size:0.8rem; line-height:1.5;">
<strong>원문 (한국어):</strong><br>
【동대문디자인플라자(DDP) 전시관 및 시설은 구역별로 운영 시간이 다르며, 안전한 관람 환경 조성을 위해 야외 잔디 언덕 경사로에서의 개인 이동장치(킥보드, 자전거 등) 주행 및 흡연을 금지합니다.】<br><br>
<strong>영문 번역 (English):</strong><br>
【Operating hours for Dongdaemun Design Plaza (DDP) exhibition halls and facilities vary by zone. To ensure a safe viewing environment, smoking and riding personal mobility devices (such as electric kickboards and bicycles) on the outdoor grass slope areas are strictly prohibited.】
        </div>
    `;
}

function getNewsVerificationHTML() {
    const title = currentNewsArticle.title || "Latest Tech Story";
    const source = currentNewsArticle.source || "BBC Technology";
    return `
        <h4>AI 팩트체크: "${title}"</h4>
        <div class="modal-factcheck-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>신뢰도 등급 (Confidence Rank)</span>
                <strong style="color:var(--cyan-color); font-size:1.2rem;">95% (높음)</strong>
            </div>
        </div>
        <p style="font-size:0.85rem; line-height:1.5; color:var(--text-secondary);">
            <strong>분석 결과:</strong> 본 보도는 ${source}의 공식 취재 기사이며, 교차 검증된 소식통과 보도 자료를 근거로 작성되어 팩트 왜곡 가능성이 매우 희박합니다.
        </p>
    `;
}

function getNewsBiasHTML() {
    const title = currentNewsArticle.title || "Latest Tech Story";
    return `
        <h4>정치적/경제적 편향도 분석</h4>
        <p>"${title}" 보도의 톤앤매너 매핑 결과:</p>
        <div class="modal-bias-track">
            <div class="modal-bias-pin"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-secondary);">
            <span>주관적/감정적 서사</span>
            <span style="color:var(--cyan-color); font-weight:600;">중립 (Neutral)</span>
            <span>산업성장/홍보성 치중</span>
        </div>
        <p style="font-size:0.85rem; margin-top:1rem; color:var(--text-secondary);">
            해당 기사는 자극적 형용사를 지양하고 팩트 위주로 건조하게 서술되어 중립성 지수가 매우 높습니다.
        </p>
    `;
}

function getNewsCoverageHTML() {
    const title = currentNewsArticle.title || "Latest Tech Story";
    return `
        <h4>동일 보도 교차 분석 (Related Coverage)</h4>
        <p>"${title}" 관련 주요 외신 보도 스탠스:</p>
        <ul class="modal-list">
            <li class="modal-list-item">
                <span>📰 Reuters: "${title.substring(0, 30)}..."</span>
                <span style="color:var(--cyan-color); font-size:0.75rem; font-weight:600;">객관적 보도</span>
            </li>
            <li class="modal-list-item">
                <span>📰 Bloomberg: tech analysis and market implications</span>
                <span style="color:var(--purple-color); font-size:0.75rem; font-weight:600;">시장 영향력 관점</span>
            </li>
            <li class="modal-list-item">
                <span>📰 TechCrunch: detailed product breakdown</span>
                <span style="color:var(--success-color); font-size:0.75rem; font-weight:600;">기술적 분석</span>
            </li>
        </ul>
    `;
}

async function fetchSKHynixPrice() {
    try {
        const targetUrl = "https://query1.finance.yahoo.com/v8/finance/chart/000660.KS?interval=1d&range=1d";
        const res = await fetch("https://corsproxy.io/?url=" + encodeURIComponent(targetUrl));
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice) {
            currentStockPrice = meta.regularMarketPrice;
            if (meta.chartPreviousClose) {
                stockBasePrice = meta.chartPreviousClose;
            } else {
                stockBasePrice = currentStockPrice * 0.96;
            }
            stockHistory.length = 0;
            for (let i = 0; i < maxHistoryPoints; i++) {
                const progress = i / (maxHistoryPoints - 1);
                const mockVal = stockBasePrice + (currentStockPrice - stockBasePrice) * progress + (Math.random() - 0.5) * 40000;
                stockHistory.push(Math.round(mockVal / 1000) * 1000);
            }
            updateStockChart();
            console.log("Successfully fetched actual SK Hynix price:", currentStockPrice);
        }
    } catch (err) {
        console.warn("Could not fetch SK Hynix price from Yahoo Finance via corsproxy, using fallback:", err);
    }
}

async function fetchRealTimeNews() {
    try {
        const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=http://feeds.bbci.co.uk/news/technology/rss.xml");
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
            const article = data.items[0];
            currentNewsArticle.title = article.title;
            currentNewsArticle.description = article.description || article.content || "";
            currentNewsArticle.source = "BBC Technology";
            
            currentNewsArticle.description = currentNewsArticle.description.replace(/<[^>]*>/g, '').trim();
            if (currentNewsArticle.description.length > 180) {
                currentNewsArticle.description = currentNewsArticle.description.substring(0, 177) + "...";
            }
            
            const newsCard = document.querySelector('.card-news');
            if (newsCard) {
                newsCard.setAttribute('data-ai-title', currentNewsArticle.title);
                newsCard.setAttribute('data-ai-desc', currentNewsArticle.description.substring(0, 100) + "...");
                
                const titleEl = newsCard.querySelector('.card-content h3');
                const descEl = newsCard.querySelector('.card-content .description');
                const sourceEl = newsCard.querySelector('.card-content .news-source');
                const imgEl = newsCard.querySelector('.card-media-news img');
                
                if (titleEl) titleEl.textContent = currentNewsArticle.title;
                if (descEl) descEl.textContent = currentNewsArticle.description;
                if (sourceEl) sourceEl.textContent = currentNewsArticle.source;
                
                if (imgEl && article.thumbnail) {
                    imgEl.src = article.thumbnail;
                }
            }
        }
    } catch (err) {
        console.warn("Could not fetch real-time news, using mock:", err);
    }
}

function initVideoPlayer() {
    const youtubeCards = document.querySelectorAll('.card-youtube');
    youtubeCards.forEach(card => {
        const playBtn = card.querySelector('.video-play-overlay');
        if (playBtn) {
            playBtn.style.cursor = 'none';
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mediaContainer = card.querySelector('.card-media-youtube');
                if (mediaContainer) {
                    mediaContainer.innerHTML = `
                        <iframe src="https://www.youtube.com/embed/DpEsHp8903g?autoplay=1" 
                                style="width: 100%; height: 100%; border: none;" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                        </iframe>
                    `;
                }
                if (activeCard === card) {
                    card.classList.remove('recognized');
                    cursorHalo.classList.remove('morph-youtube');
                    cursorIcon.innerHTML = 'select_all';
                    isScanned = false;
                    cursorState = 'idle';
                    activeCard = null;
                }
            });
        }
    });
}

// Initialization
initVideoPlayer();
window.getCurrentNewsArticle = () => currentNewsArticle;

if (isEmbedded) {
    // Sync loop for embedded iframes
    setInterval(() => {
        const parentWeather = getWeatherData();
        if (parentWeather) {
            currentWeatherData = { ...parentWeather };
            updateWeatherUI(currentWeatherData.temp, currentWeatherData.humidity, currentWeatherData.windSpeed, currentWeatherData.weatherCode, currentWeatherData.isNight);
        }
        const parentPrice = getStockPrice();
        const parentHist = getStockHistory();
        const parentBase = getStockBasePrice();
        const parentSimulation = (window.parent && typeof window.parent.getForceSimulationMode === 'function') ? window.parent.getForceSimulationMode() : false;
        forceSimulationMode = parentSimulation;
        updateMarketStatusUI();
        
        if (parentPrice && parentHist) {
            currentStockPrice = parentPrice;
            if (parentBase) stockBasePrice = parentBase;
            stockHistory.length = 0;
            stockHistory.push(...parentHist);
            updateStockChart();
        }
        const parentNews = (window.parent && typeof window.parent.getCurrentNewsArticle === 'function') ? window.parent.getCurrentNewsArticle() : null;
        if (parentNews) {
            currentNewsArticle = { ...parentNews };
            const newsCard = document.querySelector('.card-news');
            if (newsCard) {
                newsCard.setAttribute('data-ai-title', currentNewsArticle.title);
                newsCard.setAttribute('data-ai-desc', currentNewsArticle.description.substring(0, 100) + "...");
                
                const titleEl = newsCard.querySelector('.card-content h3');
                const descEl = newsCard.querySelector('.card-content .description');
                const sourceEl = newsCard.querySelector('.card-content .news-source');
                if (titleEl) titleEl.textContent = currentNewsArticle.title;
                if (descEl) descEl.textContent = currentNewsArticle.description;
                if (sourceEl) sourceEl.textContent = currentNewsArticle.source;
            }
        }
    }, 500);
} else {
    // Independent loop for main page
    fetchRealTimeWeather();
    fetchSKHynixPrice();
    fetchRealTimeNews();
    updateMarketStatusUI();
    setInterval(tickStock, 1000);
}

document.addEventListener('click', (e) => {
    const badge = e.target.closest('.market-status-badge');
    if (badge) {
        if (isKSTMarketOpen()) return;
        if (isEmbedded && window.parent && typeof window.parent.toggleSimulationMode === 'function') {
            window.parent.toggleSimulationMode();
        } else {
            forceSimulationMode = !forceSimulationMode;
            updateMarketStatusUI();
        }
    }
});
