//ModalPortal를 생성한다.
import type { ReactNode } from 'react'
import ReactDOM from 'react-dom'
interface ModalPortalProps {
  children: ReactNode
}

export const ModalPortal = ({ children }: ModalPortalProps) => {
  const el = document.getElementById('modal')
  if (!el) {
    console.error("Modal container with id 'modal' not found!")
    return null
  }
  return ReactDOM.createPortal(children, el)
}
