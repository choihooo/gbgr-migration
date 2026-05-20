from __future__ import annotations

from dataclasses import dataclass


@dataclass
class EngineStateMessage:
    engine_status: str
    mode: str
    camera_owner: str
    updated_at: str
    message: str | None
    recoverable: bool
    stream_url: str | None = None


@dataclass
class LandmarkMessage:
    x: float
    y: float
    z: float
    visibility: float | None = None


@dataclass
class ResultMessage:
    result_id: str
    session_id: str
    timestamp: str
    posture_class: int
    score: float
    pi: float | None
    landmarks: list[LandmarkMessage | dict]
    source: str
    engine_mode: str
    events: list[str]
