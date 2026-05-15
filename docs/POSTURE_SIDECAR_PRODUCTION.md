# 자세 엔진 sidecar 프로덕션 배포 결정

작성일: 2026-04-25  
대상: `migration/` Tauri 앱의 Python 자세 엔진 sidecar

## 결론

프로덕션 배포 방식은 **플랫폼별 자세 엔진 실행 파일 패키징**으로 확정한다.

- macOS: `posture-engine`
- Windows: `posture-engine.exe`
- Linux 배포 시: `posture-engine`

실행 파일은 PyInstaller 또는 Nuitka로 `sidecar/posture-engine/main.py`와 MediaPipe, OpenCV, NumPy 의존성을 함께 패키징해 만든다. Rust는 배포용 실행 파일을 우선 실행하고, 실행 파일이 없을 때만 개발 편의를 위해 Python 스크립트 실행으로 fallback한다.

## 기존 방식의 리스크

기존 `migration/src-tauri/src/posture_engine/sidecar.rs`는 다음 방식으로 동작했다.

- `sidecar/posture-engine/main.py`를 찾는다.
- 시스템의 `python3` 또는 `python` 실행 파일을 찾는다.
- `python main.py` 형태로 sidecar를 실행한다.

이 방식은 개발 환경에서는 단순하지만 프로덕션 배포에는 부적합하다.

- 사용자 PC에 Python이 없으면 실행할 수 없다.
- Python이 있어도 MediaPipe, OpenCV, NumPy가 설치되어 있지 않으면 추론 초기화가 실패한다.
- 사용자 Python 버전과 패키지 ABI 차이에 따라 같은 앱 산출물이 다르게 동작할 수 있다.
- macOS DMG로 설치한 앱에서 스크립트 리소스 위치가 바뀌면 Rust의 탐색 경로와 어긋날 수 있다.

## Rust 실행 책임

`SidecarHandle::spawn()`의 책임은 다음 순서로 고정한다.

1. `GBGR_POSTURE_ENGINE_BIN` 환경 변수가 있으면 해당 실행 파일을 사용한다.
2. 번들 리소스 또는 실행 파일 주변에서 플랫폼별 sidecar 실행 파일을 찾는다.
   - `sidecar/posture-engine`
   - `sidecar/posture-engine-bin/posture-engine`
   - `sidecar/posture-engine/posture-engine`
3. 실행 파일이 없으면 개발 모드 fallback으로 `main.py`를 찾는다.
4. `main.py` fallback에서는 시스템 `python3` 또는 `python`을 사용한다.

프로덕션 품질 게이트에서는 3, 4번 fallback에 의존하면 안 된다.

## Tauri 리소스 경로

`bundle.resources`는 map 방식으로 유지한다.

```json
{
  "../../sidecar/posture-engine": "sidecar/posture-engine"
}
```

list 방식으로 `../../sidecar/posture-engine`를 넣으면 macOS 번들 내부에서 `Contents/Resources/_up_/_up_/sidecar/posture-engine`처럼 상대 경로가 보존된다. map 방식은 `Contents/Resources/sidecar/posture-engine`으로 고정되므로 Rust 탐색 경로와 일치한다.

## 개발 모드와 배포 모드

개발 모드:

- 저장소 루트의 `sidecar/posture-engine/main.py`를 사용한다.
- `python3` 또는 `python`이 필요하다.
- `sidecar/posture-engine/requirements.txt`의 의존성을 개발 머신에 설치해야 한다.
- 임시 검증은 `GBGR_POSTURE_ENGINE_PATH=/absolute/path/main.py`로 스크립트 경로를 강제할 수 있다.

배포 모드:

- 앱 번들 내부의 플랫폼별 실행 파일을 사용한다.
- 사용자 PC의 Python 설치 여부에 의존하지 않는다.
- 임시 검증은 `GBGR_POSTURE_ENGINE_BIN=/absolute/path/posture-engine`로 실행 파일 경로를 강제할 수 있다.

## 실행 파일 산출

현재 저장소에는 macOS/Windows/Linux에서 같은 방식으로 실행할 수 있는 산출 스크립트를 둔다.

```bash
cd migration
pnpm run build:posture-sidecar
```

스크립트 동작:

- 기본적으로 macOS/Linux는 `python3.11`, `python3` 순서로 PyInstaller 실행 Python을 찾는다.
- Windows는 `python`을 사용한다.
- 특정 Python을 강제하려면 `PYTHON=/absolute/path/python3.11 pnpm run build:posture-sidecar`로 실행한다.
- 산출물은 `sidecar/posture-engine/posture-engine` 또는 `sidecar/posture-engine/posture-engine.exe`에 생성한다.
- 산출 직후 `start` JSON smoke 요청을 실행해 실제 초기화와 stdin/stdout 계약을 함께 확인한다.
- 스크립트는 빌드 전에 `main.py`, `models/`, `PyInstaller`, `mediapipe` 설치 여부를 먼저 검증하고, 누락 시 명확한 메시지로 실패한다.

생성된 실행 파일과 PyInstaller 작업 디렉터리는 로컬 산출물이므로 git에 커밋하지 않는다. Tauri 빌드는 `sidecar/posture-engine` 디렉터리를 리소스로 복사하므로, 릴리즈 패키징 전에 이 스크립트를 실행하면 앱 번들에 실행 파일이 함께 포함된다.

## 오류 메시지와 복구 경로

sidecar 실행 실패 시 사용자에게는 기술 경로 대신 다음 수준의 메시지를 보여준다.

- 메시지: `자세 측정 엔진을 시작할 수 없어요. 앱을 다시 실행해 주세요. 문제가 반복되면 앱을 다시 설치해 주세요.`
- 개발 로그: 누락된 실행 파일 후보, 누락된 Python, spawn 실패 원인을 포함한다.

복구 경로는 다음 순서로 안내한다.

1. 앱 재시작
2. 카메라 권한 확인
3. 앱 재설치
4. 개발 빌드라면 Python 3.11 및 `requirements.txt` 의존성 설치 확인

## 검증 결과

- macOS arm64 실행 파일 산출 확인: `sidecar/posture-engine/posture-engine`
- 산출 파일 크기: 83MB
- 실행 파일 형식: Mach-O 64-bit executable arm64
- 로컬 실행 파일 `start` JSON smoke 응답 확인
- macOS 앱 번들 내부 실행 파일 경로 확인: `Contents/Resources/sidecar/posture-engine/posture-engine`
- macOS 앱 번들 내부 실행 파일 `start` JSON smoke 응답 확인
- DMG 마운트 후 `GBGR.app/Contents/Resources/sidecar/posture-engine/posture-engine` 경로 확인
- DMG 내부 실행 파일 `start` JSON smoke 응답 확인
- 현재 로컬 머신에는 `python3.11`이 없어 `/usr/bin/python3` Python 3.9.6으로 산출했다. 프로덕션 CI에서는 Python 3.11 런타임을 명시해야 한다.
