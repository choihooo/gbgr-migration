from __future__ import annotations

import time


class PostureStabilizer:
    """급격한 자세 변화로 인한 잘못된 단계 전환을 방지하는 안정화 필터."""

    def __init__(
        self,
        window_ms: int = 500,
        threshold: float = 0.5,
        min_buffer_size: int = 5,
    ) -> None:
        self._window_ms = window_ms
        self._threshold = threshold
        self._min_buffer_size = min_buffer_size
        self._buffer: list[tuple[float, int]] = []  # (score, timestamp_ms)
        self._last_stable_score: float = 0.0

    def add_score(self, score: float, timestamp_ms: int) -> None:
        """버퍼에 점수 추가 후 윈도우 밖 데이터를 제거한다."""
        self._buffer.append((score, timestamp_ms))
        cutoff = timestamp_ms - self._window_ms
        self._buffer = [(s, t) for s, t in self._buffer if t >= cutoff]

    def should_update(
        self,
        current_score: float,
        relaxed_threshold: float | None = None,
    ) -> bool:
        """현재 점수가 안정화 검사를 통과하는지 확인한다.

        버퍼가 충분하지 않으면 True.
        이전 점수들의 가중 평균과 현재 점수 차이가 threshold 이내면 True.
        """
        if len(self._buffer) < self._min_buffer_size:
            return True

        previous = self._buffer[:-1]
        if not previous:
            return True

        current_ts = self._buffer[-1][1]
        average = self._calculate_weighted_average(previous, current_ts)

        difference = abs(current_score - average)
        effective_threshold = relaxed_threshold if relaxed_threshold is not None else self._threshold

        return difference <= effective_threshold

    def reset(self) -> None:
        """버퍼를 초기화한다."""
        self._buffer = []
        self._last_stable_score = 0.0

    @property
    def last_stable_score(self) -> float:
        return self._last_stable_score

    @last_stable_score.setter
    def last_stable_score(self, value: float) -> None:
        self._last_stable_score = value

    def _calculate_weighted_average(
        self,
        entries: list[tuple[float, int]],
        current_timestamp: int,
    ) -> float:
        if not entries:
            return 0.0

        weighted_sum = 0.0
        total_weight = 0.0

        for score, timestamp in entries:
            elapsed = current_timestamp - timestamp
            weight = max(0.0, 1.0 - elapsed / self._window_ms)
            if weight <= 0:
                continue
            weighted_sum += score * weight
            total_weight += weight

        if total_weight == 0:
            return sum(s for s, _ in entries) / len(entries)

        return weighted_sum / total_weight
