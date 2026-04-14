import type { SVGProps } from 'react'

function IconWrapper(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    />
  )
}

export function ErrorStatusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconWrapper {...props}>
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <path
        d="M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </IconWrapper>
  )
}

export function SuccessStatusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconWrapper {...props}>
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <path
        d="M5.5 10.5L8.4 13.1L14.5 7.3"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  )
}

/** 성공 체크 아이콘 — 레거시 notification-message/icons.tsx */
export function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="성공"
      className={className}
    >
      <circle cx="20" cy="20" r="20" fill="var(--color-yellow-500)" />
      <path
        d="M13 21.0909L16.8514 25.2554C17.2301 25.6649 17.8707 25.6854 18.2748 25.3009L27 17"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** 에러 아이콘 — 레거시 notification-message/icons.tsx */
export function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="에러"
      className={className}
    >
      <g clipPath="url(#clip0_625_2297)">
        <path
          d="M10.0013 6.66671V10M10.0013 13.3334H10.0096M18.3346 10C18.3346 5.39767 14.6037 1.66671 10.0013 1.66671C5.39893 1.66671 1.66797 5.39767 1.66797 10C1.66797 14.6024 5.39893 18.3334 10.0013 18.3334C14.6037 18.3334 18.3346 14.6024 18.3346 10Z"
          stroke="#FF3232"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_625_2297">
          <rect
            width="20"
            height="20"
            fill="white"
            transform="matrix(1 0 0 -1 0 20)"
          />
        </clipPath>
      </defs>
    </svg>
  )
}

export function VisibilityIcon({
  hidden = false,
  ...props
}: SVGProps<SVGSVGElement> & { hidden?: boolean }) {
  return (
    <IconWrapper {...props}>
      <path
        d="M2.2 10C3.7 6.9 6.5 5 10 5C13.5 5 16.3 6.9 17.8 10C16.3 13.1 13.5 15 10 15C6.5 15 3.7 13.1 2.2 10Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      {hidden ? (
        <path
          d="M4 16L16 4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ) : null}
    </IconWrapper>
  )
}
