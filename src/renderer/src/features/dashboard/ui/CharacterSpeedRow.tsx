import { CHARACTER_COMPONENTS } from './CharacterSpeedRow/constants'

interface CharacterSpeedRowProps {
  level: number
  name: string
  speed: string
}

const CharacterSpeedRow = ({ level, name, speed }: CharacterSpeedRowProps) => {
  const CharacterComponent = CHARACTER_COMPONENTS[level]

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex w-25 items-center gap-1">
        <div className="bg-sementic-brand-primary text-grey-0 text-caption-xs-medium flex h-[18px] w-4 items-center justify-center rounded-full">
          {level}
        </div>
        <span>{name}</span>
      </div>
      <div className="flex w-[150px] justify-center">
        {CharacterComponent && (
          <div className="max-[1439px]:scale-[0.8]">
            <CharacterComponent />
          </div>
        )}
      </div>
      <div className="w-[43px] text-left">{speed}</div>
    </div>
  )
}

export default CharacterSpeedRow
