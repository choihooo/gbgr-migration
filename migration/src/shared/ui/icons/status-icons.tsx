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
