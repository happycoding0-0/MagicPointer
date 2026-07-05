const enDictionary = {
  // Apps config
  app_explorer: "File Explorer",
  app_notes: "Notes",
  app_settings: "System Settings",
  app_welcome: "Start Guide",
  app_media: "Media Player",
  app_news: "Daily News",

  // Welcome App
  welcome_title: "Welcome to MagicOS",
  welcome_subtitle_1: "The first operating system powered by Agentic AI.",
  welcome_subtitle_2: "Experience a new way to interact with your computer using natural language.",
  welcome_shortcut_title: "Global Shortcut",
  welcome_shortcut_desc: "Press Ctrl + Space anywhere to summon your AI Assistant.",
  welcome_nlp_title: "Natural Language",
  welcome_nlp_desc: 'Just tell the AI what to do. Try saying "Open Notes" or "Create a file named hello.txt".',
  welcome_btn_ai: "Try AI Assistant Now",
  welcome_btn_explore: "Explore Desktop",

  // AIPalette
  ai_placeholder: "Ask MagicOS Agent... (e.g. 'Open Notes', 'Create a file')",
  ai_powered_by: "Powered by Gemini 2.5 Flash",
  ai_esc_close: "Press ESC to close",
  ai_network_error: "Network error. Please try again.",

  // Settings App
  settings_title: "System Settings",
  settings_language: "System Language",
  settings_language_desc: "Choose your preferred language for the MagicOS interface.",

  // Context Menu
  menu_refresh: "Refresh",
  menu_new_folder: "New Folder",
  menu_personalize: "Personalize",

  // Notes App
  notes_untitled: "Untitled",
  notes_new_tab: "New Tab",
  notes_open: "Open...",
  notes_save: "Save",
  notes_save_as: "Save as...",
  notes_file: "File",

  // File Explorer App
  explorer_open: "Open",
  explorer_rename: "Rename",
  explorer_delete: "Delete",
  explorer_new_folder: "New Folder",
  explorer_new_file: "New Text File",
  explorer_refresh: "Refresh",
  explorer_empty: "This folder is empty.",

  // Status Bar
  status_online: "System Online",

  // Messenger App
  // Messenger App
  app_messenger: "Magic Assistant",
  msg_online: "Online",
  msg_offline: "Offline",
  msg_type_placeholder: "Message Magic Assistant...",
  msg_send: "Send",
  msg_ai_typing: "Magic Assistant is typing...",
  msg_chat_history: "Chat History",
  msg_new_chat: "New Chat",
  msg_no_past_conversations: "No past conversations",
  msg_how_can_i_help: "How can I help you today?",
  msg_chip_status_title: "System Status",
  msg_chip_status_desc: "Summarize currently open apps",
  msg_chip_note_title: "New Note",
  msg_chip_note_desc: "Open a blank note for writing",
  msg_chip_theme_title: "Change Theme",
  msg_chip_theme_desc: "Learn how to change the desktop theme",
  msg_chip_file_title: "Create File",
  msg_chip_file_desc: "Save a hello message to Documents",
  
  // Magic Pointer
  ai_command_placeholder: "AI Command...",
  ai_magic_pointer: "Magic Pointer",

  // Media App
  media_search_placeholder: "Search YouTube...",
  media_trending: "Trending",
  media_music: "Music",
  media_gaming: "Gaming",
  media_news: "News",

  // News App
  news_tab_global: "Global News",
  news_tab_korea: "Korea News",
  news_loading: "Fetching the latest headlines...",
  news_reader_loading: "Extracting article content...",
  
  // Stock App
  app_stock: "Stocks",
  stock_loading: "Loading market data...",
  stock_error: "Failed to load market data.",
  stock_chart_1m: "1M Chart",

  // Map App
  app_map: "Maps",
  map_search_placeholder: "Search location... (e.g. Tokyo)",
  map_searching: "Searching...",
};

// TypeScript Magic: 'en' 객체의 모든 키값을 추출해서 기본 타입으로 만듭니다.
type DictionaryKeys = keyof typeof enDictionary;

// 'ko' 객체도 무조건 위에서 추출한 키값들을 100% 동일하게 가져야 한다고 강제합니다.
const koDictionary: Record<DictionaryKeys, string> = {
    // Apps config
    app_explorer: "파일 탐색기",
    app_notes: "메모장",
    app_settings: "시스템 설정",
    app_welcome: "시작 가이드",
    app_media: "미디어 플레이어",
    app_news: "데일리 뉴스",

    // Welcome App
    welcome_title: "MagicOS에 오신 것을 환영합니다",
    welcome_subtitle_1: "Agentic AI로 구동되는 최초의 운영체제입니다.",
    welcome_subtitle_2: "자연어를 사용하여 컴퓨터와 소통하는 새로운 방식을 경험해 보세요.",
    welcome_shortcut_title: "글로벌 단축키",
    welcome_shortcut_desc: "어디서든 Ctrl + Space를 눌러 AI 비서를 호출하세요.",
    welcome_nlp_title: "자연어 명령",
    welcome_nlp_desc: 'AI에게 할 일을 말해보세요. "메모장 열어줘" 또는 "hello.txt 파일 만들어"라고 해보세요.',
    welcome_btn_ai: "지금 AI 비서 사용해보기",
    welcome_btn_explore: "바탕화면 둘러보기",

    // AIPalette
    ai_placeholder: "MagicOS에게 물어보세요... (예: '메모장 켜줘', '안녕이라고 파일 만들어')",
    ai_powered_by: "Gemini 2.5 Flash 기반",
    ai_esc_close: "ESC를 누르면 닫힙니다",
    ai_network_error: "네트워크 오류가 발생했습니다. 다시 시도해 주세요.",

    // Settings App
    settings_title: "시스템 설정",
    settings_language: "시스템 언어",
    settings_language_desc: "MagicOS 화면에 표시될 기본 언어를 선택하세요.",

    // Context Menu
    menu_refresh: "새로 고침",
    menu_new_folder: "새 폴더",
    menu_personalize: "개인 설정",

    // Notes App
    notes_untitled: "제목 없음",
    notes_new_tab: "새 탭",
    notes_open: "열기...",
    notes_save: "저장",
    notes_save_as: "다른 이름으로 저장...",
    notes_file: "파일",

    // File Explorer App
    explorer_open: "열기",
    explorer_rename: "이름 바꾸기",
    explorer_delete: "삭제",
    explorer_new_folder: "새 폴더",
    explorer_new_file: "새 텍스트 파일",
    explorer_refresh: "새로 고침",
    explorer_empty: "이 폴더는 비어 있습니다.",

    // Status Bar
    status_online: "시스템 온라인",

    // Messenger App
    // Messenger App
    app_messenger: "매직 어시스턴트",
    msg_online: "온라인",
    msg_offline: "오프라인",
    msg_type_placeholder: "Magic Assistant에게 메시지 보내기...",
    msg_send: "전송",
    msg_ai_typing: "Magic Assistant가 입력 중입니다...",
    msg_chat_history: "대화 기록",
    msg_new_chat: "새 대화",
    msg_no_past_conversations: "과거 대화 내역이 없습니다",
    msg_how_can_i_help: "무엇을 도와드릴까요?",
    msg_chip_status_title: "시스템 상태 요약",
    msg_chip_status_desc: "현재 열려있는 앱들을 요약합니다",
    msg_chip_note_title: "새 메모장",
    msg_chip_note_desc: "새로운 빈 메모장을 엽니다",
    msg_chip_theme_title: "테마 변경",
    msg_chip_theme_desc: "배경화면 테마 변경법을 알려줍니다",
    msg_chip_file_title: "파일 생성",
    msg_chip_file_desc: "인사말을 문서 폴더에 저장합니다",

    // Magic Pointer
    ai_command_placeholder: "AI 커맨드 입력...",
    ai_magic_pointer: "매직 포인터",

    // Media App
    media_search_placeholder: "YouTube 검색...",
    media_trending: "인기 급상승",
    media_music: "음악",
    media_gaming: "게임",
    media_news: "뉴스",

    // News App
    news_tab_global: "글로벌 속보",
    news_tab_korea: "국내 속보",
    news_loading: "최신 뉴스를 가져오는 중...",
    news_reader_loading: "기사 본문을 추출하는 중...",

    // Stock App
    app_stock: "주식",
    stock_loading: "시장 데이터를 불러오는 중...",
    stock_error: "시장 데이터를 불러올 수 없습니다.",
    stock_chart_1m: "1개월 차트",

    // Map App
    app_map: "지도",
    map_search_placeholder: "장소 검색... (예: 도쿄)",
    map_searching: "검색 중...",
};

// 최종 export
export const dictionary = {
  en: enDictionary,
  ko: koDictionary
};
