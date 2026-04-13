import FailIcon from '@assets/auth/error_icon.svg?react'
import SuccessIcon from '@assets/auth/success_icon.svg?react'
import {
  useDuplicatedEmailMutation,
  useEmailStore,
  useSignupMutation,
} from '@entities/user'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@shared/ui/button'
import { TextField } from '@shared/ui/input-field'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import PasswordField from '../../login/components/PasswordField'
import { type SignUpFormData, signUpSchema } from '../utils/SignupSchemas'

const SignUpForm = () => {
  const { mutate: checkDuplicateEmail } = useDuplicatedEmailMutation()
  const signupMutation = useSignupMutation()
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null)
  const [duplicateSuccess, setDuplicateSuccess] = useState<boolean | null>(null)
  const { setEmail } = useEmailStore()
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors, isValid },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
  })

  const formValues = watch()

  /* 이메일 중복 확인 */
  const handleDuplicateCheck = () => {
    const email = getValues('email')
    if (!email) return

    checkDuplicateEmail(email, {
      onSuccess: data => {
        if (data?.data?.isDuplicate) {
          console.log(data)
          setDuplicateSuccess(false)
          setDuplicateMessage('이미 가입된 이메일입니다.')
        } else {
          console.log(data)
          setDuplicateSuccess(true)
          setDuplicateMessage('사용 가능한 이메일입니다')
        }
      },
      onError: () => {
        setDuplicateSuccess(false)
        setDuplicateMessage('이미 가입된 이메일입니다.')
      },
    })
  }

  /* 회원가입 */
  const onSubmit = (data: SignUpFormData) => {
    if (duplicateSuccess !== true) {
      setDuplicateMessage('이메일 중복확인을 완료해주세요')
      setDuplicateSuccess(false)
      return
    }

    setEmail(data.email)

    signupMutation.mutate({
      email: data.email,
      password: data.password,
      name: data.name,
      avatar: '',
      callbackUrl: '',
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="hbp:w-[550px] hbp:gap-[75px] flex w-110 flex-col gap-15"
    >
      {/* 이메일 섹션 */}
      <div className="hbp:gap-[12.5px] flex w-full flex-col gap-[10px]">
        <label
          htmlFor="email"
          className="text-body-lg-semibold hbp:text-headline-2xl-semibold text-grey-600"
        >
          이메일 <span className="text-error">*</span>
        </label>
        <div className="hbp:gap-[12.5px] flex w-full flex-row items-center justify-center gap-[10px]">
          <TextField
            id="email"
            type="email"
            placeholder="이메일을 입력해주세요."
            {...register('email', {
              onChange: () => {
                // 이메일 값이 바뀌면 중복확인 상태 초기화
                if (duplicateSuccess !== null) {
                  setDuplicateSuccess(null)
                  setDuplicateMessage(null)
                }
              },
            })}
            className={`hbp:text-body-xl-regular aspect-[338/60] flex-1 ${
              errors.email
                ? '!border-error'
                : duplicateSuccess === true
                  ? '!border-success'
                  : duplicateSuccess === false
                    ? '!border-error'
                    : ''
            }`}
          />
          <Button
            onClick={handleDuplicateCheck}
            text="중복확인"
            size="sm"
            disabled={duplicateSuccess === true}
            className="hbp:w-[115px] hbp:h-[50px] hbp:text-body-xl-medium w-[92px] whitespace-nowrap"
          />
        </div>
        {(errors.email || duplicateMessage) && (
          <div
            className={`flex gap-1.5 ${
              errors.email || duplicateSuccess === false
                ? 'text-error'
                : 'text-success'
            }`}
          >
            {errors.email || duplicateSuccess === false ? (
              <FailIcon />
            ) : (
              <SuccessIcon />
            )}
            <p className="text-caption-sm-regular">
              {errors.email?.message || duplicateMessage || ''}
            </p>
          </div>
        )}
      </div>

      {/* 비밀번호 섹션 */}
      <div className="hbp:gap-1.5 flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-body-lg-semibold hbp:text-headline-2xl-semibold text-grey-600"
        >
          비밀번호 <span className="text-error">*</span>
        </label>
        <p className="hbp:mb-[7.5px] text-caption-sm-medium hbp:text-body-md-medium text-grey-300 mb-[6px]">
          영문, 숫자, 특수문자를 조합하여 8-16글자로 입력해주세요.
        </p>
        <PasswordField
          {...register('password')}
          hasValue={!!formValues.password}
          className="mb-2"
        />

        {/* 비밀번호 재입력 섹션 */}
        <PasswordField
          {...register('confirmPassword')}
          hasValue={!!formValues.confirmPassword}
          placeholder="비밀번호를 재입력해주세요."
          className={
            !formValues.confirmPassword
              ? '' // 아무 입력 없으면 기본
              : formValues.password === formValues.confirmPassword &&
                  !errors.password
                ? '!border-success' // 입력 있음 + 비밀번호 조건 통과 + 일치시 초록색
                : '!border-error' // 그 외는 모두 빨간색
          }
        />

        {
          /* 비밀번호 일치 여부 및 유효성 메시지 표시 */
          formValues.confirmPassword &&
            (() => {
              /*비밀번호 불일치 또는 유효성 조건 미충족*/
              const isError =
                formValues.password !== formValues.confirmPassword ||
                !!errors.password

              const colorClass = isError ? 'text-error' : 'text-success'
              const Icon = isError ? FailIcon : SuccessIcon
              const message = isError
                ? errors.password?.message || '비밀번호가 일치하지 않습니다.'
                : '비밀번호가 일치합니다.'

              return (
                <div className={`mt-1 flex gap-1.5 ${colorClass}`}>
                  <Icon />
                  <p className="text-caption-sm-regular">{message}</p>
                </div>
              )
            })()
        }
      </div>

      {/* 이름 섹션 */}
      <div className="hbp:gap-1.5 flex flex-col gap-1">
        <label
          htmlFor="name"
          className="text-body-lg-semibold hbp:text-headline-2xl-semibold text-grey-600"
        >
          이름 <span className="text-error">*</span>
        </label>
        <p className="hbp:mb-[7.5px] text-caption-sm-medium hbp:text-body-md-medium text-grey-300 mb-[6px]">
          최대 10글자 이내로 작성해주세요.
        </p>
        <TextField
          id="name"
          type="text"
          placeholder="이름을 입력해주세요."
          {...register('name')}
          className={`hbp:text-body-xl-regular ${errors.name ? '!border-error' : formValues.name ? '!border-success' : ''}`}
        />

        {(formValues.name || !!errors.name) && (
          <div
            className={`mt-1 flex items-center gap-1.5 ${
              errors.name ? 'text-error' : 'text-success'
            }`}
          >
            {errors.name ? <FailIcon /> : <SuccessIcon />}
            <p className="text-caption-sm-regular">
              {errors.name ? errors.name.message : '사용 가능한 이름입니다.'}
            </p>
          </div>
        )}
      </div>

      {/* 완료 버튼 */}
      <Button
        type="submit"
        text="완료"
        size="xl"
        disabled={!isValid || signupMutation.isPending}
      />
    </form>
  )
}

export default SignUpForm
