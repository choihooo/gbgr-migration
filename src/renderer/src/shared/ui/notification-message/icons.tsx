/** 성공 체크 아이콘 */
export function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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

/** 에러 아이콘 */
export function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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
