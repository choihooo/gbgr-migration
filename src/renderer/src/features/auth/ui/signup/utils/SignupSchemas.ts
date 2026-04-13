import { z } from 'zod'

export const signUpSchema = z
  .object({
    email: z.string().email('유효한 이메일을 입력해주세요.'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .max(16, '비밀번호는 16자 이하여야 합니다.')
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[~`!@#$%^&*()_\-+={[}\]|\\:;"'<>,.?/])[A-Za-z\d~`!@#$%^&*()_\-+={[}\]|\\:;"'<>,.?/]+$/,
        '영문, 숫자, 특수문자를 조합해주세요.',
      ),
    confirmPassword: z.string(),
    name: z
      .string()
      .min(1, '이름을 입력해주세요.')
      .max(10, '최대 글자수를 초과했습니다.')
      .refine(val => !/\s/.test(val), {
        message: '띄어쓰기 없이 붙여 작성해주세요.',
      }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  })

export type SignUpFormData = z.infer<typeof signUpSchema>
