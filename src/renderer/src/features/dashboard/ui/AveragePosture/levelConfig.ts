import stepFiveCharacter from '@assets/main/averagePosture/step_five_character.png'
import stepFourCharacter from '@assets/main/averagePosture/step_four_character.png'
import stepOneCharacter from '@assets/main/averagePosture/step_one_character.png'
import stepThreeCharacter from '@assets/main/averagePosture/step_three_character.png'
import stepTwoCharacter from '@assets/main/averagePosture/step_two_character.png'

export interface LevelInfo {
  level: number
  name: string
  tilt: string
  weight: string
  character: string
}

// 점수에 따른 레벨 정보
export const LEVEL_INFO: LevelInfo[] = [
  {
    level: 1,
    name: '뽀각거부기',
    tilt: '약 55–60°',
    weight: '약 26–27 kg',
    character: stepOneCharacter,
  },
  {
    level: 2,
    name: '꾸부정 거부기',
    tilt: '약 40–45°',
    weight: '약 20–22 kg',
    character: stepTwoCharacter,
  },
  {
    level: 3,
    name: '아기기린',
    tilt: '약 25–30°',
    weight: '약 16–18 kg',
    character: stepThreeCharacter,
  },
  {
    level: 4,
    name: '쑥쑥기린',
    tilt: '약 10–15°',
    weight: '약 10–12 kg',
    character: stepFourCharacter,
  },
  {
    level: 5,
    name: '꼿꼿기린',
    tilt: '약 0–5°',
    weight: '약 5–6 kg',
    character: stepFiveCharacter,
  },
]

// 점수에 따른 레벨 계산
export const getLevel = (score: number): number => {
  if (score < 35) return 1
  if (score < 55) return 2
  if (score < 72) return 3
  if (score < 88) return 4
  return 5
}
