import { type ChangeEvent, type FocusEvent, forwardRef } from 'react'

interface TextFieldProps {
  id?: string
  type?: string
  placeholder?: string
  value?: string
  disabled?: boolean
  maxLength?: number
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
  className?: string
  name?: string
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      id,
      type = 'text',
      placeholder = '이름을 입력하세요',
      value,
      maxLength,
      disabled,
      onChange,
      onFocus,
      onBlur,
      className = '',
      name,
    },
    ref,
  ) => {
    return (
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        disabled={disabled}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`border-grey-100 bg-grey-0 text-grey-700 flex aspect-[44/6] w-full cursor-pointer flex-row rounded-full border px-6 outline-none focus:border-yellow-500 ${className}`}
      />
    )
  },
)

TextField.displayName = 'TextField'

export default TextField
