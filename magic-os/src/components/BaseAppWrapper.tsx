import React from "react";

interface BaseAppWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** flex-col 방향 정렬 여부 (기본값: false, false일 경우 flex-row) */
  flexCol?: boolean;
  /** 앱 고유의 배경색 오버라이드 (지정하지 않으면 OS 기본 테마 적용) */
  bgOverride?: string;
}

/**
 * 모든 OS 앱이 공통으로 사용해야 하는 최상위 래퍼(Wrapper)입니다.
 * 앱마다 제각각이었던 다크모드 배경색, 텍스트 색상, 폰트, 오버플로우 설정을
 * 이 컴포넌트 하나로 통합 관리하여 OS 디자인 표준화를 이룹니다.
 */
export default function BaseAppWrapper({ 
  children, 
  className = "", 
  flexCol = false,
  bgOverride
}: BaseAppWrapperProps) {
  
  // OS 표준 백그라운드 적용 (bgOverride가 없으면 기본값 사용)
  const bgClass = bgOverride || "bg-white dark:bg-[#1c1c1e]";

  return (
    <div 
      className={`w-full h-full ${bgClass} text-slate-900 dark:text-slate-100 font-sans overflow-hidden ${flexCol ? 'flex flex-col' : 'flex'} ${className}`}
    >
      {children}
    </div>
  );
}
