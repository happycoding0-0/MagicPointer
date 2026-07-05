// MagicOS Interaction Engine

// DOM Elements
const cursorDot = document.getElementById('magic-cursor-dot');
const cursorHalo = document.getElementById('magic-cursor-halo');
const progressCircle = document.querySelector('.progress-ring__circle');
const cursorIcon = cursorHalo.querySelector('.cursor-icon');
const popupMenu = document.getElementById('ai-popup-menu');
const popupActionsList = document.getElementById('popup-actions-list');
const responseModal = document.getElementById('ai-response-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalTitle = document.getElementById('modal-title');
const modalLoader = document.getElementById('modal-loader');
const modalResult = document.getElementById('modal-result');

// System Clock
const systemClock = document.getElementById('system-clock');

// Windows & Shortcuts
const windows = document.querySelectorAll('.window');
const shortcuts = document.querySelectorAll('.desktop-shortcut');
const dockItems = document.querySelectorAll('.dock-item');

// Cursor State Management
const mouse = { x: 0, y: 0 };
const cursor = { dot: { x: 0, y: 0 }, halo: { x: 0, y: 0 } };
let cursorState = 'idle'; // idle, scanning, recognized, interacting, dragging
let isMagnetic = false;
let magneticCenter = { x: 0, y: 0 };
let magneticRect = null;
let magneticOptions = {};

// Linear Interpolation constant
const LERP_FACTOR = 0.16;
const CIRCLE_LENGTH = 138.2;

// Scanning variables
let activeCard = null;
let scanningTimer = null;
let isScanned = false;
let isPopupOpen = false;

// Draggable Window State
let draggedWindow = null;
let dragOffset = { x: 0, y: 0 };
let zIndexCounter = 100;

// Resizable Window State
let resizedWindow = null;
let resizeStartSize = { w: 0, h: 0 };
let resizeStartMouse = { x: 0, y: 0 };

// iframe 내 마우스 움직임을 부모(OS) 마우스 좌표계와 동기화하기 위한 전역 API
window.updateMouseCoordinates = function(x, y) {
    mouse.x = x;
    mouse.y = y;
};

// iframe 클릭 시 부모 OS의 팝업/메뉴들을 닫을 수 있게 지원하는 API
window.closeAllPopups = function() {
    if (popupMenu) popupMenu.classList.add('hidden');
    isPopupOpen = false;
};

// Initialize Cursor (center of screen)
mouse.x = window.innerWidth / 2;
mouse.y = window.innerHeight / 2;
cursor.dot.x = mouse.x;
cursor.dot.y = mouse.y;
cursor.halo.x = mouse.x;
cursor.halo.y = mouse.y;

// Mouse tracking
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    
    // Drag window execution
    if (draggedWindow) {
        let nextX = mouse.x - dragOffset.x;
        let nextY = mouse.y - dragOffset.y;
        
        // Boundaries checks
        if (nextX < 0) nextX = 0;
        if (nextY < 44) nextY = 44; // Avoid dragging above status bar
        if (nextX + draggedWindow.offsetWidth > window.innerWidth) {
            nextX = window.innerWidth - draggedWindow.offsetWidth;
        }
        if (nextY + draggedWindow.offsetHeight > window.innerHeight) {
            nextY = window.innerHeight - draggedWindow.offsetHeight;
        }
        
        draggedWindow.style.left = `${nextX}px`;
        draggedWindow.style.top = `${nextY}px`;
    }
    
    // Resize window execution
    if (resizedWindow) {
        let deltaX = mouse.x - resizeStartMouse.x;
        let deltaY = mouse.y - resizeStartMouse.y;
        
        let nextW = resizeStartSize.w + deltaX;
        let nextH = resizeStartSize.h + deltaY;
        
        // Constrain minimum dimensions
        if (nextW < 300) nextW = 300;
        if (nextH < 250) nextH = 250;
        
        // Apply sizes
        resizedWindow.style.width = `${nextW}px`;
        
        const content = resizedWindow.querySelector('.window-content');
        if (content) {
            content.style.maxHeight = `${nextH - 40}px`;
        }
    }
});

// Cursor Animation Loop
function updateCursor() {
    cursor.dot.x = mouse.x;
    cursor.dot.y = mouse.y;
    cursorDot.style.left = `${cursor.dot.x}px`;
    cursorDot.style.top = `${cursor.dot.y}px`;

    if (isMagnetic && magneticRect) {
        cursor.halo.x = lerp(cursor.halo.x, magneticCenter.x, LERP_FACTOR);
        cursor.halo.y = lerp(cursor.halo.y, magneticCenter.y, LERP_FACTOR);
    } else {
        cursor.halo.x = lerp(cursor.halo.x, mouse.x, LERP_FACTOR);
        cursor.halo.y = lerp(cursor.halo.y, mouse.y, LERP_FACTOR);
    }

    cursorHalo.style.left = `${cursor.halo.x}px`;
    cursorHalo.style.top = `${cursor.halo.y}px`;

    requestAnimationFrame(updateCursor);
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

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
        { label: '한글 번역 및 요약 (Translate & Summarize)', icon: 'g_translate', action: 'news_translation', color: '#00e5ff' },
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

// Response Simulation
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
            <p><strong>Apple Vision Pro (256GB)</strong> 최저가 검색 정보:</p>
            <table class="modal-table">
                <tr>
                    <th>쇼핑몰</th>
                    <th style="text-align: right;">가격</th>
                </tr>
                <tr>
                    <td>Apple 공식 홈페이지</td>
                    <td style="text-align: right; font-weight: 600; color: var(--purple-color);">$3,499.00</td>
                </tr>
                <tr>
                    <td>B&H Photo Video (할인 적용)</td>
                    <td style="text-align: right; font-weight: 600; color: var(--purple-color);">$3,449.00</td>
                </tr>
                <tr>
                    <td>Best Buy (Open Box - 우수 등급)</td>
                    <td style="text-align: right; font-weight: 600; color: var(--success-color);">$3,099.00</td>
                </tr>
            </table>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.75rem;">💡 공식 출고가는 $3,499이며, 베스트바이 오픈박스(리퍼브 등급)에서 최저가로 등록되어 있습니다.</p>
        `
    },
    review_summary: {
        title: 'AI 글로벌 리뷰 감성 분석',
        html: `
            <h4>구매 만족도: 4.5 / 5.0 (총 2,450건)</h4>
            <div style="margin: 0.75rem 0;">
                <div style="margin-bottom: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--success-color); font-weight: 600; display: block;">➕ 긍정 요인 (82% 비율)</span>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">"마치 눈앞에 실제 화면이 떠 있는 듯한 micro-OLED 4K 화질", "독보적인 눈 추적 및 시선 기반 제어 편리성"</p>
                </div>
                <div>
                    <span style="font-size: 0.8rem; color: var(--danger-color); font-weight: 600; display: block;">➖ 부정 요인 (18% 비율)</span>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">"장시간 사용 시 본체 앞부분 무게(약 600g)로 인한 뺨과 목의 압박", "외부 배터리팩 무선 연결 불가능 및 고가의 판매 단가"</p>
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
                <span style="font-size: 0.8rem;">차세대 모델 소문 및 리퍼비시 물량 증가 예상치</span>
                <h4 style="color: var(--success-color); font-size: 1.3rem; margin-top: 0.25rem;">💰 약 -$500 (오픈박스/리퍼브 기준 $2,900 대 진입)</h4>
            </div>
            <p style="font-size: 0.85rem; margin-top: 0.75rem;">새 제품 공식 출고가는 동결이 유력하지만, 중고나 리퍼 시장에서는 공급 과잉으로 인한 상당 폭의 시세 하락이 예측되므로 구매 시 참고 바랍니다.</p>
        `
    },
    youtube_summary: {
        title: '유튜브 타임라인 요약',
        html: `
            <h4>영상 02:35 분량 핵심 구간 요약</h4>
            <p><strong>주요 토픽별 분량 및 설명:</strong></p>
            <ul class="modal-list">
                <li class="modal-list-item-stacked">
                    <span style="color:var(--danger-color); font-weight:600;">00:00 - 00:40</span> 사과 전달 (OpenAI의 음성 종단간 추론 모델을 사용하여 앞에 있는 물건 중 먹을 수 있는 유일한 물체인 사과를 인식해 사용자에게 제공)
                </li>
                <li class="modal-list-item-stacked">
                    <span style="color:var(--danger-color); font-weight:600;">00:40 - 01:20</span> 쓰레기 정리 (바구니 안에 캔 및 쓰레기 수거 작업 수행)
                </li>
                <li class="modal-list-item-stacked">
                    <span style="color:var(--danger-color); font-weight:600;">01:20 - 02:35</span> 식기 정리 및 행동 분석 음성 설명 (식기 건조대에 컵과 그릇을 미세 위치 제어로 정리 후 자신의 인지/행동 프로세스를 자연스럽게 음성으로 설명)
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
                    <span>🔥 [00:25] 사용자가 먹을 것을 요구하자 사과를 정확하게 집어 전달하는 순간</span>
                    <span class="material-symbols-rounded" style="color:var(--danger-color); font-size:1.25rem;">play_arrow</span>
                </li>
                <li class="modal-list-item">
                    <span>🔥 [01:45] 컵을 식기 건조대에 뒤집어서 정밀하게 꽂아 놓는 고난도 제어</span>
                    <span class="material-symbols-rounded" style="color:var(--danger-color); font-size:1.25rem;">play_arrow</span>
                </li>
                <li class="modal-list-item">
                    <span>🔥 [02:10] OpenAI 음성 추론 모델을 통해 자신이 수행한 일들의 인과관계를 설명하는 구간</span>
                    <span class="material-symbols-rounded" style="color:var(--danger-color); font-size:1.25rem;">play_arrow</span>
                </li>
            </ul>
        `
    },
    youtube_translation: {
        title: '비디오 자막 번역',
        html: `
            <h4>AI 실시간 다국어 번역 스크립트</h4>
            <div class="code-output" style="max-height: 160px; overflow-y: auto; font-size:0.8rem; line-height:1.5;">[00:08] User: "Figure One, what do you see right now?"
-> 사용자: "피규어 1, 지금 앞에 무엇이 보이나요?"
Figure One: "I see a red apple on a plate in the center of the table..."
-> 피규어 1: "테이블 중앙 접시 위에 놓인 빨간 사과가 보입니다..."

[00:22] User: "Great. Can I have something to eat?"
-> 사용자: "좋아요. 먹을 것 좀 줄래요?"
Figure One: "Sure." (picks up the apple and hands it over)
-> 피규어 1: "물론이죠." (사과를 집어 전달함)

[01:15] User: "Can you explain why you just did what you did, while you empty this trash?"
-> 사용자: "쓰레기를 비우면서 방금 그 행동을 왜 했는지 설명해 줄 수 있나요?"
Figure One: "So, I gave you the apple because it's the only edible item I could provide you with from the table."
-> 피규어 1: "테이블에서 제공할 수 있는 유일한 먹을거리가 사과였기 때문에 사과를 드린 것입니다."</div>
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
    news_translation: {
        title: '실시간 뉴스 번역 및 요약',
        html: ''
    },
    stock_forecast: {
        title: 'SK하이닉스 30일 시세 전망',
        html: `
            <h4>시계열 딥러닝(LSTM) 가격 예측 모델링</h4>
            <p>개별 실적 가중치를 반영한 30일 가격 예측 추이입니다:</p>
            <div class="route-map-mock" style="height:120px; background:radial-gradient(circle at center, #112211 0%, #051105 100%); border-color:var(--success-color);">
                <span class="route-label start-lbl" style="color:var(--success-color); top: 50%;">현재가 (₩2,382,000)</span>
                <span class="route-label end-lbl" style="color:var(--success-color); top: 20%;">예측가 (₩2,585,000)</span>
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
        title: 'SK하이닉스 재무 성과',
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
                    <td style="text-align: right;">12.43조 원</td>
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
        `
    },
    stock_competitors: {
        title: '동일 반도체 기업 비교',
        html: `
            <h4>주요 반도체 기업 투자 분석 지표</h4>
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
            </table>
            <p style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.75rem; line-height:1.4;">💡 글로벌 메모리 반도체 업계에서 SK하이닉스는 강력한 HBM 제품군 수요에 힘입어 높은 영업이익률 성장세를 보이고 있습니다.</p>
        `
    }
}

// Window Dragging logic
let dragTarget = null;
let dragStartX = 0;
let dragStartY = 0;
let winStartX = 0;
let winStartY = 0;

// Setup Drag/Resize listeners on Windows
windows.forEach(win => {
    const handle = win.querySelector('.window-drag-handle');
    const resizer = win.querySelector('.window-resizer');
    
    // Mousedown on handle to start dragging
    handle.addEventListener('mousedown', (e) => {
        draggedWindow = win;
        focusWindow(win);
        
        dragOffset.x = e.clientX - win.offsetLeft;
        dragOffset.y = e.clientY - win.offsetTop;
        
        cursorState = 'dragging';
        cursorHalo.classList.add('morph-drag');
        cursorIcon.innerHTML = 'open_with';
        
        e.preventDefault();
    });
    
    // Mousedown on resizer to start resizing
    if (resizer) {
        resizer.addEventListener('mousedown', (e) => {
            resizedWindow = win;
            focusWindow(win);
            
            resizeStartSize.w = win.offsetWidth;
            resizeStartSize.h = win.offsetHeight;
            resizeStartMouse.x = e.clientX;
            resizeStartMouse.y = e.clientY;
            
            cursorState = 'resizing';
            cursorHalo.classList.add('morph-resize');
            cursorIcon.innerHTML = 'pan_tool_alt';
            
            e.preventDefault();
            e.stopPropagation(); // Avoid triggering drag
        });

        // Snap cursor to resizers
        resizer.addEventListener('mouseenter', () => {
            isMagnetic = true;
            magneticRect = resizer.getBoundingClientRect();
            magneticCenter.x = magneticRect.left + magneticRect.width / 2;
            magneticCenter.y = magneticRect.top + magneticRect.height / 2;

            cursorHalo.classList.add('magnetic');
            cursorDot.classList.add('magnetic');
            cursorHalo.style.setProperty('--magnetic-width', `18px`);
            cursorHalo.style.setProperty('--magnetic-height', `18px`);
            cursorHalo.style.setProperty('--magnetic-radius', '50%');
            cursorHalo.style.setProperty('--magnetic-color', 'var(--warning-color)');
            cursorHalo.style.setProperty('--magnetic-bg', 'rgba(251, 188, 5, 0.15)');
            cursorHalo.style.setProperty('--magnetic-glow', 'rgba(251, 188, 5, 0.2)');
        });

        resizer.addEventListener('mouseleave', () => {
            disableSnapping();
        });
    }

    // Bring clicked window to focus
    win.addEventListener('mousedown', () => {
        focusWindow(win);
    });

    // Bind app controls
    const closeBtn = win.querySelector('.win-close');
    const minimizeBtn = win.querySelector('.win-minimize');

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.remove('open');
        
        // Remove active snaps if any
        disableSnapping();
        updateDockIndicators();
    });

    closeBtn.addEventListener('mouseenter', () => {
        cursorHalo.classList.add('morph-close');
        cursorIcon.innerHTML = 'close';
    });
    closeBtn.addEventListener('mouseleave', () => {
        cursorHalo.classList.remove('morph-close');
        cursorIcon.innerHTML = 'select_all';
    });

    minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.add('minimized');
        disableSnapping();
        updateDockIndicators();
    });

    minimizeBtn.addEventListener('mouseenter', () => {
        cursorHalo.classList.add('morph-minimize');
        cursorIcon.innerHTML = 'remove';
    });
    minimizeBtn.addEventListener('mouseleave', () => {
        cursorHalo.classList.remove('morph-minimize');
        cursorIcon.innerHTML = 'select_all';
    });
});

// Drag / Resize End
window.addEventListener('mouseup', () => {
    if (draggedWindow) {
        draggedWindow = null;
        cursorState = 'idle';
        cursorHalo.classList.remove('morph-drag');
        cursorIcon.innerHTML = 'select_all';
    }
    if (resizedWindow) {
        resizedWindow = null;
        cursorState = 'idle';
        cursorHalo.classList.remove('morph-resize');
        cursorIcon.innerHTML = 'select_all';
    }
});

// App Launching Handlers
function focusWindow(win) {
    windows.forEach(w => w.classList.remove('active-focus'));
    win.classList.add('active-focus');
    
    zIndexCounter += 1;
    win.style.zIndex = zIndexCounter;
    updateDockIndicators();
}

function launchApp(appId) {
    const win = document.getElementById(`win-${appId}`);
    if (win) {
        win.classList.remove('minimized');
        win.classList.add('open');
        focusWindow(win);
    }
}

// Bind Shortcuts
shortcuts.forEach(sc => {
    const app = sc.getAttribute('data-app');
    
    // Double click to open
    sc.addEventListener('dblclick', () => {
        launchApp(app);
    });

    // Touch/click fallback
    sc.addEventListener('click', (e) => {
        // Just trigger single click if double click is too slow
    });

    // Magnetic dock feel on desktop shortcuts too? 
    // Yes! Subtle hover zoom
});

// Bind Dock Items
dockItems.forEach(item => {
    const app = item.getAttribute('data-app');
    
    item.addEventListener('click', () => {
        const win = document.getElementById(`win-${app}`);
        if (win && win.classList.contains('open') && !win.classList.contains('minimized')) {
            // If focused, minimize it
            if (win.classList.contains('active-focus')) {
                win.classList.add('minimized');
            } else {
                focusWindow(win);
            }
        } else {
            launchApp(app);
        }
    });

    // Magnetic snaps for Dock Items
    item.addEventListener('mouseenter', () => {
        isMagnetic = true;
        magneticRect = item.getBoundingClientRect();
        
        magneticCenter.x = magneticRect.left + magneticRect.width / 2;
        magneticCenter.y = magneticRect.top + magneticRect.height / 2;

        let themeColor = 'var(--primary-color)';
        if (app === 'travel') themeColor = 'var(--success-color)';
        if (app === 'document') themeColor = 'var(--primary-color)';
        if (app === 'weather') themeColor = 'var(--warning-color)';
        if (app === 'media') themeColor = 'var(--danger-color)';
        if (app === 'market') themeColor = 'var(--success-color)';
        if (app === 'editorial') themeColor = 'var(--cyan-color)';

        cursorHalo.classList.add('magnetic');
        cursorDot.classList.add('magnetic');
        cursorHalo.style.setProperty('--magnetic-width', `${magneticRect.width + 8}px`);
        cursorHalo.style.setProperty('--magnetic-height', `${magneticRect.height + 8}px`);
        cursorHalo.style.setProperty('--magnetic-radius', `16px`);
        cursorHalo.style.setProperty('--magnetic-color', themeColor);
        cursorHalo.style.setProperty('--magnetic-bg', 'rgba(255,255,255,0.02)');
        cursorHalo.style.setProperty('--magnetic-glow', `rgba(255,255,255,0.05)`);
    });

    item.addEventListener('mouseleave', () => {
        disableSnapping();
    });
});

// Bind Diagnostic Widgets in Status Bar
const widgets = document.querySelectorAll('.status-widget');
widgets.forEach(w => {
    w.addEventListener('mouseenter', () => {
        isMagnetic = true;
        magneticRect = w.getBoundingClientRect();
        
        magneticCenter.x = magneticRect.left + magneticRect.width / 2;
        magneticCenter.y = magneticRect.top + magneticRect.height / 2;

        cursorHalo.classList.add('magnetic');
        cursorDot.classList.add('magnetic');
        cursorHalo.style.setProperty('--magnetic-width', `${magneticRect.width + 10}px`);
        cursorHalo.style.setProperty('--magnetic-height', `${magneticRect.height + 6}px`);
        cursorHalo.style.setProperty('--magnetic-radius', `8px`);
        cursorHalo.style.setProperty('--magnetic-color', 'var(--primary-color)');
        cursorHalo.style.setProperty('--magnetic-bg', 'rgba(66, 133, 244, 0.08)');
        cursorHalo.style.setProperty('--magnetic-glow', `rgba(66, 133, 244, 0.2)`);
    });

    w.addEventListener('mouseleave', () => {
        disableSnapping();
    });
});

function disableSnapping() {
    isMagnetic = false;
    magneticRect = null;
    cursorHalo.classList.remove('magnetic');
    cursorDot.classList.remove('magnetic');
    // reset variables
    cursorHalo.style.removeProperty('--magnetic-width');
    cursorHalo.style.removeProperty('--magnetic-height');
    cursorHalo.style.removeProperty('--magnetic-radius');
    cursorHalo.style.removeProperty('--magnetic-color');
    cursorHalo.style.removeProperty('--magnetic-bg');
    cursorHalo.style.removeProperty('--magnetic-glow');
}

// 4. Element Hover Scanner & AI Recognition (Shared cards logic)
const cards = document.querySelectorAll('.sim-card');

function resetScanning() {
    clearTimeout(scanningTimer);
    cursorHalo.classList.remove('scanning');
    progressCircle.style.transition = 'none';
    progressCircle.style.strokeDashoffset = CIRCLE_LENGTH;
}

cards.forEach(card => {
    const cardType = card.getAttribute('data-ai-type');
    
    card.addEventListener('mouseenter', () => {
        if (isPopupOpen || cursorState === 'interacting' || cursorState === 'dragging') return;
        
        activeCard = card;
        cursorState = 'scanning';
        cursorHalo.classList.add('scanning');
        card.classList.add('scanning');

        setTimeout(() => {
            if (cursorState === 'scanning') {
                progressCircle.style.transition = 'stroke-dashoffset 600ms linear';
                progressCircle.style.strokeDashoffset = '0';
            }
        }, 10);

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

        scanningTimer = setTimeout(() => {
            if (activeCard === card) {
                triggerRecognition(card, cardType);
            }
        }, 600);
    });

    card.addEventListener('mouseleave', () => {
        card.classList.remove('scanning');
        
        if (isPopupOpen && activeCard === card) return;

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

    card.addEventListener('click', (e) => {
        if (isScanned && activeCard === card) {
            e.stopPropagation();
            openActionMenu(e.clientX, e.clientY, cardType);
        }
    });
});

function triggerRecognition(card, type) {
    resetScanning();
    isScanned = true;
    cursorState = 'recognized';
    cursorHalo.classList.add(`morph-${type}`);
    
    if (type === 'image') cursorIcon.innerHTML = 'crop_free';
    else if (type === 'text') cursorIcon.innerHTML = 'edit_note';
    else if (type === 'weather') cursorIcon.innerHTML = 'radar';
    else if (type === 'product') cursorIcon.innerHTML = 'sell';
    else if (type === 'youtube') cursorIcon.innerHTML = 'play_arrow';
    else if (type === 'news') cursorIcon.innerHTML = 'verified';
    else if (type === 'stock') cursorIcon.innerHTML = 'trending_up';
    
    card.classList.add('recognized');
}

// 5. Context Actions Popup Menu
function openActionMenu(x, y, type) {
    isPopupOpen = true;
    cursorState = 'interacting';
    popupActionsList.innerHTML = '';

    const actions = AI_ACTIONS[type] || [];
    actions.forEach(act => {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.style.setProperty('--btn-hover-color', act.color);
        btn.innerHTML = `
            <span class="material-symbols-rounded">${act.icon}</span>
            <span>${act.label}</span>
        `;
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            executeAIAction(act.action, act.color);
        });

        // Snap to option buttons
        btn.addEventListener('mouseenter', () => {
            isMagnetic = true;
            magneticRect = btn.getBoundingClientRect();
            magneticCenter.x = magneticRect.left + magneticRect.width / 2;
            magneticCenter.y = magneticRect.top + magneticRect.height / 2;

            cursorHalo.classList.add('magnetic');
            cursorDot.classList.add('magnetic');
            cursorHalo.style.setProperty('--magnetic-width', `${magneticRect.width}px`);
            cursorHalo.style.setProperty('--magnetic-height', `${magneticRect.height}px`);
            cursorHalo.style.setProperty('--magnetic-radius', '8px');
            cursorHalo.style.setProperty('--magnetic-color', act.color);
            cursorHalo.style.setProperty('--magnetic-bg', 'rgba(255,255,255,0.03)');
            cursorHalo.style.setProperty('--magnetic-glow', `rgba(255,255,255,0.02)`);
        });

        btn.addEventListener('mouseleave', () => {
            disableSnapping();
        });

        popupActionsList.appendChild(btn);
    });

    popupMenu.classList.remove('hidden');
    
    const menuWidth = 235;
    const menuHeight = popupMenu.offsetHeight || 160;
    let posX = x + 15;
    let posY = y + 15;
    
    if (posX + menuWidth > window.innerWidth) posX = x - menuWidth - 15;
    if (posY + menuHeight > window.innerHeight) posY = y - menuHeight - 15;

    popupMenu.style.left = `${posX}px`;
    popupMenu.style.top = `${posY}px`;
    
    setTimeout(() => {
        popupMenu.classList.add('show');
    }, 10);
}

function closeActionMenu() {
    isPopupOpen = false;
    popupMenu.classList.remove('show');
    setTimeout(() => {
        popupMenu.classList.add('hidden');
    }, 200);

    disableSnapping();

    if (activeCard) {
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
            cursorState = 'recognized';
        }
    } else {
        cursorState = 'idle';
    }
}

window.addEventListener('click', (e) => {
    if (isPopupOpen && !popupMenu.contains(e.target)) {
        closeActionMenu();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (isPopupOpen) closeActionMenu();
        if (!responseModal.classList.contains('hidden')) closeModal();
    }
});

// 6. Action Execution Simulation
function executeAIAction(action, themeColor) {
    closeActionMenu();

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
        detectUserLocation();
        ACTION_RESPONSES.find_route.html = getFindRouteHTML();
    } else if (action === 'visual_search') {
        ACTION_RESPONSES.visual_search.html = getVisualSearchHTML();
    } else if (action === 'translate_sign') {
        ACTION_RESPONSES.translate_sign.html = getTranslateSignHTML();
    } else if (action === 'news_verification') {
        ACTION_RESPONSES.news_verification.html = getNewsVerificationHTML();
    } else if (action === 'news_translation') {
        prepareNewsTranslation();
    } else if (action === 'news_bias') {
        ACTION_RESPONSES.news_bias.html = getNewsBiasHTML();
    } else if (action === 'news_coverage') {
        ACTION_RESPONSES.news_coverage.html = getNewsCoverageHTML();
    }
    
    responseModal.classList.remove('hidden');
    setTimeout(() => {
        responseModal.classList.add('show');
    }, 10);

    modalLoader.classList.remove('hidden');
    modalResult.classList.add('hidden');

    const res = ACTION_RESPONSES[action];
    modalTitle.textContent = res ? res.title : 'AI 처리 결과';

    setTimeout(() => {
        modalLoader.classList.add('hidden');
        modalResult.classList.remove('hidden');
        
        if (res) {
            modalResult.innerHTML = res.html;
            if (action === 'find_route') {
                startRouteSimulation();
            }
        } else {
            modalResult.innerHTML = `<p>요청하신 작업이 성공적으로 처리되었습니다.</p>`;
        }
    }, 1200);
}

let userCurrentLocationName = "개찰구 (B2F)";
let hasDetectedLocation = false;

function detectUserLocation() {
    if (hasDetectedLocation) return;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=ko`, {
                        headers: {
                            'Accept-Language': 'ko'
                        }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.address) {
                            const addr = data.address;
                            const neighborhood = addr.neighbourhood || addr.suburb || addr.town || addr.village || addr.city_district || addr.borough || addr.city || "현재 위치";
                            userCurrentLocationName = neighborhood;
                            hasDetectedLocation = true;
                            console.log("User location detected via reverse geocoding:", userCurrentLocationName);
                            updateRouteStartLabel(userCurrentLocationName);
                        }
                    }
                } catch (e) {
                    console.warn("Reverse geocoding query failed:", e);
                    userCurrentLocationName = `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`;
                    hasDetectedLocation = true;
                    updateRouteStartLabel(userCurrentLocationName);
                }
            },
            (err) => {
                console.warn("Geolocation permission or reading failed:", err);
            },
            { timeout: 6000 }
        );
    }
}

function updateRouteStartLabel(locName) {
    const startNodeEl = document.getElementById('route-start-node');
    if (startNodeEl) {
        startNodeEl.textContent = locName;
    }
}

let routeSimInterval = null;
function startRouteSimulation() {
    if (routeSimInterval) clearInterval(routeSimInterval);
    const dot = document.getElementById('routing-dot');
    const progressBar = document.getElementById('route-progress-bar');
    const pathProgress = document.getElementById('route-progress-path');
    const stepTitle = document.getElementById('step-title');
    const stepDesc = document.getElementById('step-desc');
    
    if (!dot || !progressBar || !stepTitle) return;
    
    const startNodeText = userCurrentLocationName || "개찰구 (B2F)";
    const steps = [
        {
            title: `1단계: ${startNodeText} 출발 (출발지)`,
            desc: `${startNodeText}에서 동대문디자인플라자(DDP)로 이동하기 위한 최적 보행/교통 경로 탐색을 완료했습니다.`,
            left: "45px",
            top: "45px",
            progress: "0%",
            dashoffset: "300"
        },
        {
            title: "2단계: 동대문역사문화공원역 하차 후 진입",
            desc: "지하철 2/4/5호선 하차 후 DDP 1번 출구 연결 통로로 진입합니다. 안내 표지판을 따라 무장애 통로로 이동하세요.",
            left: "97px",
            top: "62px",
            progress: "33%",
            dashoffset: "200"
        },
        {
            title: "3단계: DDP 지하 연결 어울림광장 진입",
            desc: "야외 원형 지하광장인 어울림광장에 진입했습니다. 미래 우주선 형태의 비정형 곡면 노출 콘크리트 전경이 나타납니다.",
            left: "150px",
            top: "80px",
            progress: "66%",
            dashoffset: "150"
        },
        {
            title: "4단계: DDP 배움터 B2F 입구 도착",
            desc: "어울림광장을 지나 배움터(Museum) 지하 2층 대형 입구에 최종 도착했습니다. 단차가 없는 편리한 보행로입니다.",
            left: "255px",
            top: "45px",
            progress: "100%",
            dashoffset: "0"
        }
    ];
    
    let currentStep = 0;
    const runStep = () => {
        const step = steps[currentStep];
        dot.style.left = step.left;
        dot.style.top = step.top;
        progressBar.style.width = step.progress;
        if (pathProgress) {
            pathProgress.style.strokeDashoffset = step.dashoffset;
        }
        stepTitle.textContent = step.title;
        stepDesc.textContent = step.desc;
        currentStep = (currentStep + 1) % steps.length;
    };
    
    runStep();
    routeSimInterval = setInterval(runStep, 3500);
}

// Modal closing
function closeModal() {
    responseModal.classList.remove('show');
    if (routeSimInterval) {
        clearInterval(routeSimInterval);
        routeSimInterval = null;
    }
    setTimeout(() => {
        responseModal.classList.add('hidden');
    }, 300);
}

closeModalBtn.addEventListener('click', closeModal);
responseModal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

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
    cursorHalo.style.setProperty('--magnetic-radius', '50%');
});

closeModalBtn.addEventListener('mouseleave', () => {
    disableSnapping();
});

// 7. System Clock Updater
function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    systemClock.textContent = `${hours}:${minutes} ${ampm}`;
    updateMarketStatusUI();
}
setInterval(updateTime, 1000);
updateTime();

// 8. Dock Active Indicators Syncer
function updateDockIndicators() {
    dockItems.forEach(item => {
        const app = item.getAttribute('data-app');
        const win = document.getElementById(`win-${app}`);
        
        // Reset classes
        item.classList.remove('running', 'focused');
        
        if (win && win.classList.contains('open') && !win.classList.contains('minimized')) {
            item.classList.add('running');
            if (win.classList.contains('active-focus')) {
                item.classList.add('focused');
            }
        }
    });
}

// 9. Neural Load Live Sparkline Generator
const sparklinePath = document.getElementById('sparkline-path');
const loadText = document.getElementById('load-text');

function updateNeuralLoad() {
    if (!sparklinePath || !loadText) return;
    const loadVal = Math.floor(Math.random() * 21) + 15; // 15% to 35%
    loadText.textContent = `${loadVal}%`;
    
    // Generate random wavy path points for SVG (viewBox 0 0 36 14)
    const p1 = Math.floor(Math.random() * 8) + 3; // y at x=0 (3 to 10)
    const p2 = Math.floor(Math.random() * 8) + 3; // control y at x=9
    const p3 = Math.floor(Math.random() * 8) + 3; // y at x=18
    const p4 = Math.floor(Math.random() * 8) + 3; // control y at x=27
    const p5 = Math.floor(Math.random() * 8) + 3; // y at x=36
    
    const pathD = `M 0 ${p1} Q 9 ${p2}, 18 ${p3} T 36 ${p5}`;
    sparklinePath.setAttribute('d', pathD);
}
setInterval(updateNeuralLoad, 1500);
updateNeuralLoad();

// 10. System Theme Switcher
const themeToggle = document.getElementById('widget-theme');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const icon = themeToggle.querySelector('.theme-icon');
        
        // iframe 내부 문서도 같이 라이트 테마 토글 동기화
        const iframe = document.getElementById('dashboard-iframe');
        if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
            if (document.body.classList.contains('light-theme')) {
                iframe.contentDocument.body.classList.add('light-theme');
            } else {
                iframe.contentDocument.body.classList.remove('light-theme');
            }
        }

        if (document.body.classList.contains('light-theme')) {
            icon.textContent = 'light_mode';
        } else {
            icon.textContent = 'dark_mode';
        }
    });
}

// Spawn default windows open on load
window.addEventListener('load', () => {
    // Open Travel and AI Reader apps by default to populate desktop nicely
    setTimeout(() => launchApp('travel'), 400);
    setTimeout(() => launchApp('document'), 800);
    setTimeout(updateDockIndicators, 1000);
});


// --- Real-time API Integration (Weather & Stock) ---

// Weather State
let currentWeatherData = { temp: 26, humidity: 72, windSpeed: 3.2, weatherCode: 3, isNight: true };

// Stock State
let currentStockPrice = 2382000;
let stockBasePrice = 2288000;
const stockHistory = [];
const maxHistoryPoints = 15;
function getKSTMarketStatus() {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Seoul',
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            weekday: 'short',
            hour12: false
        });
        const parts = formatter.formatToParts(new Date());
        const val = {};
        parts.forEach(p => val[p.type] = p.value);
        
        const weekdayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
        const day = weekdayMap[val.weekday];
        const hours = parseInt(val.hour, 10);
        const minutes = parseInt(val.minute, 10);
        
        if (day === 0 || day === 6) return 'closed';
        const timeVal = hours * 100 + minutes;
        if (timeVal >= 900 && timeVal <= 1530) return 'regular';
        if ((timeVal >= 800 && timeVal < 900) || (timeVal > 1530 && timeVal <= 1800)) return 'prepost';
        return 'closed';
    } catch (e) {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const kst = new Date(utc + (3600000 * 9));
        const day = kst.getDay();
        const hours = kst.getHours();
        const minutes = kst.getMinutes();
        if (day === 0 || day === 6) return 'closed';
        const timeVal = hours * 100 + minutes;
        if (timeVal >= 900 && timeVal <= 1530) return 'regular';
        if ((timeVal >= 800 && timeVal < 900) || (timeVal > 1530 && timeVal <= 1800)) return 'prepost';
        return 'closed';
    }
}

function isKSTMarketOpen() {
    const status = getKSTMarketStatus();
    return status === 'regular' || status === 'prepost';
}

function updateMarketStatusUI() {
    const status = getKSTMarketStatus();
    const badges = document.querySelectorAll('.market-status-badge');
    badges.forEach(badge => {
        if (status === 'regular') {
            badge.textContent = '● 장중 실시간';
            badge.className = 'market-status-badge open';
            badge.title = '한국 표준시(KST) 정규 거래 시간 내 실시간 시세 반영 중 (09:00 - 15:30)';
        } else if (status === 'prepost') {
            badge.textContent = '● 장외 거래';
            badge.className = 'market-status-badge prepost';
            badge.title = '한국 표준시(KST) 시간외 거래 시간 (08:00-09:00 / 15:30-18:00)';
        } else {
            badge.textContent = '● 장마감';
            badge.className = 'market-status-badge closed';
            badge.title = '정규 및 시간외 거래 마감 (평일 09:00 - 15:30 개장)';
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

// Expose variables globally for same-origin iframe sync
window.getCurrentStockPrice = () => currentStockPrice;
window.getCurrentStockHistory = () => stockHistory;
window.getCurrentStockBasePrice = () => stockBasePrice;
window.getCurrentWeatherData = () => currentWeatherData;

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
    
    const timeStampEl = weatherCard.querySelector('.weather-time-stamp');
    if (timeStampEl) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const sec = String(now.getSeconds()).padStart(2, '0');
        timeStampEl.textContent = `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
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

    const price = currentStockPrice;
    const hist = stockHistory;
    const isUp = price >= stockBasePrice;

    if (priceEl) priceEl.textContent = `₩${Math.round(price).toLocaleString()}`;
    
    const changeVal = price - stockBasePrice;
    const changePercent = (changeVal / stockBasePrice) * 100;
    
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
    updateMarketStatusUI();
}

// Real-time weather/stock dynamic AI reports
function getClimateReportHTML() {
    const data = currentWeatherData;
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
    const temp = currentWeatherData.temp;
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

// Real-time weather/stock dynamic AI reports (OS version)
function getActivityScoreHTML() {
    const data = currentWeatherData;
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
    const price = currentStockPrice;
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
    const price = currentStockPrice;
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
        <h4>DDP 지하철 출구 연계 실시간 보행 경로</h4>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem;">
            동대문역사문화공원역 <strong>1번 출구</strong>에서 배움터(Museum) 지하 2층 입구까지의 무장애 보행 경로 시뮬레이션입니다.
        </p>
        
        <div class="route-simulation-container" style="position:relative; margin-bottom:1rem;">
            <div class="route-map-mock" style="height:120px; position:relative; background:rgba(12, 15, 23, 0.4); border:1px solid var(--modal-item-border); border-radius:12px; overflow:hidden;">
                <!-- Grid lines to look like architectural blueprint -->
                <div style="position:absolute; inset:0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 15px 15px;"></div>
                
                <span class="route-label start-lbl" id="route-start-node" style="position:absolute; left:20px; top:25px; font-size:0.75rem; color:var(--primary-color); font-weight:600;">${userCurrentLocationName}</span>
                <span class="route-label mid-lbl" style="position:absolute; left:135px; top:85px; font-size:0.75rem; color:var(--warning-color); font-weight:600;">어울림광장</span>
                <span class="route-label end-lbl" style="position:absolute; right:20px; top:25px; font-size:0.75rem; color:var(--success-color); font-weight:600;">배움터 입구</span>
                
                <svg width="100%" height="100%" style="position:absolute; inset:0; overflow:visible;">
                    <!-- Static Path -->
                    <path id="route-path" d="M 45 45 L 150 80 L 255 45" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4" stroke-linecap="round"/>
                    <!-- Active animated progress path -->
                    <path id="route-progress-path" d="M 45 45 L 150 80 L 255 45" fill="none" stroke="var(--primary-color)" stroke-width="4" stroke-linecap="round" stroke-dasharray="300" stroke-dashoffset="300"/>
                    
                    <!-- Nodes -->
                    <circle cx="45" cy="45" r="6" fill="var(--primary-color)" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
                    <circle cx="150" cy="80" r="6" fill="var(--warning-color)" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
                    <circle cx="255" cy="45" r="6" fill="var(--success-color)" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
                </svg>
                
                <!-- Animated avatar or dot -->
                <div id="routing-dot" style="position:absolute; width:12px; height:12px; background:var(--cyan-color); border:2px solid #fff; border-radius:50%; box-shadow:0 0 10px var(--cyan-color); transform:translate(-50%, -50%); left:45px; top:45px; transition: left 0.8s ease, top 0.8s ease;"></div>
            </div>
            
            <div class="progress-bar-container" style="height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; margin-top:0.5rem;">
                <div id="route-progress-bar" style="width:0%; height:100%; background:linear-gradient(90deg, var(--primary-color), var(--cyan-color)); transition: width 0.8s ease;"></div>
            </div>
        </div>
        
        <div class="route-steps" style="background:rgba(255,255,255,0.03); border:1px solid var(--modal-item-border); border-radius:8px; padding:12px;">
            <div id="step-title" style="font-size:0.9rem; font-weight:600; color:var(--cyan-color); margin-bottom:4px;">시뮬레이션 대기 중...</div>
            <div id="step-desc" style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">경로 안내를 시작합니다.</div>
        </div>
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

async function translateText(text) {
    if (!text) return "";
    const trimmed = text.trim();
    if (trimmed === "Global Green Energy Transition Reaches Critical Milestone") {
        return "전세계 친환경 에너지 전환, 중대한 이정표 도달";
    }
    if (trimmed.startsWith("Renewable energy installations have officially surpassed")) {
        return "1분기 주요 전력망에서 신재생 에너지 설비 용량이 사상 처음으로 화석 연료 배포량을 추월했으며, 이는 기존 예측 모델보다 빠른 피벗을 나타냅니다.";
    }
    
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data && data[0]) {
                return data[0].map(item => item[0]).join('');
            }
        }
    } catch (e) {
        console.warn("Direct translation fetch failed, trying proxy:", e);
    }
    
    try {
        const url = `https://corsproxy.io/?url=` + encodeURIComponent(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(trimmed)}`);
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data && data[0]) {
                return data[0].map(item => item[0]).join('');
            }
        }
    } catch (e) {
        console.warn("Proxy translation fetch failed, using fallback:", e);
    }
    
    return fallbackTranslate(trimmed);
}

function fallbackTranslate(text) {
    let t = text;
    const dict = {
        "Global Green Energy Transition Reaches Critical Milestone": "전세계 친환경 에너지 전환, 중대한 이정표 도달",
        "Renewable energy installations have officially surpassed fossil fuel deployment in major grids for the first quarter, signaling a faster pivot than previously projected by models.": "1분기 주요 전력망에서 신재생 에너지 설비 용량이 사상 처음으로 화석 연료 배포량을 추월했으며, 이는 기존 예측 모델보다 빠른 피벗을 나타냅니다.",
        "Transition": "전환",
        "Milestone": "이정표",
        "Renewable": "신재생",
        "energy": "에너지",
        "fossil fuel": "화석 연료",
        "deployment": "배포/설치",
        "surpassed": "추월함",
        "projected": "예측된",
        "models": "모델",
        "Silicon": "실리콘",
        "Semiconductor": "반도체",
        "Quantum": "양자",
        "Computing": "컴퓨팅",
        "Artificial Intelligence": "인공지능",
        "Intelligence": "지능",
        "Robotics": "로봇공학",
        "Robot": "로봇",
        "announced": "발표함",
        "launches": "출시함",
        "unveils": "공개함",
        "shares": "주가/공유",
        "stocks": "주식",
        "earnings": "실적",
        "quarter": "분기",
        "revenue": "매출",
        "profit": "이익",
        "company": "기업",
        "technology": "기술",
        "system": "시스템",
        "chip": "칩",
        "processor": "프로세서",
        "Nvidia": "엔비디아",
        "Apple": "애플",
        "Google": "구글",
        "Microsoft": "마이크로소프트",
        "Samsung": "삼성",
        "Intel": "인텔"
    };
    const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        const regex = new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        t = t.replace(regex, dict[key]);
    }
    return t;
}

function generateSummaryPoints(translatedTitle, translatedDesc) {
    if (translatedTitle.includes("친환경 에너지") || translatedTitle.includes("Green Energy")) {
        return [
            "신재생 에너지의 도약: 올해 1분기 주요 전력망에서 태양광 및 풍력 등 신재생 에너지 설치량이 사상 처음으로 화석 연료를 추월했습니다.",
            "예측보다 빠른 피벗: 글로벌 탄소 배출 저감 및 신재생 그리드 구축 속도가 기후 학계의 예측 모델보다 훨씬 빠르게 진행되고 있습니다.",
            "지속 가능한 패러다임: 주요 선진국들의 전력망 체질이 환경 친화적 및 영구적 자립 에너지 시스템으로 급속히 재편되고 있음을 의미합니다."
        ];
    }
    
    const sentences = translatedDesc.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
    const p1 = `주요 동향: ${translatedTitle} 관련하여 신규 테크 트렌드 분석 보고가 발행되었습니다.`;
    const p2 = sentences[0] ? `핵심 팩트: ${sentences[0]}.` : "핵심 분석: 보도 자료에 서술된 주요 지표와 팩트 검증이 완료되었습니다.";
    const p3 = sentences[1] ? `산업적 영향: ${sentences[1]}.` : "산업적 전망: 본 발표가 글로벌 시장 및 생태계 미칠 파급력을 주목할 필요가 있습니다.";
    
    return [p1, p2, p3];
}

async function prepareNewsTranslation() {
    const title = currentNewsArticle.title;
    const desc = currentNewsArticle.description;
    
    ACTION_RESPONSES.news_translation.html = `
        <div style="text-align: center; padding: 1.5rem 0;">
            <div class="loader-spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px;"></div>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">실시간 뉴스를 번역 및 3줄 요약 생성 중입니다...</p>
        </div>
    `;
    
    const modalResult = document.getElementById('modal-result');
    if (modalResult) {
        modalResult.innerHTML = ACTION_RESPONSES.news_translation.html;
    }
    
    try {
        const translatedTitle = await translateText(title);
        const translatedDesc = await translateText(desc);
        const summaryPoints = generateSummaryPoints(translatedTitle, translatedDesc);
        
        ACTION_RESPONSES.news_translation.html = `
            <h4>📰 실시간 뉴스 한글 요약 및 번역</h4>
            <div style="margin-bottom: 0.75rem; border-bottom: 1px solid var(--modal-item-border); padding-bottom: 0.75rem;">
                <span style="font-size: 0.7rem; color: var(--cyan-color); font-weight: 600; display: block; margin-bottom: 0.25rem;">[원문] ${currentNewsArticle.source || "BBC Technology"}</span>
                <strong style="font-size: 0.9rem; line-height: 1.4; display: block; margin-bottom: 0.4rem; color: #fff;">${title}</strong>
                <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin: 0;">${desc}</p>
            </div>
            
            <div style="margin-bottom: 0.75rem; background: rgba(0, 229, 255, 0.04); border: 1px solid rgba(0, 229, 255, 0.12); padding: 0.6rem; border-radius: 8px;">
                <span style="font-size: 0.7rem; color: var(--cyan-color); font-weight: 600; display: block; margin-bottom: 0.25rem;">[한글 번역]</span>
                <strong style="font-size: 0.9rem; line-height: 1.4; display: block; margin-bottom: 0.4rem; color: #fff;">${translatedTitle}</strong>
                <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin: 0;">${translatedDesc}</p>
            </div>
            
            <div>
                <span style="font-size: 0.7rem; color: var(--success-color); font-weight: 600; display: block; margin-bottom: 0.4rem;">[AI 3줄 요약]</span>
                <ul style="margin: 0; padding-left: 0; list-style: none;">
                    <li style="font-size: 0.8rem; line-height: 1.4; margin-bottom: 0.4rem; display: flex; align-items: flex-start; gap: 6px;">
                        <span style="color: var(--success-color); font-weight: 700;">1.</span>
                        <span>${summaryPoints[0]}</span>
                    </li>
                    <li style="font-size: 0.8rem; line-height: 1.4; margin-bottom: 0.4rem; display: flex; align-items: flex-start; gap: 6px;">
                        <span style="color: var(--success-color); font-weight: 700;">2.</span>
                        <span>${summaryPoints[1]}</span>
                    </li>
                    <li style="font-size: 0.8rem; line-height: 1.4; display: flex; align-items: flex-start; gap: 6px;">
                        <span style="color: var(--success-color); font-weight: 700;">3.</span>
                        <span>${summaryPoints[2]}</span>
                    </li>
                </ul>
            </div>
        `;
        
        const modalLoader = document.getElementById('modal-loader');
        if (modalLoader && modalLoader.classList.contains('hidden') && modalResult) {
            modalResult.innerHTML = ACTION_RESPONSES.news_translation.html;
        }
    } catch (err) {
        console.error("News translation failed:", err);
        ACTION_RESPONSES.news_translation.html = `
            <p>실시간 번역을 수행하는 도중 에러가 발생했습니다. 원문 텍스트를 참고해 주세요.</p>
        `;
        if (modalResult) {
            modalResult.innerHTML = ACTION_RESPONSES.news_translation.html;
        }
    }
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
            console.log("Successfully fetched actual SK Hynix price in OS:", currentStockPrice);
        }
    } catch (err) {
        console.warn("Could not fetch SK Hynix price in OS, using fallback:", err);
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
            
            const newsCard = document.querySelector('#win-editorial .card-news');
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
        console.warn("Could not fetch real-time news in OS, using mock:", err);
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

fetchRealTimeWeather();
fetchSKHynixPrice();
fetchRealTimeNews();
updateMarketStatusUI();
setInterval(tickStock, 1000);

// Periodic API Polling (Real-time updates)
setInterval(() => {
    fetchRealTimeWeather();
}, 300000);

setInterval(() => {
    const status = getKSTMarketStatus();
    if (status === 'regular' || status === 'prepost') {
        fetchSKHynixPrice();
    }
}, 15000);

setInterval(() => {
    fetchRealTimeNews();
}, 180000);
