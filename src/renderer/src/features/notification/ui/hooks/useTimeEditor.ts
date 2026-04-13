import { useEffect, useRef, useState } from 'react'

interface UseTimeEditorProps {
  initialTime: number
  isEnabled: boolean
}

export const useTimeEditor = ({
  initialTime,
  isEnabled,
}: UseTimeEditorProps) => {
  const [time, setTime] = useState(initialTime)
  const [isEditing, setIsEditing] = useState(false)
  const [tempTime, setTempTime] = useState(initialTime.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  /* 편집 시작 시 포커스 */
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  /* 시간 클릭 (편집 모드 진입) */
  const handleTimeClick = () => {
    if (isEnabled) {
      setTempTime(time.toString())
      setIsEditing(true)
    }
  }

  /* 시간 입력 변경 */
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setTempTime(value)
  }

  /* 시간 제출 */
  const handleTimeSubmit = () => {
    const newTime = Math.min(300, Math.max(1, Number.parseInt(tempTime) || 1))
    setTime(newTime)
    setIsEditing(false)
  }

  /* 시간 키 입력 */
  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTimeSubmit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  /* 시간 증가 (최대 300분) */
  const increaseTime = () => {
    setTime(prev => Math.min(300, prev + 1))
  }

  /* 시간 감소 */
  const decreaseTime = () => {
    setTime(prev => Math.max(1, prev - 1))
  }

  return {
    time,
    isEditing,
    tempTime,
    inputRef,
    handlers: {
      handleTimeClick,
      handleTimeChange,
      handleTimeSubmit,
      handleTimeKeyDown,
      increaseTime,
      decreaseTime,
    },
  }
}
