import MediumDragIcon from '@assets/widget/drag_icon.svg?react'
import MiniDragIcon from '@assets/widget/mini_drag_icon.svg?react'

interface WidgetTitleBarProps {
  onClose?: () => void
  isMini?: boolean // 미니 모드 여부
}

/* 커스텀 위젯 타이틀바 (frame: false 일 때 사용) */
export function WidgetTitleBar({
  onClose,
  isMini = true,
}: WidgetTitleBarProps) {
  // 위젯 닫기
  const handleClose = async () => {
    try {
      if (window.electronAPI?.widget) {
        await window.electronAPI.widget.close()

        // 위젯 닫힘 로그 저장
        if (window.electronAPI?.writeLog) {
          try {
            const logData = JSON.stringify({
              event: 'widget_closed',
              timestamp: new Date().toISOString(),
            })
            await window.electronAPI.writeLog(logData)
          } catch (error) {
            console.error('위젯 닫힘 로그 저장 실패:', error)
          }
        }
      }
      onClose?.()
    } catch (error) {
      console.error('위젯 닫기 실패:', error)
    }
  }

  return (
    <div
      className={`bg-grey-0 flex ${
        isMini
          ? 'h-full w-[14px] flex-col items-center justify-center pr-1'
          : 'mt-[-1px] h-5 w-full items-center justify-center pb-1'
      } `}
      style={{
        // 드래그 가능하게 설정 (Electron에서 창 이동 가능)
        // @ts-expect-error: electronAPI 타입 정의 없음
        WebkitAppRegion: 'drag',
      }}
    >
      {/* 빨간 닫기 버튼 */}
      <button
        onClick={handleClose}
        className="mini:mt-[2px] h-[10px] w-[10px] rounded-full bg-[#FF5154] hover:bg-red-600"
        style={{
          // 버튼은 클릭 가능하도록 드래그 비활성화
          // @ts-expect-error: electronAPI 타입 정의 없음
          WebkitAppRegion: 'no-drag',
        }}
        aria-label="닫기"
      />
      {isMini ? (
        <MiniDragIcon className="my-auto" />
      ) : (
        <>
          <MediumDragIcon className="mx-auto" />
          <span className="bg-grey-0 inline-block w-2" />
        </>
      )}

      {/* 드래그 영역 (사용자가 창 크기를 조절할 수 있음) */}
    </div>
  )
}
