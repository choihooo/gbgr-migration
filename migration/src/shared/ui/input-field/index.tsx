import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type InputHTMLAttributes,
} from 'react'

interface TextFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'className' | 'onChange' | 'onFocus' | 'onBlur'
  > {
  className?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
}

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      disabled,
      maxLength,
      onBlur,
      onChange,
      onFocus,
      placeholder = '이름을 입력하세요',
      type = 'text',
      ...props
    },
    ref,
  ) => {
    return (
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        className={joinClasses(
          'border-grey-100 bg-grey-0 text-grey-700 flex aspect-[44/6] w-full cursor-pointer rounded-full border px-6 outline-none focus:border-yellow-500 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
    )
  },
)

TextField.displayName = 'TextField'
