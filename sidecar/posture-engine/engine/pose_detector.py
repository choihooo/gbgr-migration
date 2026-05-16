from __future__ import annotations

import base64
import os
from pathlib import Path
from typing import Any

import cv2
import numpy as np

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

MODEL_FILENAME = "pose_landmarker_full.task"


class PoseDetector:
    """MediaPipe Pose Landmarker를 사용한 포즈 감지."""

    def __init__(self) -> None:
        self._image_type: Any | None = None
        self._image_format: Any | None = None
        self._landmarker: Any | None = None
        self._frame_timestamp_ms: int = 0
        self.last_error: str | None = None

    def initialize(self) -> bool:
        """MediaPipe PoseLandmarker를 초기화한다."""
        self.last_error = None

        model_path = _resolve_model_path()
        if model_path is None:
            self.last_error = f"pose_model_not_found: {MODEL_FILENAME}"
            return False

        try:
            import mediapipe as mp
            from mediapipe.tasks import python
            from mediapipe.tasks.python import vision
        except ImportError as exc:
            self.last_error = f"mediapipe_import_failed: {exc}"
            return False

        try:
            options = vision.PoseLandmarkerOptions(
                base_options=python.BaseOptions(model_asset_path=str(model_path)),
                running_mode=vision.RunningMode.VIDEO,
                num_poses=1,
                min_pose_detection_confidence=0.2,
                min_pose_presence_confidence=0.2,
                min_tracking_confidence=0.2,
            )
            self._landmarker = vision.PoseLandmarker.create_from_options(options)
            self._image_type = mp.Image
            self._image_format = mp.ImageFormat
            return True
        except Exception as exc:
            self.last_error = f"mediapipe_initialization_failed: {exc}"
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
        if self._image_type is None or self._image_format is None:
            return None
        mp_image = self._image_type(
            image_format=self._image_format.SRGB,
            data=rgb_image,
        )

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
            "bgr_image": bgr_image,
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


def _resolve_model_path() -> Path | None:
    env_path = os.environ.get("GBGR_POSE_MODEL_PATH")
    candidates = []
    if env_path:
        candidates.append(Path(env_path))

    current_dir = Path(__file__).resolve().parent
    candidates.extend([
        current_dir / ".." / "models" / MODEL_FILENAME,
        current_dir / ".." / MODEL_FILENAME,
        Path.cwd() / "sidecar" / "posture-engine" / "models" / MODEL_FILENAME,
    ])

    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved.exists():
            return resolved

    return None
