from __future__ import annotations

from typing import Any

import cv2


class BackgroundCameraLoop:
    def __init__(self) -> None:
        self.running = False
        self.last_error: str | None = None
        self._capture: cv2.VideoCapture | None = None

    def start(self) -> None:
        if self.running:
            return

        self._capture = cv2.VideoCapture(0)
        if not self._capture.isOpened():
            self.fail("camera_unavailable")
            return

        self.running = True
        self.last_error = None

    def stop(self) -> None:
        self.running = False
        if self._capture is not None:
            self._capture.release()
            self._capture = None

    def fail(self, message: str) -> None:
        self.running = False
        self.last_error = message
        if self._capture is not None:
            self._capture.release()
            self._capture = None

    def read_frame_payload(self) -> str | None:
        if not self.running or self._capture is None:
            self.last_error = "background_camera_not_running"
            return None

        ok, frame = self._capture.read()
        if not ok or frame is None:
            self.last_error = "camera_frame_unavailable"
            return None

        encoded_ok, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
        if not encoded_ok:
            self.last_error = "camera_frame_encode_failed"
            return None

        import base64

        return "data:image/jpeg;base64," + base64.b64encode(buffer).decode("ascii")

    def status(self) -> dict[str, Any]:
        return {
            "running": self.running,
            "last_error": self.last_error,
        }
