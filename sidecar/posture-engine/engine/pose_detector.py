from __future__ import annotations

import base64
from typing import Any

import cv2
import numpy as np

# MediaPipe Pose Landmarker
try:
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode
    HAS_MEDIAPIPE = True
except ImportError:
    HAS_MEDIAPIPE = False

# 레거시 PoseDetection.tsx와 동일한 키 랜드마크 인덱스
KEY_INDICES = [
    0,   # NOSE
    1,   # LEFT_EYE_INNER
    2,   # LEFT_EYE
    3,   # LEFT_EYE_OUTER
    4,   # RIGHT_EYE_INNER
    5,   # RIGHT_EYE
    6,   # RIGHT_EYE_OUTER
    7,   # LEFT_EAR
    8,   # RIGHT_EAR
    9,   # MOUTH_LEFT
    10,  # MOUTH_RIGHT
    11,  # LEFT_SHOULDER
    12,  # RIGHT_SHOULDER
]

MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"
)


class PoseDetector:
    """MediaPipe Pose Landmarker를 사용한 포즈 감지."""

    def __init__(self) -> None:
        self._landmarker: PoseLandmarker | None = None
        self._frame_timestamp_ms: int = 0

    def initialize(self) -> bool:
        """MediaPipe PoseLandmarker를 초기화한다."""
        if not HAS_MEDIAPIPE:
            return False

        try:
            options = PoseLandmarkerOptions(
                base_options=BaseOptions(model_asset_path=MODEL_URL),
                running_mode=RunningMode.VIDEO,
                num_poses=1,
                min_pose_detection_confidence=0.2,
                min_pose_presence_confidence=0.2,
                min_tracking_confidence=0.2,
            )
            self._landmarker = PoseLandmarker.create_from_options(options)
            return True
        except Exception:
            return False

    def detect(self, image_b64: str) -> dict[str, Any] | None:
        """base64 이미지에서 포즈 랜드마크를 추출한다.

        Returns:
            {
                "landmarks": [{x, y, z, visibility}, ...],  # 13개 키 랜드마크
                "world_landmarks": [{x, y, z, visibility}, ...],  # 13개 키 월드 랜드마크
            } or None
        """
        if not self._landmarker:
            return None

        if "," in image_b64:
            _, image_b64 = image_b64.split(",", 1)

        # base64 → numpy image
        try:
            img_bytes = base64.b64decode(image_b64)
            nparr = np.frombuffer(img_bytes, np.uint8)
            bgr_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if bgr_image is None:
                return None
        except Exception:
            return None

        rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)

        self._frame_timestamp_ms += 50  # 50ms 간격 (20fps)
        results = self._landmarker.detect_for_video(mp_image, self._frame_timestamp_ms)

        if not results.pose_landmarks:
            return None

        # 33개 → 13개 키 랜드마크 추출
        all_landmarks = results.pose_landmarks[0]
        key_landmarks = _extract_key(all_landmarks)

        # 월드 랜드마크
        world_landmarks = []
        if results.pose_world_landmarks:
            all_world = results.pose_world_landmarks[0]
            world_landmarks = _extract_key(all_world)
        else:
            # fallback: 2D를 3D로 변환
            world_landmarks = [
                {"x": lm["x"], "y": lm["y"], "z": lm.get("z", 0), "visibility": lm.get("visibility", 0)}
                for lm in key_landmarks
            ]

        return {
            "landmarks": key_landmarks,
            "world_landmarks": world_landmarks,
        }

    def close(self) -> None:
        if self._landmarker:
            self._landmarker.close()
            self._landmarker = None


def _extract_key(landmarks: list) -> list[dict]:
    """33개 MediaPipe 랜드마크에서 13개 키 포인트를 추출한다."""
    result = []
    for idx in KEY_INDICES:
        if idx < len(landmarks):
            lm = landmarks[idx]
            result.append({
                "x": float(lm.x),
                "y": float(lm.y),
                "z": float(lm.z),
                "visibility": max(float(lm.visibility), 0.1),
            })
        else:
            result.append({"x": 0, "y": 0, "z": 0, "visibility": 0})
    return result
