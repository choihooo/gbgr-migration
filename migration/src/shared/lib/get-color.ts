/**
 * CSS 변수에서 색상값 읽기 유틸리티
 * Recharts SVG 요소는 Tailwind 클래스를 사용할 수 없어
 * CSS 변수에서 직접 색상 값을 읽어야 한다.
 * @legacy src/renderer/src/shared/lib/get-color.ts
 */

export const getColor = (cssVar: string, fallback: string): string => {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim() || fallback
  )
}
