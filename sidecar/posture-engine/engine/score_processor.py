from __future__ import annotations


def _apply_moving_average(scores: list[float], window: int) -> list[float]:
    smoothed: list[float] = []
    for index in range(len(scores)):
        start = max(0, index - window // 2)
        end = min(len(scores), index + window // 2 + 1)
        chunk = scores[start:end]
        smoothed.append(sum(chunk) / len(chunk))
    return smoothed


def _apply_ema(scores: list[float], window: int) -> list[float]:
    if not scores:
        return []

    alpha = 2 / (window + 1)
    ema_scores = [scores[0]]
    for score in scores[1:]:
        ema_scores.append(alpha * score + (1 - alpha) * ema_scores[-1])
    return ema_scores


class ScoreProcessor:
    def __init__(self) -> None:
        self.score_buffer: list[float] = []
        self.buffer_size = 60

    def next(self, score: float) -> float:
        self.score_buffer.append(score)
        if len(self.score_buffer) > self.buffer_size:
            self.score_buffer.pop(0)

        if len(self.score_buffer) < 15:
            return max(-10.0, min(40.0, score))

        filtered_scores = [max(-10.0, min(40.0, value)) for value in self.score_buffer]
        smoothed = _apply_moving_average(filtered_scores, 7)
        ema_12 = _apply_ema(smoothed, 12)
        final_scores = _apply_ema(ema_12, 24)
        return max(-10.0, min(40.0, final_scores[-1]))

    def reset(self) -> None:
        self.score_buffer = []
