import { type ChangeEvent, forwardRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VisibilityIcon } from '@/shared/ui/icons/status-icons'
import { TextField } from '@/shared/ui/input-field'

interface PasswordFieldProps {
  hasValue?: boolean
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  name?: string
  value?: string
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className = '', hasValue, name, onChange, placeholder, value }, ref) => {
    const { t } = useTranslation()
    const [isVisible, setIsVisible] = useState(false)

    return (
      <div className="relative w-full">
        <TextField
          ref={ref}
          id="password"
          name={name}
          type={isVisible ? 'text' : 'password'}
          placeholder={placeholder || t('auth.login.passwordPlaceholder')}
          onChange={onChange}
          value={value}
          maxLength={16}
          className={`hbp:text-body-lg-regular aspect-[44/6] ${className}`}
        />

        {hasValue ? (
          <button
            type="button"
            onMouseDown={event => event.preventDefault()}
            onClick={() => setIsVisible(previous => !previous)}
            className="absolute top-1/2 right-6 -translate-y-1/2 cursor-pointer p-1"
          >
            <VisibilityIcon
              hidden={isVisible}
              className="text-icon-stroke hbp:h-6 hbp:w-6 h-5 w-5"
            />
          </button>
        ) : null}
      </div>
    )
  },
)

PasswordField.displayName = 'PasswordField'
