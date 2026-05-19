from __future__ import annotations

import time
from dataclasses import dataclass

from .posture_stabilizer import PostureStabilizer
from .score_processor import ScoreProcessor

MIN_SIGMA = 1e-3


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
        self._stabilizer = PostureStabilizer()
        self._state = "normal"
        self._mu: float = 0.0
        self._sigma: float = 1.0

    def next_pi_ema(self, value: float, alpha: float = 0.25) -> float:
        if self._ema_value is None:
            self._ema_value = value
        else:
            self._ema_value = alpha * value + (1 - alpha) * self._ema_value
        return self._ema_value

    def set_calibration(self, mu: float, sigma: float) -> None:
        """캘리브레이션 결과(mu, sigma)를 설정한다."""
        self._mu = mu
        self._sigma = max(abs(sigma), MIN_SIGMA)

    @property
    def calibration(self) -> dict[str, float]:
        return {"mu": self._mu, "sigma": self._sigma}

    def classify(
        self,
        pi_raw: float,
        mu: float | None = None,
        sigma: float | None = None,
    ) -> Classification:
        if mu is not None and sigma is not None:
            self.set_calibration(mu, sigma)

        pi_ema = self.next_pi_ema(pi_raw)
        z_pi = (pi_ema - self._mu) / (self._sigma + 1e-6)
        gamma = 1.0
        raw_score = self._processor.next(gamma * z_pi)

        # PostureStabilizer 적용
        timestamp_ms = int(time.time() * 1000)
        self._stabilizer.add_score(raw_score, timestamp_ms)

        if self._stabilizer.should_update(raw_score):
            score = raw_score
        else:
            score = self._stabilizer.last_stable_score

        self._stabilizer.last_stable_score = score

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
        self._stabilizer.reset()
