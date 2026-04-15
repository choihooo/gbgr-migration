from __future__ import annotations

import json
import sys
from dataclasses import asdict
from typing import Any

from engine.background_camera import BackgroundCameraLoop
from models.result import EngineStateMessage, ResultMessage


class PostureEngineService:
    def __init__(self) -> None:
        self._background_loop = BackgroundCameraLoop()
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
            self._state.engine_status = "ready"
            self._state.mode = "foreground"
            self._state.camera_owner = "react"
            return asdict(self._state)

        if command == "start_background":
            self._background_loop.start()
            self._state.engine_status = "switching"
            self._state.mode = "background"
            self._state.camera_owner = "python"
            return asdict(self._state)

        if command == "stop_background":
            self._background_loop.stop()
            self._state.engine_status = "ready"
            self._state.mode = "foreground"
            self._state.camera_owner = "react"
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
            self._state.engine_status = "idle"
            self._state.camera_owner = "none"
            return asdict(self._state)

        return {"error": "unknown_command"}


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
