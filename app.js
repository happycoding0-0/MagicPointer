/**
 * MagicPointer v2.0 - Modern Web OS UI Engine
 * 나중에 어떠한 임의의 텍스트 콘텐츠를 채우거나 레이아웃을 바꾸어도 
 * 런타임 콘솔 오류나 화면 겹침/이탈 버그가 절대 발생하지 않도록 5대 안전장치가 탑재된 엔진.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- [안전장치 1] 전역 상태 안전성 초기화 (NaN 방지) ---
    const state = {
        lightTheme: true,
        activeApp: 'notes',
        cursor: {
            targetX: window.innerWidth / 2,
            targetY: window.innerHeight / 2,
            haloX: window.innerWidth / 2,
            haloY: window.innerHeight / 2,
            lerpHalo: 0.16,
            isSnapped: false,
            snapTarget: null
        },
        drag: {
            activeWin: null,
            startX: 0,
            startY: 0,
            startLeft: 0,
            startTop: 0,
            isDragging: false
        },
        resize: {
            activeWin: null,
            startW: 0,
            startH: 0,
            startX: 0,
            startY: 0,
            isResizing: false
        }
    };

    // DOM 요소 안전 탐색 (없어도 오류 방지)
    const cursorHalo = document.getElementById('magic-cursor-halo');
    const systemClock = document.getElementById('system-clock');
    const memoryText = document.getElementById('memory-text');
    const themeWidget = document.getElementById('widget-theme');
    
    // 모달 및 창, 아이콘들
    const guideModal = document.getElementById('guide-modal');
    const guideOpenBtn = document.getElementById('guide-open-btn');
    const closeGuideBtn = document.getElementById('close-guide-btn');
    const guideConfirmBtn = document.getElementById('guide-close-confirm-btn');
    const settingsToggle = document.getElementById('settings-toggle-btn');
    const settingsPanel = document.getElementById('settings-panel');

    const windows = document.querySelectorAll('.window');
    const shortcuts = document.querySelectorAll('.desktop-shortcut');
    const dockItems = document.querySelectorAll('.dock-item');

    // --- 2. 상단 상태바 시계 & 가상 메모리 안전 업데이트 ---
    function updateClock() {
        if (!systemClock) return; // 가드
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? '오후' : '오전';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        minutes = minutes < 10 ? '0' + minutes : minutes;
        systemClock.textContent = `${ampm} ${hours}:${minutes}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    let simulatedMemory = 60.5;
    function updateMemoryUsage() {
        if (!memoryText) return; // 가드
        const delta = (Math.random() * 0.2 - 0.1);
        simulatedMemory = Math.min(Math.max(simulatedMemory + delta, 55.0), 75.0);
        memoryText.textContent = `${simulatedMemory.toFixed(1)} MB`;
    }
    setInterval(updateMemoryUsage, 3000);
    updateMemoryUsage();

    // --- 3. 마우스 60fps LERP 트레일러 루프 ---
    window.addEventListener('mousemove', (e) => {
        state.cursor.targetX = e.clientX || window.innerWidth / 2;
        state.cursor.targetY = e.clientY || window.innerHeight / 2;
    });

    function animateCursor() {
        if (!cursorHalo) return; // 가드

        if (state.cursor.isSnapped && state.cursor.snapTarget) {
            const rect = state.cursor.snapTarget.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            state.cursor.haloX += (centerX - state.cursor.haloX) * 0.25;
            state.cursor.haloY += (centerY - state.cursor.haloY) * 0.25;
            
            cursorHalo.style.width = `${rect.width + 10}px`;
            cursorHalo.style.height = `${rect.height + 10}px`;
            cursorHalo.style.borderRadius = window.getComputedStyle(state.cursor.snapTarget).borderRadius || '12px';
        } else {
            state.cursor.haloX += (state.cursor.targetX - state.cursor.haloX) * state.cursor.lerpHalo;
            state.cursor.haloY += (state.cursor.targetY - state.cursor.haloY) * state.cursor.lerpHalo;
            
            cursorHalo.style.width = '40px';
            cursorHalo.style.height = '40px';
            cursorHalo.style.borderRadius = '50%';
        }

        cursorHalo.style.left = `${state.cursor.haloX}px`;
        cursorHalo.style.top = `${state.cursor.haloY}px`;

        requestAnimationFrame(animateCursor);
    }
    // 루프 실행
    if (cursorHalo) {
        requestAnimationFrame(animateCursor);
    }

    // --- 4. 마우스 자석 효과 (Magnetic Snapping - 안전 가드) ---
    const magneticSelectors = '.dock-item, .desktop-shortcut, .win-dot, .status-btn, .status-widget';
    
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest(magneticSelectors);
        if (target) {
            state.cursor.isSnapped = true;
            state.cursor.snapTarget = target;
            if (cursorHalo) {
                cursorHalo.classList.add('snapped');
            }
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest(magneticSelectors);
        if (target && state.cursor.snapTarget === target) {
            resetSnap();
        }
    });

    function resetSnap() {
        state.cursor.isSnapped = false;
        state.cursor.snapTarget = null;
        if (cursorHalo) {
            cursorHalo.classList.remove('snapped');
        }
    }

    // --- 5. macOS 스타일 윈도우 조작 (드래그 & 리사이즈 - 철벽 가드 장착) ---
    windows.forEach(win => {
        const titleBar = win.querySelector('.window-title-bar');
        
        win.addEventListener('mousedown', () => {
            focusWindow(win);
        });

        // 닫기 (빨간 버튼)
        const closeDot = win.querySelector('.dot-close');
        if (closeDot) {
            closeDot.addEventListener('click', (e) => {
                e.stopPropagation();
                win.classList.remove('open');
                updateDockIndicators();
                resetSnap();
            });
        }

        // 최소화 (노란 버튼)
        const minimizeDot = win.querySelector('.dot-minimize');
        if (minimizeDot) {
            minimizeDot.addEventListener('click', (e) => {
                e.stopPropagation();
                win.classList.add('minimized');
                updateDockIndicators();
                resetSnap();
            });
        }

        // 리사이즈
        const resizer = win.querySelector('.window-resizer');
        if (resizer) {
            resizer.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                state.resize.activeWin = win;
                state.resize.isResizing = true;
                state.resize.startW = win.offsetWidth;
                state.resize.startH = win.offsetHeight;
                state.resize.startX = e.clientX;
                state.resize.startY = e.clientY;
                
                focusWindow(win);
            });
        }

        // 드래그 기능 (순수 좌표 변경 레이어)
        if (titleBar) {
            titleBar.addEventListener('mousedown', (e) => {
                if (e.target.closest('.win-dot')) return; 
                
                state.drag.activeWin = win;
                state.drag.isDragging = true;
                state.drag.startX = e.clientX;
                state.drag.startY = e.clientY;
                state.drag.startLeft = win.offsetLeft;
                state.drag.startTop = win.offsetTop;
                
                focusWindow(win);
                e.preventDefault();
            });
        }
    });

    window.addEventListener('mousemove', (e) => {
        // [안전장치 2] 드래그 시 뷰포트 화면 이탈 금지 제한 가드 (상하좌우 화면 고정)
        if (state.drag.isDragging && state.drag.activeWin) {
            const dx = e.clientX - state.drag.startX;
            const dy = e.clientY - state.drag.startY;
            let targetLeft = state.drag.startLeft + dx;
            let targetTop = state.drag.startTop + dy;
            
            // 상단 상태바 경계 고정
            if (targetTop < 40) targetTop = 40;
            // 하단 Dock 침범 방지 고정
            const maxTop = window.innerHeight - 80;
            if (targetTop > maxTop) targetTop = maxTop;
            
            // 좌우 최소 100px은 화면에 걸쳐있도록 제한해 잃어버림 방지
            const winW = state.drag.activeWin.offsetWidth;
            const minLeft = -winW + 100;
            const maxLeft = window.innerWidth - 100;
            if (targetLeft < minLeft) targetLeft = minLeft;
            if (targetLeft > maxLeft) targetLeft = maxLeft;
            
            state.drag.activeWin.style.left = `${targetLeft}px`;
            state.drag.activeWin.style.top = `${targetTop}px`;
        }

        // [안전장치 3] 창 리사이즈 최소 크기 강제 가드
        if (state.resize.isResizing && state.resize.activeWin) {
            const dx = e.clientX - state.resize.startX;
            const dy = e.clientY - state.resize.startY;
            
            // 가로 최소 290px, 세로 최소 200px 이하로 좁혀지지 못하도록 제한
            const newW = Math.max(290, state.resize.startW + dx);
            const newH = Math.max(200, state.resize.startH + dy);
            
            state.resize.activeWin.style.width = `${newW}px`;
            state.resize.activeWin.style.height = `${newH}px`;
        }
    });

    window.addEventListener('mouseup', () => {
        state.drag.isDragging = false;
        state.drag.activeWin = null;
        state.resize.isResizing = false;
        state.resize.activeWin = null;
    });

    function focusWindow(win) {
        if (!win) return;
        windows.forEach(w => {
            w.classList.remove('active-win');
            w.style.zIndex = '500';
        });
        
        win.classList.add('active-win');
        win.style.zIndex = '1000';
        
        const appId = win.id.replace('win-', '');
        state.activeApp = appId;
        updateDockIndicators();
    }

    // --- 6. Dock & 바탕화면 단일 클릭 연계 ---
    function updateDockIndicators() {
        dockItems.forEach(item => {
            const appId = item.getAttribute('data-app');
            const win = document.getElementById(`win-${appId}`);
            if (!item) return;
            
            item.classList.remove('running', 'focused');
            
            if (win && win.classList.contains('open') && !win.classList.contains('minimized')) {
                item.classList.add('running');
                if (state.activeApp === appId && win.classList.contains('active-win')) {
                    item.classList.add('focused');
                }
            }
        });
    }

    dockItems.forEach(item => {
        item.addEventListener('click', () => {
            const appId = item.getAttribute('data-app');
            toggleAppWindow(appId);
        });
    });

    shortcuts.forEach(shortcut => {
        shortcut.addEventListener('click', () => {
            const appId = shortcut.getAttribute('data-app');
            openAppWindow(appId);
        });
    });

    function toggleAppWindow(appId) {
        const win = document.getElementById(`win-${appId}`);
        if (!win) return;

        if (!win.classList.contains('open') || win.classList.contains('minimized')) {
            openAppWindow(appId);
        } else if (win.classList.contains('active-win')) {
            win.classList.add('minimized');
            resetSnap();
            updateDockIndicators();
        } else {
            focusWindow(win);
        }
    }

    function openAppWindow(appId) {
        const win = document.getElementById(`win-${appId}`);
        if (!win) return;

        win.classList.add('open');
        win.classList.remove('minimized');
        focusWindow(win);
        updateDockIndicators();
    }

    // --- 7. 테마 전환 기능 ---
    if (themeWidget) {
        themeWidget.addEventListener('click', () => {
            state.lightTheme = !state.lightTheme;
            const themeIcon = themeWidget.querySelector('.theme-icon');
            
            if (state.lightTheme) {
                document.body.classList.remove('dark-theme');
                document.body.classList.add('light-theme');
                if (themeIcon) themeIcon.textContent = 'light_mode';
            } else {
                document.body.classList.remove('light-theme');
                document.body.classList.add('dark-theme');
                if (themeIcon) themeIcon.textContent = 'dark_mode';
            }
            resetSnap();
        });
    }

    // --- 8. 가이드 모달 제어 ---
    if (guideOpenBtn) {
        guideOpenBtn.addEventListener('click', () => {
            if (guideModal) guideModal.classList.remove('hidden');
        });
    }

    const closeGuideActions = [closeGuideBtn, guideConfirmBtn];
    closeGuideActions.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                if (guideModal) guideModal.classList.add('hidden');
                resetSnap();
            });
        }
    });

    // Backdrop 클릭으로 모달 닫기
    const guideBackdrop = document.getElementById('guide-backdrop');
    if (guideBackdrop) {
        guideBackdrop.addEventListener('click', () => {
            if (guideModal) guideModal.classList.add('hidden');
            resetSnap();
        });
    }

    // 최초 실행 시 가이드 자동 팝업
    setTimeout(() => {
        if (guideModal) {
            guideModal.classList.remove('hidden');
        }
    }, 400);

    updateDockIndicators();

    // ============================================================
    // [UCSS-JS] Content Guardian - 자동 통합 콘텐츠 안전 관리 시스템
    // 어떤 콘텐츠가 동적으로 주입되어도 레이아웃 안정성을 보장.
    // ============================================================

    /**
     * [Guardian 1] MutationObserver
     * 각 창의 콘텐츠 영역을 실시간 감시.
     * 새로운 텍스트/HTML이 삽입될 때 자동으로 안전 속성 적용.
     */
    function applyContentSafety(node) {
        if (!(node instanceof HTMLElement)) return;

        // 텍스트가 있는 모든 블록 요소에 오버플로우 방지 적용
        const textElements = node.querySelectorAll(
            'p, span, h1, h2, h3, h4, h5, h6, li, td, th, div, label, a'
        );
        textElements.forEach(el => {
            // inline 스타일로 강제 적용 (외부 CSS 충돌 방지)
            if (!el.dataset.ucssApplied) {
                el.style.overflowWrap = 'break-word';
                el.style.wordBreak = 'break-word';
                el.style.minWidth = '0';
                el.dataset.ucssApplied = 'true';
            }
        });

        // 이미지/비디오가 삽입된 경우 최대 너비 강제
        const mediaElements = node.querySelectorAll('img, video, canvas, iframe');
        mediaElements.forEach(el => {
            if (!el.dataset.ucssApplied) {
                el.style.maxWidth = '100%';
                el.style.height = 'auto';
                el.style.display = 'block';
                el.dataset.ucssApplied = 'true';
            }
        });

        // data-content-zone 속성 없는 콘텐츠 컨테이너에 자동 격리 설정
        const containers = node.querySelectorAll('.window-content, .notes-body, .mail-list');
        containers.forEach(el => {
            if (!el.hasAttribute('data-content-zone')) {
                el.setAttribute('data-content-zone', 'scroll');
            }
        });
    }

    // 창 콘텐츠 영역에 MutationObserver 부착
    const contentObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                applyContentSafety(node.parentElement || document.body);
            });
        });
    });

    windows.forEach(win => {
        const contentArea = win.querySelector('.window-content');
        if (contentArea) {
            // 기존 콘텐츠에도 즉시 적용
            applyContentSafety(contentArea);
            // 미래 삽입 감시 시작
            contentObserver.observe(contentArea, {
                childList: true,
                subtree: true,
                characterData: false
            });
        }
    });

    /**
     * [Guardian 2] ResizeObserver
     * 각 창의 크기가 바뀔 때 내부 콘텐츠 레이아웃을 자동 재조정.
     * 특히 테이블, 이미지 등 고정 너비 요소들이 있을 때 안전하게 재계산.
     */
    if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver((entries) => {
            entries.forEach(entry => {
                const win = entry.target;
                const contentArea = win.querySelector('.window-content');
                if (!contentArea) return;

                // 내부 테이블이 컨테이너를 넘치는 경우 자동 보정
                const tables = contentArea.querySelectorAll('table');
                tables.forEach(table => {
                    const wrapper = table.closest('.spec-table-wrapper');
                    if (wrapper) {
                        // 테이블이 래퍼보다 넓으면 가로 스크롤 활성화
                        if (table.scrollWidth > wrapper.clientWidth) {
                            wrapper.style.overflowX = 'auto';
                        }
                    }
                });

                // 이미지 최대 너비 재적용
                const images = contentArea.querySelectorAll('img');
                images.forEach(img => {
                    img.style.maxWidth = '100%';
                });
            });
        });

        windows.forEach(win => {
            resizeObserver.observe(win);
        });
    }

    /**
     * [Guardian 3] Dock Tooltip Injector
     * Dock 아이템에 마우스를 올리면 앱 이름 툴팁을 자동으로 표시.
     * HTML title 속성 없이 CSS/JS로 처리하여 스타일 통일.
     */
    dockItems.forEach(item => {
        const tooltipText = item.getAttribute('data-tooltip');
        if (!tooltipText) return;

        let tooltipEl = null;

        item.addEventListener('mouseenter', () => {
            if (tooltipEl) return;
            tooltipEl = document.createElement('div');
            tooltipEl.textContent = tooltipText;
            tooltipEl.style.cssText = `
                position: fixed;
                background: rgba(30, 30, 32, 0.88);
                color: #fff;
                font-size: 0.65rem;
                font-weight: 600;
                padding: 4px 9px;
                border-radius: 6px;
                pointer-events: none;
                z-index: 9998;
                white-space: nowrap;
                letter-spacing: 0.2px;
                backdrop-filter: blur(8px);
                transform: translateX(-50%);
                transition: opacity 0.15s ease;
                opacity: 0;
            `;
            document.body.appendChild(tooltipEl);

            // 툴팁 위치 계산
            const rect = item.getBoundingClientRect();
            tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
            tooltipEl.style.top = `${rect.top - 30}px`;

            // 화면 경계 이탈 방지
            requestAnimationFrame(() => {
                if (!tooltipEl) return;
                const tipRect = tooltipEl.getBoundingClientRect();
                if (tipRect.left < 8) {
                    tooltipEl.style.left = `${tipRect.width / 2 + 8}px`;
                }
                if (tipRect.right > window.innerWidth - 8) {
                    tooltipEl.style.left = `${window.innerWidth - tipRect.width / 2 - 8}px`;
                }
                tooltipEl.style.opacity = '1';
            });
        });

        item.addEventListener('mouseleave', () => {
            if (tooltipEl) {
                tooltipEl.style.opacity = '0';
                setTimeout(() => {
                    if (tooltipEl && tooltipEl.parentNode) {
                        tooltipEl.parentNode.removeChild(tooltipEl);
                    }
                    tooltipEl = null;
                }, 150);
            }
        });
    });

    /**
     * [Guardian 4] Viewport Overflow Watchdog
     * 창이 뷰포트 밖으로 이탈했을 경우 자동으로 보정.
     * 브라우저 창 크기가 변경되거나 외부 스크립트가 창 위치를 바꿨을 때 실행.
     */
    function clampWindowsToViewport() {
        windows.forEach(win => {
            if (!win.classList.contains('open') || win.classList.contains('minimized')) return;

            const maxTop = window.innerHeight - 80;
            const winW = win.offsetWidth;
            const minLeft = -winW + 100;
            const maxLeft = window.innerWidth - 100;

            let top = parseInt(win.style.top, 10) || 90;
            let left = parseInt(win.style.left, 10) || 120;

            if (top < 40) top = 40;
            if (top > maxTop) top = maxTop;
            if (left < minLeft) left = minLeft;
            if (left > maxLeft) left = maxLeft;

            win.style.top = `${top}px`;
            win.style.left = `${left}px`;
        });
    }

    window.addEventListener('resize', () => {
        clampWindowsToViewport();
    });

    // 페이지 최초 로드 시에도 한 번 실행
    clampWindowsToViewport();
});
