# 거부기린 Tauri 마이그레이션

`migration` 폴더는 기존 Electron 웹뷰 앱을 Tauri + React 기반 네이티브 UI 앱으로 옮기기 위한 작업 공간입니다. Windows 번들 이름은 WiX 호환성을 위해 `GBGR`를 사용하고, 앱 창 제목은 기존처럼 `거부기린`을 유지합니다.

## 빌드 전제 조건

- Node.js 20 이상
- pnpm 9 이상
- Rust stable 툴체인
- Python 3.11
- `sidecar/posture-engine/requirements.txt` 기준 Python 의존성
- Windows에서는 Visual Studio 2022 Build Tools 또는 Visual Studio 2022

## 자주 쓰는 명령

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm run tauri:dev
pnpm run tauri:build
```

macOS의 `pnpm run tauri:build`는 기본 Tauri DMG bundler 대신 wrapper를 통해 `.app` 번들 생성 후 수동 DMG 패키징을 수행한다. 이는 현재 환경에서 `hdiutil create -srcfolder`가 `GBGR.app` 복사 단계에서 `작업이 허용되지 않음`으로 실패하기 때문이다.

### 패키지 매니저 운영 원칙

- 개발용 의존성 설치: `pnpm install`
- 릴리스용 의존성 설치: `pnpm run install:release`
- 로컬과 CI 모두 `pnpm`만 사용한다.

## Windows에서 권장하는 실행 방법

일반 PowerShell에서 바로 `cargo` 또는 `tauri build`를 실행하면 Visual C++ 환경이 잡히지 않아 실패할 수 있습니다.

- 개발 실행: `pnpm run tauri:dev:win`
- 패키징 빌드: `pnpm run tauri:build:win`
- 디버그 패키징 빌드: `pnpm run tauri:build:debug:win`

위 스크립트는 설치된 Visual Studio 2022 경로를 찾아 `VsDevCmd.bat`를 먼저 로드한 뒤 Tauri 명령을 실행합니다.

## 현재 확인된 상태

- 프런트엔드 타입 검사: 통과
- Vite 프로덕션 빌드: 통과
- Windows 디버그 Tauri 빌드: 통과

## 참고

- 최종 번들 식별자는 `co.kr.bugi.desktop`을 사용합니다.
- 처음 프로젝트를 보는 개발자는 [개발 온보딩 문서](./docs/onboarding.md)를 먼저 읽고,
  더 자세한 구조는 [아키텍처 개요](./docs/architecture-overview.md)를 참고합니다.

## GitHub Releases 오토업데이트

`migration` 앱은 Tauri updater를 붙여둔 상태라서, GitHub Releases에 `latest.json`과 서명된 번들을 올리면 맥/윈도우에서 공통으로 업데이트를 받을 수 있습니다.

### 필요한 GitHub Secrets

- `TAURI_UPDATER_PUBLIC_KEY`: `pnpm dlx @tauri-apps/cli signer generate`로 만든 공개키 전체 내용
- `TAURI_SIGNING_PRIVATE_KEY`: 같은 키쌍의 개인키 파일 경로 또는 내용
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: signer 생성 시 비밀번호를 줬다면 그 값

Tauri updater key, Apple Developer ID 인증서, App Store Connect API Key 발급/조회/등록 절차는 [GitHub Actions 배포 Secret 발급 및 조회 가이드](/Users/choiho/coding/gbgr/gbgr-migration/docs/GITHUB_ACTIONS_SECRETS_ISSUANCE.md)를 따른다.

### 릴리스 방법

- 워크플로우 파일: `.github/workflows/tauri-release.yml`
- 권장 태그 형식: `tauri-v0.1.0`
- 실행 조건:
  - `tauri-v*` 태그 push
  - 또는 GitHub Actions 수동 실행

워크플로우는 실행 중에만 `migration/src-tauri/tauri.github-release.conf.json`을 만들어 `createUpdaterArtifacts`와 updater 설정을 켭니다. 그래서 로컬 개발 빌드는 그대로 유지되고, GitHub Actions에서만 `latest.json` 생성 흐름이 활성화됩니다.
또한 로컬과 GitHub Actions 릴리스 빌드는 모두 `pnpm` 기반으로 동작합니다. 릴리즈 워크플로우는 Tauri 빌드 전에 Python 3.11, `PyInstaller`, `sidecar/posture-engine/requirements.txt` 의존성을 먼저 설치합니다.

### 중요한 운영 주의사항

- 현재 저장소는 기존 Electron 릴리스 워크플로우도 함께 가지고 있습니다.
- `https://github.com/<owner>/<repo>/releases/latest/download/latest.json` 방식은 저장소의 "가장 최신 릴리스"를 기준으로 동작합니다.
- Electron 릴리스와 Tauri 릴리스를 같은 저장소에서 병행 발행하면 updater가 엉뚱한 릴리스를 보게 될 수 있습니다.
- 병행 운영이 필요하면 Tauri 전용 저장소를 따로 쓰거나, `latest.json`을 별도 정적 호스팅으로 분리하는 것을 권장합니다.
