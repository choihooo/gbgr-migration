from __future__ import annotations

from math import sqrt
from typing import Any

import numpy as np

from .calculations import calculate_pi


def check_step1_error(
    landmarks: list[dict], world_landmarks: list[dict]
) -> str | None:
    """PI_raw > 0.7이면 턱 당기기 안내."""
    pi = calculate_pi(landmarks, world_landmarks)
    if pi is None:
        return None
    if pi["PI_raw"] > 0.7:
        return "귀와 어깨가 일직선이 되도록 턱을 살짝 당겨주세요"
    return None


def check_landmark_visibility(frames: list[dict[str, Any]]) -> str | None:
    """최근 10프레임 중 8개 이상에서 필수 랜드마크 가시성이 낮으면 경고."""
    if len(frames) < 5:
        return None

    recent = frames[-10:]
    required = [7, 8, 11, 12]  # LEFT_EAR, RIGHT_EAR, LEFT_SHOULDER, RIGHT_SHOULDER
    min_visibility = 0.3

    low_count = 0
    for frame in recent:
        lms = frame.get("lms", [])
        has_low = any(
            idx >= len(lms) or lms[idx].get("visibility", 0) < min_visibility
            for idx in required
        )
        if has_low:
            low_count += 1

    if low_count >= 8:
        return "얼굴과 어깨가 모두 보일 수 있게 뒤로 가주세요"
    return None


def check_distance_and_position(frames: list[dict[str, Any]]) -> str | None:
    """어깨 너비가 너무 작거나 화면 중앙에서 벗어나면 경고."""
    if len(frames) < 5:
        return None

    recent = frames[-10:]

    # 평균 어깠 너비 (world 좌표)
    widths = []
    for f in recent:
        wl = f.get("world_lms", [])
        if len(wl) <= 12:
            continue
        ls, rs = wl[11], wl[12]
        w = sqrt((rs["x"] - ls["x"]) ** 2 + (rs["y"] - ls["y"]) ** 2 + (rs["z"] - ls["z"]) ** 2)
        widths.append(w)

    if not widths:
        return None
    avg_w = sum(widths) / len(widths)

    # 평균 어깨 중심 위치 (2D)
    centers = []
    for f in recent:
        lms = f.get("lms", [])
        if len(lms) <= 12:
            continue
        ls, rs = lms[11], lms[12]
        centers.append(((ls["x"] + rs["x"]) / 2, (ls["y"] + rs["y"]) / 2))

    if not centers:
        return None
    avg_cx = sum(c[0] for c in centers) / len(centers)
    avg_cy = sum(c[1] for c in centers) / len(centers)

    distance = sqrt((avg_cx - 0.5) ** 2 + (avg_cy - 0.5) ** 2)

    if avg_w < 0.03 or distance > 0.7:
        return "조금 더 가까이, 화면 중앙으로 와주세요"
    return None


def check_brightness(bgr_image: np.ndarray) -> str | None:
    """평균 밝기가 0.2 미만이면 경고. numpy 이미지를 직접 받는다."""
    if bgr_image is None or bgr_image.size == 0:
        return None
    # BGR → Grayscale luminance
    gray = (
        0.299 * bgr_image[:, :, 2]  # R
        + 0.587 * bgr_image[:, :, 1]  # G
        + 0.114 * bgr_image[:, :, 0]  # B
    )
    avg_brightness = float(np.mean(gray)) / 255.0
    if avg_brightness < 0.2:
        return "주변을 조금 더 밝게 해주세요"
    return None


def check_posture_stability(frames: list[dict[str, Any]]) -> str | None:
    """최근 15프레임의 PI 표준편차 > 0.04 또는 연속 프레임 간 차이 > 0.3이면 경고."""
    if len(frames) < 15:
        return None

    recent = frames[-15:]
    pis = [f["pi"]["PI_raw"] for f in recent if f.get("pi")]

    if len(pis) < 2:
        return None

    mean = sum(pis) / len(pis)
    variance = sum((p - mean) ** 2 for p in pis) / len(pis)
    std = sqrt(variance)

    # 연속 프레임 간 급격한 변화 체크
    for i in range(1, len(pis)):
        if abs(pis[i] - pis[i - 1]) > 0.3:
            return "정확한 측정을 위해, 5초 동안 자세를 그대로 유지해주세요"

    if std > 0.04:
        return "정확한 측정을 위해, 5초 동안 자세를 그대로 유지해주세요"

    return None


def get_step2_error(frames: list[dict[str, Any]]) -> str | None:
    """우선순위 순으로 step2 에러를 반환한다."""
    return (
        check_landmark_visibility(frames)
        or check_distance_and_position(frames)
        or check_posture_stability(frames)
    )
