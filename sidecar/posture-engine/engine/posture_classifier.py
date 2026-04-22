from __future__ import annotations

from dataclasses import dataclass

from .score_processor import ScoreProcessor


@dataclass
class Classification:
    text: str
    cls: int
    zScore: float
    PI_EMA: float
    z_PI: float
    gamma: float
    Score: float
    events: list[str]


def get_score_level(score: float) -> tuple[int, str]:
    if score <= -7.0:
        return 1, "angel-rini"
    if score <= -3.6:
        return 2, "pm-rini"
    if score <= 1.2:
        return 3, "rini"
    if score <= 6.0:
        return 4, "bugi"
    if score <= 12.5:
        return 5, "stone-bugi"
    return 6, "tire-bugi"


class PostureClassifier:
    def __init__(self) -> None:
        self._ema_value: float | None = None
        self._processor = ScoreProcessor()
        self._state = "normal"

    def _next_ema(self, value: float, alpha: float = 0.25) -> float:
        if self._ema_value is None:
            self._ema_value = value
        else:
            self._ema_value = alpha * value + (1 - alpha) * self._ema_value
        return self._ema_value

    def classify(self, pi_raw: float, mu: float, sigma: float) -> Classification:
        if sigma == 0:
            return Classification("측정중", 0, 0.0, 0.0, 0.0, 0.0, 0.0, [])

        pi_ema = self._next_ema(pi_raw)
        z_pi = (pi_ema - mu) / (sigma + 1e-6)
        gamma = 1.0
        score = self._processor.next(gamma * z_pi)

        events: list[str] = []
        if self._state == "normal" and score >= 1.2:
            self._state = "bad"
            events.append("enter_bad")
        elif self._state == "bad" and score <= 0.8:
            self._state = "normal"
            events.append("exit_bad")

        cls, text = get_score_level(score)
        return Classification(text, cls, score, pi_ema, z_pi, gamma, score, events)

    def reset(self) -> None:
        self._ema_value = None
        self._state = "normal"
        self._processor.reset()
