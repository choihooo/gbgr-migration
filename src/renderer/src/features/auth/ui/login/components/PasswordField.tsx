import InvisibleIcon from '@assets/auth/invisible_icon.svg?react'
import VisibleIcon from '@assets/auth/visible_icon.svg?react'
import { TextField as TextInput } from '@shared/ui/input-field'
import { type ChangeEvent, forwardRef, useState } from 'react'

interface PasswordFieldProps {
  hasValue?: boolean
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  name?: string
}

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    { hasValue, onChange, placeholder = '비밀번호', className = '', name },
    ref,
  ) => {
    /* 비밀번호 보이기/숨기기 */
    const [isVisible, setIsVisible] = useState(false)

    const toggleVisibility = () => setIsVisible(prev => !prev)

    return (
      <div className="relative w-full">
        <TextInput
          ref={ref}
          id="password"
          name={name}
          type={isVisible ? 'text' : 'password'}
          placeholder={placeholder}
          onChange={onChange}
          maxLength={16}
          className={`hbp:text-body-lg-regular aspect-[44/6] ${className}`}
        />

        {/*hasvalue 있을때만 invisible/visible 아이콘 보이기 */}
        {hasValue && (
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={toggleVisibility}
            className="absolute top-1/2 right-6 -translate-y-1/2 cursor-pointer p-1"
          >
            {isVisible ? (
              <InvisibleIcon className="hbp:h-6 hbp:w-6 [&_path]:stroke-icon-stroke h-5 w-5" />
            ) : (
              <VisibleIcon className="hbp:h-6 hbp:w-6 [&>path]:stroke-icon-stroke h-5 w-5" />
            )}
          </button>
        )}
      </div>
    )
  },
)

PasswordField.displayName = 'PasswordField'

export default PasswordField
