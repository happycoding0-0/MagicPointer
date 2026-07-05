// MagicOS Custom Events Type Definitions
// 이 파일은 OS 내부에서 오가는 모든 통신 이벤트의 규격을 엄격하게 정의합니다.

export interface MagicOSOpenMapEventDetail {
  lat: number;
  lng: number;
  zoom?: number;
  showMarker?: boolean;
}

export interface MagicOSDrawPathEventDetail {
  path: [number, number][]; // Array of [lat, lng]
}

// CustomEvent 래퍼
export type MagicOSOpenMapEvent = CustomEvent<MagicOSOpenMapEventDetail>;
export type MagicOSDrawPathEvent = CustomEvent<MagicOSDrawPathEventDetail>;

// 전역 Window 객체에 이벤트 등록 (addEventListener 타입 추론 지원)
declare global {
  interface WindowEventMap {
    "magicos:fly-to-map": MagicOSOpenMapEvent;
    "magicos:draw-path": MagicOSDrawPathEvent;
  }
}
