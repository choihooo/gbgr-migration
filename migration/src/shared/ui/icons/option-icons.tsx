/**
 * @legacy src/renderer/src/assets/option/CalibrationResetIcon.svg
 * @legacy src/renderer/src/assets/option/LogoutIcon.svg
 * @legacy src/renderer/src/assets/option/WithdrawIcon.svg
 */
import type { SVGProps } from 'react'

export function CalibrationResetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="보정 초기화"
      {...props}
    >
      <rect
        x="0.25"
        y="0.25"
        width="23.5"
        height="23.5"
        rx="5.75"
        fill="#EFEEED"
      />
      <rect
        x="0.25"
        y="0.25"
        width="23.5"
        height="23.5"
        rx="5.75"
        stroke="#E3E1DF"
        strokeWidth="0.5"
      />
      <path
        d="M15.9615 10.7448C14.5257 10.7448 13.2694 10.5654 10.9362 9.66797V14.6934L15.9615 15.4113V19.0008"
        stroke="#7E7E7B"
        strokeWidth="1.43224"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.70557 11.4609V16.3984C7.70557 16.6575 7.89011 16.8799 8.14477 16.9276L13.4489 17.9222"
        stroke="#7E7E7B"
        strokeWidth="1.43224"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.9355 7.87165C11.7284 7.87165 12.3713 7.22881 12.3713 6.43583C12.3713 5.64284 11.7284 5 10.9355 5C10.1425 5 9.49963 5.64284 9.49963 6.43583C9.49963 7.22881 10.1425 7.87165 10.9355 7.87165Z"
        stroke="#7E7E7B"
        strokeWidth="1.43224"
      />
    </svg>
  )
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="로그아웃"
      {...props}
    >
      <rect
        x="0.333333"
        y="0.333333"
        width="23.3333"
        height="23.3333"
        rx="5.66667"
        fill="#EFEEED"
      />
      <rect
        x="0.333333"
        y="0.333333"
        width="23.3333"
        height="23.3333"
        rx="5.66667"
        stroke="#E3E1DF"
        strokeWidth="0.666667"
      />
      <path
        d="M14.6667 15.3333L18 12M18 12L14.6667 8.66667M18 12H10M10 6H9.2C8.0799 6 7.51984 6 7.09202 6.21799C6.7157 6.40973 6.40973 6.71569 6.21799 7.09202C6 7.51984 6 8.07989 6 9.2V14.8C6 15.9201 6 16.4802 6.21799 16.908C6.40973 17.2843 6.71569 17.5903 7.09202 17.782C7.51984 18 8.0799 18 9.2 18H10"
        stroke="#7E7E7B"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WithdrawIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="회원 탈퇴"
      {...props}
    >
      <rect
        x="0.333333"
        y="0.333333"
        width="23.3333"
        height="23.3333"
        rx="5.66667"
        fill="#EFEEED"
      />
      <rect
        x="0.333333"
        y="0.333333"
        width="23.3333"
        height="23.3333"
        rx="5.66667"
        stroke="#E3E1DF"
        strokeWidth="0.666667"
      />
      <path
        d="M6 18.0013V17.3346C6 15.8613 7.19333 14.668 8.66667 14.668H11.3333C12.8067 14.668 14 15.8613 14 17.3346V18.0013"
        stroke="#7E7E7B"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 12.668C8.89333 12.668 8 11.7746 8 10.668C8 9.5613 8.89333 8.66797 10 8.66797C11.1067 8.66797 12 9.5613 12 10.668C12 11.7746 11.1067 12.668 10 12.668Z"
        stroke="#7E7E7B"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 6L18 10"
        stroke="#7E7E7B"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 6L14 10"
        stroke="#7E7E7B"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
