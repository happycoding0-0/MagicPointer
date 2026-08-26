## Project
Benchmarking  "Reimagining the mouse pointer for the AI era" - google deepmind

구글 딥마인드의 연구 보고서 'Reimagining the mouse pointer for the AI era'를 읽고 벤치마킹하여 차세대 인간-컴퓨터 상호작용(HCI) 시스템을 탐구함.

## Devide to two things
### Pointer 코드 파일
- magic-os/src/components/MagicCursor.tsx
- magic-os/src/components/ui/Magnetic.tsx

### OS 코드 파일
- Pointer 코드파일을 제외한 나머지





### 소스코드 목록
분석 및 기능 검증 과정에서 확인하고 검토한 소스코드 파일 전체 목록입니다.

---

### 1. 포인터 및 인터랙션 핵심 코드 (HCI Core)

* **`src/components/MagicCursor.tsx`**: 전역 마우스 좌표 추적, 커스텀 커서 렌더링 및 호버 상태별 크기/스케일 변환


* **`src/components/ui/Magnetic.tsx`**: 유클리드 거리 및 인력 벡터 기반 UI 요소 자석 흡착 래퍼 컴포넌트


* **`src/app/globals.css`**: 기본 마우스 커서 숨김(`cursor: none`) 및 전역 스타일 정의


* **`src/app/layout.tsx`**: 뷰포트 최상단에 `MagicCursor`를 마운트하는 루트 레이아웃



---

### 2. 윈도우 매니저 및 데스크톱 셸 코드 (Window Management)

* **`src/store/useWindowStore.ts`**: 윈도우 생성/삭제, Z-Index 계층 스택 제어, 활성 창 포커싱, 위치/크기 상태를 관리하는 Zustand 스토어


* **`src/components/Window.tsx`**: 개별 윈도우 창 드래그 앤 드롭 이동, 경계면 리사이즈, 최소화/최대화 조작 컴포넌트


* **`src/components/WindowManager.tsx`**: 열린 창 목록 순회 렌더링 및 Z-Index 기반 레이어링 관리자


* **`src/components/BaseAppWrapper.tsx`**: 윈도우 내부 앱 표준 레이아웃 및 툴바 래퍼


* **`src/components/Dock.tsx`**: 하단 독 바 UI 및 Magnetic 인터랙션 적용 컴포넌트


* **`src/components/StatusBar.tsx`**: 상단 시간 및 시스템 상태바


* **`src/components/DesktopContextMenu.tsx`** / **`src/components/ui/OSContextMenu.tsx`**: 우클릭 컨텍스트 메뉴



---

### 3. AI 커맨드 및 백엔드 라우트 파이프라인 (AI & Backend API)

* **`src/components/ui/AIPalette.tsx`**: 전역 단축키 호출 기반 텍스트 커맨드 팔레트 UI


* **`src/app/api/ai/route.ts`**: AI 텍스트 처리 기본 라우트


* **`src/app/api/ai/chat/route.ts`**: 대화형 챗봇 요청/응답 백엔드 핸들러


* **`src/app/api/ai/summarize/route.ts`**: 텍스트 및 기사 요약 백엔드 핸들러



---

### 4. 파일 시스템 및 인프라 로직 (Infrastructure & Data)

* **`src/lib/vfs.ts`**: 트리 자료구조 기반 메모리/로컬스토리지 가상 파일 시스템(VFS)


* **`src/components/ui/FileDialog.tsx`**: VFS 기반 파일 탐색/선택 다이얼로그


* **`src/config/apps.config.ts`**: 내장 앱 메타데이터 및 기본 윈도우 크기/위치 설정


* **`src/config/system.config.ts`**: OS 기본 테마 및 배경화면 설정


* **`src/locales/dictionary.ts`**: 다국어 텍스트 매핑 사전



---

### 5. 내장 애플리케이션 모듈 (Apps Layer)

* **`src/apps/AppRouter.tsx`**: App ID 기반 동적 앱 라우터


* **`src/apps/Browser/BrowserApp.tsx`**: 웹 브라우저 앱


* **`src/apps/FileExplorer/FileExplorerApp.tsx`**: VFS 연동 파일 탐색기 앱


* **`src/apps/Notes/NotesApp.tsx`**: 텍스트 작성 및 VFS 파일 입출력 메모 앱


* **`src/apps/Stock/StockApp.tsx`**, `StockChart.tsx`, `StockSidebar.tsx`: 주식 차트 및 시세 조회 앱


* **`src/apps/Media/MediaApp.tsx`**: 유튜브 미디어 재생 앱


* **`src/apps/News/NewsApp.tsx`**, `NewsReader.tsx`: 뉴스 기사 리더 앱


* **`src/apps/Map/MapApp.tsx`**, `MapComponent.tsx`: 지도 뷰어 앱


* **`src/apps/Messenger/MessengerApp.tsx`**: 메시징 인터페이스 앱


* **`src/apps/Settings/SettingsApp.tsx`**: 시스템 설정 앱


* **`src/apps/Welcome/WelcomeApp.tsx`**: 시작 안내 앱



---

### 6. 레거시 프로토타입 참고 코드 (Old Experimental)

* **`old/new_project/src/workers/gemma.worker.ts`** / **`useGemma.ts`**: 온디바이스 AI(Gemma) 실행 프로토타입 코드


* **`old/ai-os/app.js`**: 초기 바닐라 JS 기반 OS 프로토타입 코드
