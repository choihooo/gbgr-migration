interface ResendSectionProps {
  onClick: () => void
}

export default function ResendSection({ onClick }: ResendSectionProps) {
  return (
    <p className="text-caption-sm-regular text-grey-300 mt-8 flex flex-row gap-3">
      이메일을 못받으셨나요?
      <span
        onClick={onClick}
        className="cursor-pointer text-yellow-500 underline"
      >
        이메일 다시 보내기
      </span>
    </p>
  )
}
