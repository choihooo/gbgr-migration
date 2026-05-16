# Tauri 배포 운영 정리

작성일: 2026-05-16  
대상 워크플로우: `/Users/choiho/coding/gbgr/gbgr-migration/.github/workflows/tauri-release.yml`  
대상 앱: `/Users/choiho/coding/gbgr/gbgr-migration/migration`

## 1. 배포 기준

현재 공식 배포 기준은 `tauri-v0.1.1`부터다. `tauri-v0.1.0`은 초기 검증 과정에서 여러 번 덮어쓴 버전이므로, 실제 사용자에게 안내할 기준 릴리즈로 쓰지 않는다.

릴리즈 태그는 반드시 앱 버전과 일치해야 한다.

| 앱 버전 | Git tag |
| --- | --- |
| `0.1.1` | `tauri-v0.1.1` |
| `0.1.2` | `tauri-v0.1.2` |

워크플로우의 `Validate release tag` 단계가 이 불일치를 막는다.

## 2. 다음 배포 절차

다음 패치 버전을 예로 들면 아래 순서로 진행한다.

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration
pnpm release:tauri 0.1.2
```

위 명령은 아래 파일의 버전을 함께 변경한다.

- `/Users/choiho/coding/gbgr/gbgr-migration/migration/package.json`
- `/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/tauri.conf.json`
- `/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/Cargo.toml`
- `/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/Cargo.lock`

기본 검증으로 아래 명령도 같이 실행한다.

- `cargo test`
- `pnpm run lint:check`
- `pnpm run typecheck`

검증 후 커밋과 태그를 직접 만들려면 아래처럼 실행한다.

```bash
pnpm release:tauri 0.1.2 --commit --tag
git push origin master
git push origin tauri-v0.1.2
```

빠르게 파일만 변경하고 검증은 별도로 하려면 아래처럼 실행한다.

```bash
pnpm release:tauri 0.1.2 --no-verify
```

## 3. 필요한 GitHub Actions secrets

Tauri 릴리즈 워크플로우가 직접 요구하는 secret은 아래가 기준이다.

### 3.1 Tauri updater

- `TAURI_UPDATER_PUBLIC_KEY`
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

### 3.2 macOS 서명/노타라이즈

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_API_KEY`
- `APPLE_API_ISSUER`
- `APPLE_API_KEY_P8`

`KEYCHAIN_PASSWORD`는 더 이상 Tauri 릴리즈 워크플로우에 필요하지 않다. CI 실행 중 임시 keychain 비밀번호를 생성해서 사용한다.

## 4. 수동 실행 옵션

태그 push 배포는 항상 전체 플랫폼을 빌드한다.

GitHub Actions UI에서 `workflow_dispatch`로 수동 실행할 때는 `include_intel_macos` 옵션을 사용할 수 있다.

- `true`: macOS Intel, macOS Apple Silicon, Windows를 모두 빌드한다.
- `false`: macOS Intel을 제외하고 macOS Apple Silicon, Windows만 빌드한다.

정식 태그 릴리즈에서는 Intel 산출물을 유지하는 것이 현재 기본 정책이다. 수동 실행에서만 Intel을 제외할 수 있게 둔 이유는 빠른 검증 비용을 낮추기 위해서다.

## 5. 릴리즈 성공 확인

배포가 끝나면 아래를 확인한다.

```bash
env -u GITHUB_TOKEN gh run list --workflow "Tauri Release" --limit 5
env -u GITHUB_TOKEN gh release view tauri-v0.1.2 --json url,tagName,name,assets,publishedAt,targetCommitish
```

`latest.json`이 새 버전을 가리키는지도 확인한다.

```bash
tmp="$(mktemp -d)"
env -u GITHUB_TOKEN gh release download tauri-v0.1.2 -p latest.json -D "$tmp"
cat "$tmp/latest.json"
rm -rf "$tmp"
```

확인할 값:

- `"version"`이 새 버전인지
- `darwin-aarch64`, `darwin-x86_64`, `windows-x86_64` 플랫폼 URL이 존재하는지
- 각 플랫폼 signature가 존재하는지

## 6. 아직 별도 결정이 필요한 항목

Windows Authenticode 코드 서명은 아직 적용하지 않았다. 현재 적용된 것은 Tauri updater 산출물 서명이며, Windows SmartScreen 신뢰도와는 별개다.

Windows 외부 배포 비중이 커지면 아래 중 하나를 선택한다.

- 일반 코드서명 인증서 도입
- EV 코드서명 인증서 도입
- Azure Trusted Signing 또는 SignPath 같은 원격 서명 서비스 도입

macOS Intel은 현재 유지한다. 가장 느린 플랫폼이지만 구형 Mac 지원을 끊을 근거가 아직 부족하다. 내부 검증 속도가 필요할 때만 수동 실행에서 제외한다.
