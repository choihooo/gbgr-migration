from __future__ import annotations

from math import atan2, degrees, sqrt
from typing import Any, Iterable


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


def trimmed_stats(values: list[float], trim_percent: float = 0.05) -> dict[str, float]:
    """상하 trim_percent 만큼 절사한 평균과 표준편차를 반환한다."""
    if not values:
        return {"mean": 0.0, "std": 0.0}

    sorted_vals = sorted(values)
    trim_count = int(len(sorted_vals) * trim_percent)
    trimmed = sorted_vals[trim_count : len(sorted_vals) - trim_count]

    if not trimmed:
        return {"mean": 0.0, "std": 0.0}

    mean = sum(trimmed) / len(trimmed)
    variance = sum((v - mean) ** 2 for v in trimmed) / len(trimmed)
    return {"mean": mean, "std": sqrt(variance)}


def process_calibration_data(
    frames: list[dict[str, Any]],
    skip_frontal_check: bool = False,
) -> dict[str, Any]:
    """캘리브레이션 프레임들을 처리하여 mu/sigma를 계산한다."""
    n_total = len(frames)
    n_pass = 0
    pi_values: list[float] = []

    for frame in frames:
        frontality = check_frontality(frame.get("lms", []))
        should_include = skip_frontal_check or frontality["pass"]

        if should_include and frame.get("pi") is not None:
            pi_value = frame.get("pi_ema", frame["pi"]["PI_raw"])
            pi_values.append(pi_value)
            n_pass += 1

    if len(pi_values) < 5:
        pass_rate = (n_pass / n_total * 100) if n_total > 0 else 0
        return {
            "success": False,
            "message": (
                f"정면성 통과 프레임이 너무 적습니다.\n"
                f"통과: {n_pass}/{n_total} ({pass_rate:.1f}%)\n\n"
                "💡 팁:\n- 정면을 바라보세요\n- 고개를 살짝 움직여보세요"
            ),
        }

    stats = trimmed_stats(pi_values, 0.05)
    pass_rate = n_pass / n_total

    quality = "poor"
    if pass_rate >= 0.5 and stats["std"] < 0.2:
        quality = "good"
    elif pass_rate >= 0.3 and stats["std"] < 0.3:
        quality = "medium"

    return {
        "success": True,
        "nTotal": n_total,
        "nPass": n_pass,
        "mu_PI": stats["mean"],
        "sigma_PI": stats["std"],
        "quality": quality,
        "passRate": pass_rate,
    }
