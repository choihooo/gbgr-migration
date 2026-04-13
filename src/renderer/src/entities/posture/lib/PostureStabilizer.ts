/**
 * 단계 전환 안정화 검사 클래스
 * 급격한 자세 변화로 인한 잘못된 단계 전환을 방지합니다.
 */
export class PostureStabilizer {
  private scoreBuffer: Array<{ score: number; timestamp: number }> = []
  private readonly windowMs: number
  private readonly threshold: number
  private readonly minBufferSize: number

  constructor(windowMs = 500, threshold = 0.5, minBufferSize = 5) {
    this.windowMs = windowMs
    this.threshold = threshold
    this.minBufferSize = minBufferSize
  }

  /**
   * 현재 프레임의 Score를 버퍼에 추가하고 오래된 데이터를 제거합니다.
   * @param score 현재 프레임의 Score
   * @param timestamp 현재 시간 (ms)
   */
  public addScore(score: number, timestamp: number): void {
    this.scoreBuffer.push({ score, timestamp })

    // 윈도우 시간 이전 데이터 제거
    const cutoffTime = timestamp - this.windowMs
    this.scoreBuffer = this.scoreBuffer.filter(
      entry => entry.timestamp >= cutoffTime,
    )
  }

  /**
   * 현재 Score가 안정화 검사를 통과하는지 확인합니다.
   * @param currentScore 현재 프레임의 Score
   * @param relaxedThreshold 선택적 완화된 threshold (기본값: this.threshold)
   * @returns true면 업데이트 허용, false면 이전 상태 유지
   */
  public shouldUpdate(
    currentScore: number,
    relaxedThreshold?: number,
  ): boolean {
    // 버퍼에 충분한 데이터가 없으면 업데이트 허용
    if (this.scoreBuffer.length < this.minBufferSize) {
      return true
    }

    // 현재 점수는 이미 버퍼에 추가되어 있으므로, 이전 점수들만으로 평균 계산
    const previousScores = this.scoreBuffer.slice(0, -1)

    // 이전 점수가 없으면 (버퍼에 현재 점수만 있으면) 업데이트 허용
    if (previousScores.length === 0) {
      return true
    }

    const currentEntry = this.scoreBuffer[this.scoreBuffer.length - 1]
    const averageScore = this.calculateWeightedAverage(
      previousScores,
      currentEntry.timestamp,
    )

    // 현재 프레임과 이전 점수들의 평균의 오차 계산
    const scoreDifference = Math.abs(currentScore - averageScore)

    // 사용할 threshold 결정 (완화된 threshold가 제공되면 사용)
    const effectiveThreshold = relaxedThreshold ?? this.threshold

    // 오차가 임계값보다 크면 이전 상태 유지
    if (scoreDifference > effectiveThreshold) {
      return false
    }

    return true
  }

  /**
   * 디버깅용: 현재 버퍼 상태 정보를 반환합니다.
   */
  public getDebugInfo(currentScore: number): {
    bufferSize: number
    averageScore: number
    currentScore: number
    scoreDifference: number
    threshold: number
    shouldUpdate: boolean
  } {
    // 현재 점수를 제외한 이전 점수들의 평균 계산
    const previousScores = this.scoreBuffer.slice(0, -1)
    const currentEntry = this.scoreBuffer[this.scoreBuffer.length - 1]
    const averageScore =
      previousScores.length > 0
        ? this.calculateWeightedAverage(previousScores, currentEntry.timestamp)
        : currentScore
    const scoreDifference = Math.abs(currentScore - averageScore)
    const shouldUpdate = this.shouldUpdate(currentScore)

    return {
      bufferSize: this.scoreBuffer.length,
      averageScore,
      currentScore,
      scoreDifference,
      threshold: this.threshold,
      shouldUpdate,
    }
  }

  /**
   * 내부 버퍼를 초기화합니다.
   */
  public reset(): void {
    this.scoreBuffer = []
  }

  private calculateWeightedAverage(
    entries: Array<{ score: number; timestamp: number }>,
    currentTimestamp: number,
  ): number {
    if (entries.length === 0) {
      return 0
    }

    let weightedSum = 0
    let totalWeight = 0

    for (const entry of entries) {
      const elapsed = currentTimestamp - entry.timestamp
      const weight = Math.max(0, 1 - elapsed / this.windowMs)

      if (weight <= 0) {
        continue
      }

      weightedSum += entry.score * weight
      totalWeight += weight
    }

    if (totalWeight === 0) {
      return (
        entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length
      )
    }

    return weightedSum / totalWeight
  }
}
