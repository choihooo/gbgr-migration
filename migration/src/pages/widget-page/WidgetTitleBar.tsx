import { getCurrentWindow } from '@tauri-apps/api/window'
import type { PointerEvent } from 'react'
import MediumDragIcon from '@/assets/widget/drag_icon.svg'
import MiniDragIcon from '@/assets/widget/mini_drag_icon.svg'

interface WidgetTitleBarProps {
  onClose?: () => void
  isMini?: boolean
}

export function WidgetTitleBar({
  onClose,
  isMini = true,
}: WidgetTitleBarProps) {
  const handleClose = () => {
    onClose?.()
  }

  const handleDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return

    void getCurrentWindow()
      .startDragging()
      .catch(error => {
        console.error('위젯 창 드래그 시작 실패:', error)
      })
  }

  return (
    <div
      className={`bg-grey-0 flex ${
        isMini
          ? 'h-full w-[14px] flex-col items-center justify-center pr-1'
          : 'mt-[-1px] h-5 w-full items-center justify-center pb-1'
      }`}
      data-tauri-drag-region
      onPointerDown={handleDragStart}
    >
      <button
        onPointerDown={event => event.stopPropagation()}
        onClick={handleClose}
        className="mini:mt-[2px] h-[10px] w-[10px] rounded-full bg-[#FF5154] hover:bg-red-600"
        aria-label="닫기"
      />
      {isMini ? (
        <img
          src={MiniDragIcon}
          alt=""
          className="my-auto"
          draggable={false}
          data-tauri-drag-region
        />
      ) : (
        <>
          <img
            src={MediumDragIcon}
            alt=""
            className="mx-auto"
            draggable={false}
            data-tauri-drag-region
          />
          <span className="bg-grey-0 inline-block w-2" data-tauri-drag-region />
        </>
      )}
    </div>
  )
}
