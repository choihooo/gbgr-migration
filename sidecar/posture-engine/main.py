from __future__ import annotations

import json
import sys
import time
import uuid
from dataclasses import asdict
from typing import Any

from engine.background_camera import BackgroundCameraLoop
from engine.calculations import calculate_pi, check_frontality, process_calibration_data
from engine.error_checks import check_brightness, check_step1_error, get_step2_error
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
        # 캘리브레이션 상태
        self._calib_buffer: list[dict[str, Any]] = []
        self._calib_active: bool = False

    def handle(self, payload: dict[str, Any]) -> dict[str, Any]:
        command = payload.get("command")

        if command == "start":
            return self._handle_start()

        if command == "frame":
            return self._handle_frame(payload)

        if command == "calibrate_start":
            return self._handle_calibrate_start()

        if command == "calibrate_frame":
            return self._handle_calibrate_frame(payload)

        if command == "calibrate_camera_frame":
            return self._handle_calibrate_camera_frame(payload)

        if command == "calibrate_finish":
            return self._handle_calibrate_finish()

        if command == "set_calibration":
            return self._handle_set_calibration(payload)

        if command == "start_background":
            return self._handle_start_background()

        if command == "background_tick":
            return self._handle_background_tick(payload)

        if command == "stop_background":
            return self._handle_stop_background()

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
            return self._handle_stop()

        return {"error": "unknown_command"}

    # ── 기존 명령 ──────────────────────────────────────────

    def _handle_start(self) -> dict[str, Any]:
        self._classifier.reset()
        self._background_loop.start()
        if not self._background_loop.running:
            self._state.engine_status = "error"
            self._state.message = self._background_loop.last_error
            self._state.recoverable = True
            self._state.updated_at = str(int(time.time()))
            return asdict(self._state)

        if not self._detector_initialized:
            self._detector_initialized = self._detector.initialize()
        if not self._detector_initialized:
            self._background_loop.stop()
            self._state.engine_status = "error"
            self._state.message = self._detector.last_error or "detector_initialization_failed"
            self._state.recoverable = True
            self._state.updated_at = str(int(time.time()))
            return asdict(self._state)
        self._state.engine_status = "ready"
        self._state.mode = "foreground"
        self._state.camera_owner = "python"
        self._state.updated_at = str(int(time.time()))
        self._state.message = None
        self._state.recoverable = True
        self._state.stream_url = self._background_loop.stream_url
        return asdict(self._state)

    def _handle_frame(self, payload: dict[str, Any]) -> dict[str, Any]:
        """프레임 이미지를 받아 MediaPipe 포즈 분석 결과를 반환."""
        session_id = payload.get("session_id", "")
        timestamp = str(int(time.time()))

        if not self._detector_initialized:
            self._detector_initialized = self._detector.initialize()
        if not self._detector_initialized:
            return {"error": self._detector.last_error or "detector_initialization_failed"}

        detection = self._detector.detect(payload.get("image_payload", ""))

        if detection is None:
            return asdict(
                ResultMessage(
                    result_id=str(uuid.uuid4()),
                    session_id=session_id,
                    timestamp=timestamp,
                    posture_class=0,
                    score=0.0,
                    pi=None,
                    landmarks=[],
                    source="react_frame",
                    engine_mode=self._state.mode,
                    events=[],
                )
            )

        landmarks = detection["landmarks"]
        world_landmarks = detection["world_landmarks"]

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
                    source="react_frame",
                    engine_mode=self._state.mode,
                    events=[],
                )
            )

        # 캘리브레이션 mu/sigma는 classifier 내부에 저장됨
        classification = self._classifier.classify(pi_data["PI_raw"])

        return asdict(
            ResultMessage(
                result_id=str(uuid.uuid4()),
                session_id=session_id,
                timestamp=timestamp,
                posture_class=classification.cls,
                score=classification.Score,
                pi=pi_data["PI_raw"],
                landmarks=landmarks,
                source="react_frame",
                engine_mode=self._state.mode,
                events=classification.events,
            )
        )

    def _handle_start_background(self) -> dict[str, Any]:
        if not self._detector_initialized:
            self._detector_initialized = self._detector.initialize()
        if not self._detector_initialized:
            self._state.engine_status = "error"
            self._state.message = self._detector.last_error or "detector_initialization_failed"
            self._state.recoverable = True
            self._state.updated_at = str(int(time.time()))
            return asdict(self._state)

        self._state.engine_status = "switching"
        self._state.mode = "background"
        self._state.camera_owner = "python"
        self._state.updated_at = str(int(time.time()))
        self._state.message = None
        self._state.recoverable = True
        self._state.stream_url = self._background_loop.stream_url
        return asdict(self._state)

    def _handle_background_tick(self, payload: dict[str, Any]) -> dict[str, Any]:
        image_payload = self._background_loop.read_frame_payload()
        if image_payload is None:
            return {"error": self._background_loop.last_error or "camera_frame_unavailable"}

        frame_payload = {
            "session_id": payload.get("session_id", ""),
            "image_payload": image_payload,
        }
        result = self._handle_frame(frame_payload)
        if "error" not in result:
            result["source"] = "python_camera"
            result["engine_mode"] = self._state.mode
        return result

    def _handle_stop_background(self) -> dict[str, Any]:
        self._state.engine_status = "ready"
        self._state.mode = "foreground"
        self._state.camera_owner = "python"
        self._state.updated_at = str(int(time.time()))
        self._state.stream_url = self._background_loop.stream_url
        return asdict(self._state)

    def _handle_stop(self) -> dict[str, Any]:
        self._background_loop.stop()
        self._classifier.reset()
        self._detector.close()
        self._detector_initialized = False
        self._state.engine_status = "idle"
        self._state.camera_owner = "none"
        self._state.updated_at = str(int(time.time()))
        self._state.message = None
        self._state.recoverable = True
        self._state.stream_url = None
        return asdict(self._state)

    # ── 캘리브레이션 명령 ─────────────────────────────────

    def _handle_calibrate_start(self) -> dict[str, Any]:
        """캘리브레이션 모드 시작: 버퍼 초기화."""
        self._calib_buffer = []
        self._calib_active = True

        # MediaPipe 초기화 (필요 시)
        if not self._detector_initialized:
            self._detector_initialized = self._detector.initialize()
        if not self._detector_initialized:
            return {
                "status": "error",
                "message": self._detector.last_error or "detector_initialization_failed",
            }

        # EMA도 리셋
        self._classifier.reset()

        return {"status": "calibrating"}

    def _handle_calibrate_frame(self, payload: dict[str, Any]) -> dict[str, Any]:
        """캘리브레이션 프레임 처리: PI + 정면성 + EMA + 오류 검증."""
        image_payload = payload.get("image_payload", "")

        # 포즈 감지
        detection = self._detector.detect(image_payload)

        if detection is None:
            return {
                "status": "no_detection",
                "frame_count": len(self._calib_buffer),
                "step1_error": None,
                "step2_error": None,
            }

        landmarks = detection["landmarks"]
        world_landmarks = detection["world_landmarks"]
        bgr_image = detection.get("bgr_image")

        # PI 계산
        pi_data = calculate_pi(landmarks, world_landmarks)

        if pi_data is None:
            return {
                "status": "no_pi",
                "frame_count": len(self._calib_buffer),
                "step1_error": None,
                "step2_error": None,
            }

        # EMA 적용
        pi_ema = self._classifier.next_pi_ema(pi_data["PI_raw"])

        # 정면성 체크
        frontality = check_frontality(landmarks)

        # 프레임 밝기
        brightness = None
        if bgr_image is not None:
            try:
                import numpy as np

                gray = (
                    0.299 * bgr_image[:, :, 2]
                    + 0.587 * bgr_image[:, :, 1]
                    + 0.114 * bgr_image[:, :, 0]
                )
                brightness = float(np.mean(gray)) / 255.0
            except Exception:
                pass

        # 버퍼에 프레임 추가
        frame_data = {
            "lms": landmarks,
            "pi": pi_data,
            "world_lms": world_landmarks,
            "pi_ema": pi_ema,
            "brightness": brightness,
            "frontality_pass": frontality["pass"],
        }
        self._calib_buffer.append(frame_data)

        # 오류 검증
        step1_error = check_step1_error(landmarks, world_landmarks)
        step2_error = get_step2_error(self._calib_buffer)

        # 밝기 체크 (별도, bgr_image 직접 사용)
        brightness_error = None
        if bgr_image is not None:
            brightness_error = check_brightness(bgr_image)
        if step2_error is None and brightness_error is not None:
            step2_error = brightness_error

        return {
            "status": "collecting",
            "frame_count": len(self._calib_buffer),
            "step1_error": step1_error,
            "step2_error": step2_error,
        }

    def _handle_calibrate_camera_frame(self, payload: dict[str, Any]) -> dict[str, Any]:
        image_payload = self._background_loop.read_frame_payload()
        if image_payload is None:
            return {
                "status": "no_detection",
                "frame_count": len(self._calib_buffer),
                "step1_error": None,
                "step2_error": None,
            }

        return self._handle_calibrate_frame(
            {
                "session_id": payload.get("session_id", ""),
                "image_payload": image_payload,
            }
        )

    def _handle_calibrate_finish(self) -> dict[str, Any]:
        """캘리브레이션 완료: mu/sigma 계산."""
        self._calib_active = False

        # 완료 계산에서는 정면성 필터를 건너뛴다.
        # 실시간 step1/step2 오류로 자세 품질을 안내하고, 최종 mu/sigma는 수집된 PI로 계산한다.
        result = process_calibration_data(self._calib_buffer, skip_frontal_check=True)

        if result.get("success"):
            self._classifier.set_calibration(result["mu_PI"], result["sigma_PI"])

        return {
            "status": "completed",
            **result,
        }

    def _handle_set_calibration(self, payload: dict[str, Any]) -> dict[str, Any]:
        """외부에서 mu/sigma 설정 (앱 재시작 시 복원용)."""
        mu = payload.get("mu", 0.0)
        sigma = payload.get("sigma", 1.0)
        self._classifier.set_calibration(mu, sigma)
        return {"status": "calibration_set", **self._classifier.calibration}


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
