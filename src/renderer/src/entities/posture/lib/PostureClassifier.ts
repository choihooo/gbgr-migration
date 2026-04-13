import { getScoreLevel } from '@shared/lib/get-score-level'
import { ScoreProcessor } from './ScoreProcessor'
import { EmaSmoother } from './calculations'
import type { FrontalityResult, PIResult, PostureClassification } from './types'
// 자세 판정 엔진
export class PostureClassifier {
  private prevState = {
    PI_EMA: null as number | null,
    state: 'normal' as 'normal' | 'bad',
  }

  private emaSmoother = new EmaSmoother(0.25)
  private scoreProcessor = new ScoreProcessor()

  // 마지막으로 반환된 상태
  private lastState: PostureClassification | null = null

  classify(
    piData: PIResult,
    mu: number,
    sigma: number,
    _frontality: FrontalityResult,
  ): PostureClassification {
    // 캘리브레이션 데이터가 유효하지 않으면 초기 상태 반환
    if (sigma === 0) {
      return (
        this.lastState ?? {
          text: '측정중',
          cls: 0,
          zScore: 0,
          PI_EMA: 0,
          z_PI: 0,
          gamma: 0,
          Score: 0,
          events: [],
        }
      )
    }

    const PI_raw = piData.PI_raw
    const PI_EMA = this.emaSmoother.next(PI_raw)
    const z_PI = (PI_EMA - mu) / (sigma + 1e-6)
    const gamma = 1.0
    const rawScore = gamma * z_PI
    const finalScore = this.scoreProcessor.next(rawScore)

    // 현재 프레임의 분류 결과 생성
    const currentClassification = this.createClassification(finalScore, {
      PI_EMA,
      z_PI,
      gamma,
    })

    // 상태 업데이트
    this.lastState = currentClassification

    return currentClassification
  }

  /**
   * 점수와 추가 데이터를 기반으로 PostureClassification 객체를 생성합니다.
   * 히스테리시스 로직을 포함합니다.
   */
  private createClassification(
    score: number,
    details: { PI_EMA: number; z_PI: number; gamma: number },
  ): PostureClassification {
    const enter_bad = 1.2
    const exit_bad = 0.8

    let newState = this.prevState.state
    const events: string[] = []

    if (this.prevState.state === 'normal' && score >= enter_bad) {
      newState = 'bad'
      events.push('enter_bad')
    } else if (this.prevState.state === 'bad' && score <= exit_bad) {
      newState = 'normal'
      events.push('exit_bad')
    }

    this.prevState = { PI_EMA: details.PI_EMA, state: newState }

    const levelInfo = getScoreLevel(score)

    return {
      text: levelInfo.name,
      cls: levelInfo.level,
      zScore: score,
      Score: score,
      events,
      ...details,
    }
  }

  reset() {
    this.prevState = { PI_EMA: null, state: 'normal' }
    this.emaSmoother.reset()
    this.scoreProcessor.reset()
    this.lastState = null
  }
}
