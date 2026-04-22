from __future__ import annotations

from math import atan2, degrees, sqrt
from typing import Iterable


def _midpoint(a: dict, b: dict) -> dict[str, float]:
    return {
        "x": (a["x"] + b["x"]) / 2,
        "y": (a["y"] + b["y"]) / 2,
        "z": (a["z"] + b["z"]) / 2,
    }


def calculate_pi(landmarks: Iterable[dict], world_landmarks: list[dict]) -> dict | None:
    if not world_landmarks:
        return None

    left_ear = world_landmarks[7]
    right_ear = world_landmarks[8]
    left_shoulder = world_landmarks[11]
    right_shoulder = world_landmarks[12]

    shoulder_mid = _midpoint(left_shoulder, right_shoulder)
    ear_mid = _midpoint(left_ear, right_ear)
    shoulder_width = sqrt(
        (right_shoulder["x"] - left_shoulder["x"]) ** 2
        + (right_shoulder["y"] - left_shoulder["y"]) ** 2
        + (right_shoulder["z"] - left_shoulder["z"]) ** 2
    )

    if shoulder_width == 0:
        return None

    pi_raw = (shoulder_mid["z"] - ear_mid["z"]) / shoulder_width
    return {
        "PI_raw": pi_raw,
        "S": shoulder_mid,
        "E": ear_mid,
        "W": shoulder_width,
    }


def check_frontality(landmarks: list[dict]) -> dict[str, float | bool]:
    left_ear = landmarks[7]
    right_ear = landmarks[8]
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]
    nose = landmarks[0]

    roll = abs(degrees(atan2(abs(right_ear["y"] - left_ear["y"]), right_ear["x"] - left_ear["x"])))
    shoulder_width_2d = sqrt(
        (right_shoulder["x"] - left_shoulder["x"]) ** 2
        + (right_shoulder["y"] - left_shoulder["y"]) ** 2
    )
    center_ratio = (
        abs(nose["x"] - ((left_shoulder["x"] + right_shoulder["x"]) / 2)) / shoulder_width_2d
        if shoulder_width_2d > 0
        else 1.0
    )

    return {
        "pass": roll <= 10 and center_ratio <= 0.15,
        "roll": roll,
        "centerRatio": center_ratio,
    }
