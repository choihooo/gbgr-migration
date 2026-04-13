// CSS 변수에서 색상 가져오기
export const getColor = (cssVar: string, fallback: string) => {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim() || fallback
  )
}
