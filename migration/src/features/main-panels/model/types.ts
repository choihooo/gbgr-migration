/**
 * 메인 패널 공통 타입 정의
 * @legacy src/renderer/src/features/dashboard/ui/ 내 각 패널 props 참고
 */

/** 카메라 표시 상태 */
export type CameraState = 'show' | 'hide' | 'exit'

/** 위젯 표시 상태 */
export type WidgetState = 'show' | 'hide'

/** 패널 기본 Props */
export interface PanelBaseProps {
  className?: string
}

/** 조회 기간 (주간/월간) */
export type Period = 'WEEKLY' | 'MONTHLY'
