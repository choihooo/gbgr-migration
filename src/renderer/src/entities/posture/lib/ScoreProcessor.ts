// Helper functions from the python script, translated to JS
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getPercentile(data: number[], percentile: number): number {
  if (data.length === 0) return 0
  const sortedData = [...data].sort((a, b) => a - b)
  const index = (percentile / 100) * (sortedData.length - 1)
  if (Number.isInteger(index)) {
    return sortedData[index]
  }
  const lowerIndex = Math.floor(index)
  const upperIndex = Math.ceil(index)
  const weight = index - lowerIndex
  return sortedData[lowerIndex] * (1 - weight) + sortedData[upperIndex] * weight
}

function applyMovingAverage(scores: number[], window: number): number[] {
  if (scores.length === 0) return []

  const smoothed: number[] = []
  for (let i = 0; i < scores.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2))
    const end = Math.min(scores.length, i + Math.floor(window / 2) + 1)
    const windowSlice = scores.slice(start, end)
    const mean =
      windowSlice.reduce((sum, val) => sum + val, 0) / windowSlice.length
    smoothed.push(mean)
  }
  return smoothed
}

function applyEma(scores: number[], window: number): number[] {
  if (scores.length === 0) return []

  const alpha = 2 / (window + 1)
  const emaScores = [scores[0]]

  for (let i = 1; i < scores.length; i++) {
    const ema =
      alpha * scores[i] + (1 - alpha) * emaScores[emaScores.length - 1]
    emaScores.push(ema)
  }
  return emaScores
}

/**
 * Applies a series of smoothing and filtering operations to a buffer of scores,
 * exactly replicating the logic from the provided Python script.
 */
export class ScoreProcessor {
  private scoreBuffer: number[] = []
  private readonly bufferSize = 100 // A buffer to run the batch processing on

  /**
   * Adds a new score to the buffer and re-processes the entire buffer.
   * @param score The raw score to process.
   * @returns The latest processed score from the buffer.
   */
  public next(score: number): number {
    this.scoreBuffer.push(score)
    if (this.scoreBuffer.length > this.bufferSize) {
      this.scoreBuffer.shift()
    }

    // Need a minimum number of scores to get meaningful stats
    if (this.scoreBuffer.length < 30) {
      return Math.max(-10, Math.min(40, score)) // Clamp raw score
    }

    // Run the full batch processing every time, exactly as in the python script
    // 1. Clamp scores
    const filteredScores = this.scoreBuffer.map(s =>
      Math.max(-10, Math.min(40, s)),
    )

    // 2. Remove outliers
    // const cleanedScores = removeOutliersIqr(filteredScores, 1.0);

    // 3. Moving Average (window=15)
    const smoothed1 = applyMovingAverage(filteredScores, 15)

    // 4. EMA (window=30)
    const smoothed2 = applyEma(smoothed1, 30)

    // 5. EMA (window=70)
    const finalScores = applyEma(smoothed2, 70)

    const finalScore = finalScores[finalScores.length - 1]

    // Return the final score, also clamped for safety.
    return Math.max(-10, Math.min(40, finalScore))
  }

  /**
   * Resets the internal score buffer.
   */
  public reset(): void {
    this.scoreBuffer = []
  }
}
