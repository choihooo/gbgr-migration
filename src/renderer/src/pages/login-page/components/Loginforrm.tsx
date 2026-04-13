import FailIcon from '@assets/auth/error_icon.svg?react'
import SaveIdIcon from '@assets/auth/saveid_icon.svg?react'
import { useLoginMutation } from '@entities/user'
import { TextField as TextInput } from '@shared/ui/input-field'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import LoginButton from './LoginButton'
import PasswordField from './PasswordField'

interface LoginFormData {
  email: string
  password: string
  saveId: boolean
}

const SAVED_EMAIL_KEY = 'savedEmail'

const LoginForm = () => {
  const { register, handleSubmit, watch, setValue } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      saveId: false,
    },
  })

  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY)
    if (savedEmail) {
      setValue('email', savedEmail)
      setValue('saveId', true)
    }
  }, [setValue])

  const loginMutation = useLoginMutation()
  const navigate = useNavigate()

  /* @react-refresh-ignore */
  const email = watch('email')
  /* @react-refresh-ignore */
  const password = watch('password')

  const handleSaveIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('saveId', e.target.checked)
  }

  const onSubmit = (data: LoginFormData) => {
    console.log('로그인 시도:', data)

    loginMutation.mutate(
      {
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: () => {
          /* 로그인 성공 시 아이디 저장 처리 */
          if (data.saveId) {
            localStorage.setItem(SAVED_EMAIL_KEY, data.email)
          } else {
            localStorage.removeItem(SAVED_EMAIL_KEY)
          }
        },
      },
    )
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="hbp:w-[550px] hbp:mt-15 mt-12 flex w-[440px] flex-col items-center gap-3"
      >
        {/* 이메일 */}
        <TextInput
          type="text"
          placeholder="이메일"
          {...register('email')}
          className="hbp:text-body-lg-regular aspect-[44/6]"
        />

        {/* 비밀번호 */}
        <PasswordField {...register('password')} hasValue={!!password} />
        {loginMutation.isError && (
          <div className="text-caption-sm-regular text-error flex gap-1 self-start">
            <FailIcon />
            <span>이메일 또는 비밀번호가 올바르지 않습니다.</span>
          </div>
        )}

        {/* 아이디 저장 */}
        <div className="text-caption-sm-regular hbp:text-body-lg-regular text-grey-400 mt-1 flex w-full justify-start gap-3">
          <label className="hbp:gap-2.5 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={watch('saveId')}
              onChange={handleSaveIdChange}
              className="sr-only"
            />
            <SaveIdIcon
              className={
                watch('saveId')
                  ? '[&>path]:stroke-check-stroke [&_path]:fill-none [&>rect]:fill-yellow-400'
                  : '[&>path]:stroke-check-stroke [&>rect]:fill-check-fill [&_path]:fill-none'
              }
            />
            <span>아이디 저장</span>
          </label>
        </div>

        {/* 버튼 */}
        <LoginButton type="submit" disabled={!email || !password} />
      </form>

      {/* 회원가입 / 비밀번호 찾기 */}
      <div className="text-grey-300 text-caption-sm-regular hbp:text-body-lg-regular hbp:gap-[25px] hbp:mt-10 mt-8 flex flex-row gap-5">
        <span
          onClick={() => navigate('/auth/signup')}
          className="cursor-pointer"
        >
          회원가입
        </span>
        <span>|</span>
        <span className="cursor-pointer">비밀번호 찾기</span>
      </div>
    </>
  )
}

export default LoginForm
