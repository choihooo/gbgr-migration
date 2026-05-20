from __future__ import annotations

import base64
import secrets
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

import cv2


class BackgroundCameraLoop:
    def __init__(self) -> None:
        self.running = False
        self.last_error: str | None = None
        self.stream_url: str | None = None
        self._capture: cv2.VideoCapture | None = None
        self._capture_thread: threading.Thread | None = None
        self._server: ThreadingHTTPServer | None = None
        self._server_thread: threading.Thread | None = None
        self._token = secrets.token_urlsafe(24)
        self._lock = threading.Lock()
        self._latest_jpeg: bytes | None = None

    def start(self) -> None:
        if self.running:
            return

        self._capture = cv2.VideoCapture(0)
        if not self._capture.isOpened():
            self.fail("camera_unavailable")
            return

        self.running = True
        self.last_error = None
        self._start_stream_server()
        self._capture_thread = threading.Thread(
            target=self._capture_frames,
            name="posture-camera-capture",
            daemon=True,
        )
        self._capture_thread.start()

    def stop(self) -> None:
        self.running = False
        if self._capture is not None:
            self._capture.release()
            self._capture = None
        self._stop_stream_server()
        with self._lock:
            self._latest_jpeg = None

    def fail(self, message: str) -> None:
        self.running = False
        self.last_error = message
        if self._capture is not None:
            self._capture.release()
            self._capture = None
        self._stop_stream_server()
        with self._lock:
            self._latest_jpeg = None

    def _capture_frames(self) -> None:
        while self.running and self._capture is not None:
            ok, frame = self._capture.read()
            if not ok or frame is None:
                self.last_error = "camera_frame_unavailable"
                time.sleep(0.05)
                continue

            encoded_ok, buffer = cv2.imencode(
                ".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70]
            )
            if not encoded_ok:
                self.last_error = "camera_frame_encode_failed"
                time.sleep(0.05)
                continue

            with self._lock:
                self._latest_jpeg = buffer.tobytes()
            self.last_error = None
            time.sleep(1 / 30)

    def _start_stream_server(self) -> None:
        if self._server is not None:
            return

        camera_loop = self

        class StreamHandler(BaseHTTPRequestHandler):
            def do_GET(self) -> None:  # noqa: N802
                parsed = urlparse(self.path)
                token = parse_qs(parsed.query).get("token", [""])[0]
                if parsed.path != "/video" or token != camera_loop._token:
                    self.send_response(404)
                    self.end_headers()
                    return

                self.send_response(200)
                self.send_header("Cache-Control", "no-store")
                self.send_header("Connection", "close")
                self.send_header(
                    "Content-Type",
                    "multipart/x-mixed-replace; boundary=frame",
                )
                self.end_headers()

                while camera_loop.running:
                    frame = camera_loop.latest_jpeg()
                    if frame is None:
                        time.sleep(0.05)
                        continue

                    try:
                        self.wfile.write(b"--frame\r\n")
                        self.wfile.write(b"Content-Type: image/jpeg\r\n")
                        self.wfile.write(
                            f"Content-Length: {len(frame)}\r\n\r\n".encode("ascii")
                        )
                        self.wfile.write(frame)
                        self.wfile.write(b"\r\n")
                    except (BrokenPipeError, ConnectionResetError):
                        break

                    time.sleep(1 / 15)

            def log_message(self, format: str, *args: Any) -> None:
                return

        self._server = ThreadingHTTPServer(("127.0.0.1", 0), StreamHandler)
        port = self._server.server_address[1]
        self.stream_url = f"http://127.0.0.1:{port}/video?token={self._token}"
        self._server_thread = threading.Thread(
            target=self._server.serve_forever,
            name="posture-camera-mjpeg",
            daemon=True,
        )
        self._server_thread.start()

    def _stop_stream_server(self) -> None:
        if self._server is None:
            self.stream_url = None
            return

        self._server.shutdown()
        self._server.server_close()
        self._server = None
        self._server_thread = None
        self.stream_url = None

    def latest_jpeg(self) -> bytes | None:
        with self._lock:
            return self._latest_jpeg

    def read_frame_payload(self) -> str | None:
        if not self.running:
            self.last_error = "background_camera_not_running"
            return None

        frame = self.latest_jpeg()
        if frame is None:
            self.last_error = "camera_frame_unavailable"
            return None

        return "data:image/jpeg;base64," + base64.b64encode(frame).decode("ascii")

    def status(self) -> dict[str, Any]:
        return {
            "running": self.running,
            "last_error": self.last_error,
            "stream_url": self.stream_url,
        }
