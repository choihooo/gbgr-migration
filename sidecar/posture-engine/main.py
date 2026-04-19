from __future__ import annotations

import json
import sys
import time
import uuid
from dataclasses import asdict
from typing import Any

from engine.background_camera import BackgroundCameraLoop
from engine.calculations import calculate_pi
from engine.posture_classifier import PostureClassifier
from engine.pose_detector import PoseDetector
from models.result import EngineStateMessage, ResultMessage


class PostureEngineService:
    def __init__(self) -> None:
        self._background_loop = BackgroundCameraLoop()
        self._classifier = PostureClassifier()
        self._detector = PoseDetector()
        self._detector_initialized = False
        self._state = EngineStateMessage(
            engine_status="idle",
            mode="foreground",
            camera_owner="none",
            updated_at="0",
            message=None,
            recoverable=True,
        )

    def handle(self, payload: dict[str, Any]) -> dict[str, Any]:
        command = payload.get("command")

        if command == "start":
            self._classifier.reset()
            # MediaPipe 초기화 (최초 1회)
            if not self._detector_initialized:
                self._detector_initialized = self._detector.initialize()
            self._state.engine_status = "ready"
            self._state.mode = "foreground"
            self._state.camera_owner = "react"
            self._state.updated_at = str(int(time.time()))
            return asdict(self._state)

        if command == "frame":
            return self._handle_frame(payload)

        if command == "start_background":
            self._background_loop.start()
            self._state.engine_status = "switching"
            self._state.mode = "background"
            self._state.camera_owner = "python"
            self._state.updated_at = str(int(time.time()))
            return asdict(self._state)

        if command == "stop_background":
            self._background_loop.stop()
            self._state.engine_status = "ready"
            self._state.mode = "foreground"
            self._state.camera_owner = "react"
            self._state.updated_at = str(int(time.time()))
            return asdict(self._state)

        if command == "latest_result":
            return asdict(
                ResultMessage(
                    result_id="",
                    session_id=payload.get("session_id", ""),
                    timestamp="0",
                    posture_class=0,
                    score=0.0,
                    pi=None,
                    landmarks=[],
                    source="python_camera",
                    engine_mode=self._state.mode,
                    events=[],
                )
            )

        if command == "stop":
            self._background_loop.stop()
            self._classifier.reset()
            self._detector.close()
            self._detector_initialized = False
            self._state.engine_status = "idle"
            self._state.camera_owner = "none"
            self._state.updated_at = str(int(time.time()))
            return asdict(self._state)

        return {"error": "unknown_command"}

    def _handle_frame(self, payload: dict[str, Any]) -> dict[str, Any]:
        """프레임 이미지를 받아 MediaPipe 포즈 분석 결과를 반환."""
        session_id = payload.get("session_id", "")
        timestamp = str(int(time.time()))

        # MediaPipe 포즈 감지
        detection = self._detector.detect(payload.get("image_payload", ""))

        if detection is None:
            # 감지 실패 시 측정 중 결과
            return asdict(
                ResultMessage(
                    result_id=str(uuid.uuid4()),
                    session_id=session_id,
                    timestamp=timestamp,
                    posture_class=0,
                    score=0.0,
                    pi=None,
                    landmarks=[],
                    source="python_engine",
                    engine_mode=self._state.mode,
                    events=[],
                )
            )

        landmarks = detection["landmarks"]
        world_landmarks = detection["world_landmarks"]

        # PI 계산
        pi_data = calculate_pi(landmarks, world_landmarks)

        if pi_data is None:
            return asdict(
                ResultMessage(
                    result_id=str(uuid.uuid4()),
                    session_id=session_id,
                    timestamp=timestamp,
                    posture_class=0,
                    score=0.0,
                    pi=None,
                    landmarks=landmarks,
                    source="python_engine",
                    engine_mode=self._state.mode,
                    events=[],
                )
            )

        # 자세 분류 (mu=0, sigma=1 — 기본값, TODO: 캘리브레이션 연동)
        classification = self._classifier.classify(pi_data["PI_raw"], mu=0, sigma=1)

        return asdict(
            ResultMessage(
                result_id=str(uuid.uuid4()),
                session_id=session_id,
                timestamp=timestamp,
                posture_class=classification.cls,
                score=classification.Score,
                pi=pi_data["PI_raw"],
                landmarks=landmarks,
                source="python_engine",
                engine_mode=self._state.mode,
                events=classification.events,
            )
        )


def main() -> int:
    service = PostureEngineService()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            print(json.dumps({"error": "invalid_json"}), flush=True)
            continue

        print(json.dumps(service.handle(payload)), flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
