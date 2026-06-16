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
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                <li style="background: rgba(255,255,255,0.03); padding: 0.5rem; border-radius: 8px; display: flex; justify-content: space-between;">
                    <span>🌲 핀란드 버블 리조트 (Kakslauttanen)</span>
                    <strong style="color: var(--primary-color);">94% 일치</strong>
                </li>
                <li style="background: rgba(255,255,255,0.03); padding: 0.5rem; border-radius: 8px; display: flex; justify-content: space-between;">
                    <span>🌴 코스타리카 바이오스피어 돔</span>
                    <strong style="color: var(--primary-color);">89% 일치</strong>
                </li>
                <li style="background: rgba(255,255,255,0.03); padding: 0.5rem; border-radius: 8px; display: flex; justify-content: space-between;">
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
            <p style="border-left: 3px solid var(--success-color); padding-left: 0.75rem; font-style: italic; color: #e2e8f0;">
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
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0.75rem 0;">
                <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 8px; text-align: center;">
                    <span style="font-size:0.75rem; color:var(--text-secondary);">체감 온도</span>
                    <h5 style="font-size:1.1rem; margin-top:0.25rem;">28.2°C</h5>
                </div>
                <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 8px; text-align: center;">
                    <span style="font-size:0.75rem; color:var(--text-secondary);">열대야 가능성</span>
                    <h5 style="font-size:1.1rem; margin-top:0.25rem; color: var(--warning-color);">중간 (40%)</h5>
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
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <span style="background: rgba(251, 188, 5, 0.1); border: 1px solid rgba(251, 188, 5, 0.2); padding: 0.5rem; border-radius: 8px; flex: 1; text-align: center; font-size: 0.85rem;">
                    👕 상의<br>린넨 셔츠 / 반팔티
                </span>
                <span style="background: rgba(251, 188, 5, 0.1); border: 1px solid rgba(251, 188, 5, 0.2); padding: 0.5rem; border-radius: 8px; flex: 1; text-align: center; font-size: 0.85rem;">
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
            <ul style="list-style: none; margin-top: 0.5rem; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.35rem;">
                <li>🚶‍♂️ 밤 산책 (가벼운 워킹) : <span style="color:var(--success-color);">최적 (90%)</span></li>
                <li>🏃‍♂️ 실외 런닝 : <span style="color:var(--warning-color);">보통 (50%)</span></li>
                <li>🚴 야외 사이클 : <span style="color:var(--warning-color);">보통 (55%)</span></li>
            </ul>
        `
    },
    compare_price: {
        title: 'AI 스마트 가격 비교',
        html: `
            <h4>전체 유통사 실시간 크롤링</h4>
            <p><strong>Nova Chronograph V2</strong> 최저가 검색 정보:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.85rem;">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); text-align: left;">
                    <th style="padding: 0.4rem 0;">쇼핑몰</th>
                    <th style="padding: 0.4rem 0; text-align: right;">가격</th>
                </tr>
                <tr>
                    <td style="padding: 0.4rem 0;">아마존 직구 (Prime)</td>
                    <td style="padding: 0.4rem 0; text-align: right; font-weight: 600; color: var(--purple-color);">$289.00</td>
                </tr>
                <tr>
                    <td style="padding: 0.4rem 0;">공식 파트너샵 (쿠폰 적용)</td>
                    <td style="padding: 0.4rem 0; text-align: right; text-decoration: line-through;">$299.00</td>
                </tr>
                <tr>
                    <td style="padding: 0.4rem 0;">이베이 셀러샵 (미개봉 새제품)</td>
                    <td style="padding: 0.4rem 0; text-align: right; font-weight: 600; color: var(--purple-color);">$274.50</td>
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
                    <span style="font-size: 0.8rem; color: var(--success-color);">➕ 긍정 요인 (85% 비율)</span>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">"홀로그램 투사 시인성이 낮 밤 가리지 않고 뛰어남", "고급스러운 베젤 마감"</p>
                </div>
                <div>
                    <span style="font-size: 0.8rem; color: var(--danger-color);">➖ 부정 요인 (15% 비율)</span>
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
            <div style="background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 8px; text-align: center; margin: 0.5rem 0; border: 1px dashed rgba(161, 66, 244, 0.3);">
                <span style="font-size: 0.8rem; color: var(--text-secondary);">7월 여름 세일 예상 하락치</span>
                <h4 style="color: var(--success-color); font-size: 1.3rem; margin-top: 0.25rem;">💰 -$30 (약 10% 가격 인하)</h4>
            </div>
            <p style="font-size: 0.85rem;">급한 필요가 아니라면 3주 후에 시작될 여름 세일 기간까지 구매 대기를 강력히 추천합니다.</p>
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
