// 위젯 크기 타입 정의
export type WidgetSize = 'mini' | 'medium'

// 위젯 기본 설정
export const WIDGET_CONFIG = {
  // 기본 시작 크기
  defaultWidth: 200,
  defaultHeight: 320,

  // 최소 / 최대 크기 (사용자가 조절 가능한 범위)
  minWidth: 160,
  minHeight: 45,
  maxWidth: 260,
  maxHeight: 348,

  /* 레이아웃 전환 기준점  */
  breakpoint: {
    height: 62,
  },

  /* 미니 모드 크기 설정 */
  mini: {
    defaultWidth: 244,
    defaultHeight: 42,
    maxHeight: 50,
  },

  /* 미디엄 모드 크기 및 전환 임계값 */
  medium: {
    minWidth: 192,
    minHeight: 268,
  },
} as const
