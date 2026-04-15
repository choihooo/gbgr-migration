from __future__ import annotations


class BackgroundCameraLoop:
    def __init__(self) -> None:
        self.running = False
        self.last_error: str | None = None

    def start(self) -> None:
        self.running = True
        self.last_error = None

    def stop(self) -> None:
        self.running = False

    def fail(self, message: str) -> None:
        self.running = False
        self.last_error = message
