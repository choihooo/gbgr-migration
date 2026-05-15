# macOS 서명/노타라이즈 실행 문서

작성일: 2026-05-10  
대상: `/Users/choiho/coding/gbgr/gbgr-migration/migration` Tauri 앱  
목적: Apple 인증서와 App Store Connect API 키를 이미 가지고 있다는 전제로, 이 저장소에서 macOS 서명/노타라이즈를 실제로 수행하는 방법을 한 번에 정리한다.

Apple 인증서, App Store Connect API Key, Tauri updater key를 새로 발급받거나 기존 값을 찾는 절차는 [GitHub Actions 배포 Secret 발급 및 조회 가이드](/Users/choiho/coding/gbgr/gbgr-migration/docs/GITHUB_ACTIONS_SECRETS_ISSUANCE.md)를 먼저 따른다.

## 1. 이 문서가 전제하는 상태

이미 아래 항목이 준비되어 있다고 가정한다.

- Apple Developer Program 가입 완료
- `Developer ID Application` 인증서 보유
- 인증서를 `.p12`로 export 가능
- `.p12` 비밀번호를 알고 있음
- App Store Connect API Key 보유
- `Issuer ID`
- `Key ID`
- `AuthKey_<KEY_ID>.p8` 파일

이 문서는 "무엇을 새로 발급받는가"보다 "이 저장소에서 어디에 넣고 어떻게 실행하는가"에 집중한다.

## 2. 현재 저장소 기준 핵심 사실

- 로컬 Tauri 진입점은 `/Users/choiho/coding/gbgr/gbgr-migration/migration/package.json`의 `pnpm run tauri`다.
- macOS `pnpm run tauri:build`는 기본 Tauri `dmg` bundler 대신 wrapper를 사용한다.
- 실제 실행 스크립트:
  - `/Users/choiho/coding/gbgr/gbgr-migration/migration/scripts/tauri-wrapper.mjs`
  - `/Users/choiho/coding/gbgr/gbgr-migration/migration/scripts/build-macos-dmg.mjs`
- 즉, 현재 저장소에서는 `.app` 서명/노타라이즈는 Tauri가 담당하고, `.dmg` 생성은 wrapper가 담당한다.

## 3. 최종 목표

최종적으로 아래 산출물이 모두 준비되면 된다.

- 서명된 `GBGR.app`
- 노타라이즈되고 staple 된 `GBGR.app`
- 서명 검증이 끝난 `GBGR_0.1.0_*.dmg`
- GitHub Release 업로드용 updater 산출물

현재 로컬 빌드 산출물 기본 경로:

- 앱 번들: `/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/target/release/bundle/macos/GBGR.app`
- DMG: `/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/target/release/bundle/dmg/GBGR_0.1.0_aarch64.dmg`

## 4. 필요한 환경 변수

Tauri 2가 macOS 서명/노타라이즈에 사용하는 핵심 환경 변수는 아래와 같다.

### 4.1 코드 서명

- `APPLE_CERTIFICATE`
  - `.p12` 파일 내용을 base64로 인코딩한 값
- `APPLE_CERTIFICATE_PASSWORD`
  - `.p12` export 비밀번호
- `APPLE_SIGNING_IDENTITY`
  - 예: `Developer ID Application: <이름> (<TEAM_ID>)`

### 4.2 노타라이즈

아래 두 방식 중 하나를 쓴다.

#### 권장: App Store Connect API Key 방식

- `APPLE_API_KEY`
  - App Store Connect Key ID
- `APPLE_API_ISSUER`
  - Issuer ID
- `APPLE_API_KEY_PATH`
  - `AuthKey_<KEY_ID>.p8` 파일 절대경로

#### 대안: Apple ID 방식

- `APPLE_ID`
- `APPLE_PASSWORD`
  - 앱 전용 비밀번호
- `APPLE_TEAM_ID`

이 저장소에서는 자동화 용도로 `APPLE_API_KEY` 방식이 더 단순하다.

### 4.3 updater 릴리즈

현재 GitHub Actions 릴리즈 워크플로우는 아래 updater secret도 같이 요구한다.

- `TAURI_UPDATER_PUBLIC_KEY`
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

이 셋은 macOS notarization과는 별개지만, 현재 릴리즈 워크플로우가 같이 검사하므로 함께 준비해야 한다.

## 5. 값 준비 방법

### 5.1 `APPLE_CERTIFICATE` 만들기

`.p12` 파일이 이미 있다면 아래처럼 base64로 만든다.

```bash
openssl base64 -A -in /절대경로/DeveloperIDApplication.p12 -out /tmp/apple-cert-base64.txt
cat /tmp/apple-cert-base64.txt
```

출력된 한 줄 문자열 전체를 `APPLE_CERTIFICATE` 값으로 쓴다.

### 5.2 `APPLE_SIGNING_IDENTITY` 확인

인증서를 Keychain에 설치한 뒤 아래 명령으로 identity를 확인한다.

```bash
security find-identity -v -p codesigning
```

출력 예시는 아래와 비슷하다.

```text
Developer ID Application: Your Name (TEAMID1234)
```

이 문자열을 `APPLE_SIGNING_IDENTITY` 값으로 쓴다.

### 5.3 `APPLE_API_KEY_PATH` 준비

`.p8` 파일은 로컬에서는 예를 들어 아래 경로처럼 둔다.

```text
/Users/choiho/.private_keys/AuthKey_XXXXXXXXXX.p8
```

로컬 실행에서는 그냥 절대경로를 쓰면 된다.

CI에서는 secret 문자열을 파일로 복원한 뒤 그 경로를 `APPLE_API_KEY_PATH`로 넘긴다.

## 6. 로컬에서 한 번 수동으로 해보는 순서

이미 자격이 있는 상태라면, 로컬 검증은 아래 순서가 가장 빠르다.

### 6.1 shell 환경 변수 export

```bash
export APPLE_CERTIFICATE="<base64로 인코딩된 p12 한 줄>"
export APPLE_CERTIFICATE_PASSWORD="<p12 비밀번호>"
export APPLE_SIGNING_IDENTITY="Developer ID Application: <이름> (<TEAM_ID>)"

export APPLE_API_KEY="<KEY_ID>"
export APPLE_API_ISSUER="<ISSUER_ID>"
export APPLE_API_KEY_PATH="/Users/choiho/.private_keys/AuthKey_<KEY_ID>.p8"
```

### 6.2 빌드 실행

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration
pnpm install --frozen-lockfile
pnpm run tauri:build
```

이 명령은 현재 저장소 기준으로 아래를 순서대로 수행한다.

1. posture sidecar 빌드
2. 프런트엔드 production build
3. Rust/Tauri release build
4. `GBGR.app` 번들 생성
5. wrapper를 통한 수동 DMG 생성

### 6.3 산출물 확인

```bash
ls -lh /Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/target/release/bundle/macos/GBGR.app
ls -lh /Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/target/release/bundle/dmg/
```

## 7. 로컬 검증 명령

빌드가 끝나면 최소한 아래 명령을 확인한다.

### 7.1 코드 서명 검증

```bash
codesign --verify --deep --strict --verbose=2 /Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/target/release/bundle/macos/GBGR.app
```

### 7.2 Gatekeeper 평가

```bash
spctl --assess --type execute --verbose /Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/target/release/bundle/macos/GBGR.app
```

### 7.3 staple 검증

```bash
xcrun stapler validate /Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/target/release/bundle/macos/GBGR.app
xcrun stapler validate /Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/target/release/bundle/dmg/GBGR_0.1.0_aarch64.dmg
```

### 7.4 노타라이즈 로그 확인이 필요할 때

Tauri가 내부적으로 notarization을 처리하더라도, 문제 시에는 `notarytool`로 직접 상태를 확인하는 편이 빠르다.

```bash
xcrun notarytool history \
  --key /Users/choiho/.private_keys/AuthKey_<KEY_ID>.p8 \
  --key-id "<KEY_ID>" \
  --issuer "<ISSUER_ID>"
```

## 8. GitHub Actions에 넣어야 하는 secret

현재 릴리즈 워크플로우는 `/Users/choiho/coding/gbgr/gbgr-migration/.github/workflows/tauri-release.yml` 이다.

이 워크플로우가 정상 동작하려면 GitHub repository secrets에 아래 값을 넣는다.

### 8.1 이미 쓰고 있는 secret

- `TAURI_UPDATER_PUBLIC_KEY`
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

### 8.2 추가해야 하는 macOS 서명/노타라이즈 secret

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_API_KEY`
- `APPLE_API_ISSUER`
- `APPLE_API_KEY_P8`
  - `.p8` 파일 내용 전체를 secret 문자열로 저장

중요:

- GitHub Secrets에는 파일 경로를 직접 넣을 수 없다.
- 따라서 `.p8`는 문자열 secret로 저장한 뒤, workflow 안에서 파일로 복원해야 한다.

## 9. GitHub Actions에서 실제로 연결하는 방법

현재 워크플로우는 updater secret만 `env:`로 넘기고 있다.  
즉, Apple 관련 secret을 GitHub에 넣기만 해서는 부족하고, workflow가 그 값을 받도록 연결해야 한다.

### 9.1 workflow에 추가해야 하는 흐름

개념적으로는 아래 두 단계를 넣으면 된다.

1. `APPLE_API_KEY_P8` secret을 파일로 복원
2. `tauri-action` step에 Apple env를 전달

예시:

```yaml
      - name: Restore App Store Connect API key
        if: startsWith(matrix.platform, 'macos')
        shell: bash
        run: |
          set -euo pipefail
          mkdir -p "$HOME/.private_keys"
          printf '%s' "${APPLE_API_KEY_P8}" > "$HOME/.private_keys/AuthKey_${APPLE_API_KEY}.p8"
          chmod 600 "$HOME/.private_keys/AuthKey_${APPLE_API_KEY}.p8"
        env:
          APPLE_API_KEY: ${{ secrets.APPLE_API_KEY }}
          APPLE_API_KEY_P8: ${{ secrets.APPLE_API_KEY_P8 }}
```

그리고 `Build and publish Tauri release` step의 `env:`에 아래를 추가한다.

```yaml
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_API_KEY: ${{ secrets.APPLE_API_KEY }}
          APPLE_API_ISSUER: ${{ secrets.APPLE_API_ISSUER }}
          APPLE_API_KEY_PATH: /Users/runner/.private_keys/AuthKey_${{ secrets.APPLE_API_KEY }}.p8
```

주의:

- 위 경로는 GitHub macOS runner 기준 예시다.
- 실제 복원 경로와 `APPLE_API_KEY_PATH` 값은 반드시 맞아야 한다.

## 10. 실제 릴리즈 순서

이 저장소 기준으로 실무 순서는 아래가 가장 안전하다.

1. 버전 정합성 확인
   - `/Users/choiho/coding/gbgr/gbgr-migration/migration/package.json`
   - `/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/tauri.conf.json`
   - `/Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/Cargo.toml`
2. 로컬 품질 게이트 실행
   - `pnpm run lint:check`
   - `pnpm run typecheck`
   - `pnpm run test`
   - `pnpm run build`
   - `pnpm run tauri:build`
3. 로컬 서명/노타라이즈 검증
   - `codesign --verify`
   - `spctl --assess`
   - `xcrun stapler validate`
4. 새 사용자 환경 smoke 검증
   - DMG mount
   - `/Applications` 복사
   - 첫 실행
   - 로그인/온보딩/보정/메인/위젯/종료
5. Git 태그 push
   - 형식: `tauri-v<version>`
6. GitHub Actions 릴리즈 실행
7. GitHub Release 산출물 확인
   - DMG
   - updater metadata
   - signature 관련 파일

## 11. 설치본 smoke 검증 체크리스트

서명/노타라이즈가 끝나도, 아래는 꼭 실제 설치본으로 확인한다.

- DMG mount 후 `GBGR.app`가 정상 표시된다.
- `/Applications`로 복사 가능하다.
- 첫 실행 시 Gatekeeper 경고가 비정상적으로 뜨지 않는다.
- 카메라 권한 허용/거부 플로우가 정상이다.
- 로그인 후 인증/온보딩/보정이 정상이다.
- 메인 화면에서 자세 엔진이 정상 시작된다.
- 위젯 열기/닫기가 정상이다.
- 종료 후 잔여 프로세스가 없다.

잔여 프로세스 확인:

```bash
ps aux | rg 'gbgr-app|posture-engine'
```

sidecar 경로 확인:

```bash
ls /Applications/GBGR.app/Contents/Resources/sidecar/posture-engine/
```

## 12. 자주 막히는 지점

### 12.1 secret은 넣었는데 notarization이 안 되는 경우

이 저장소에서는 GitHub secret 등록만으로 끝나지 않는다.  
반드시 workflow에서 Apple env를 `tauri-action` step으로 넘겨야 한다.

### 12.2 `.p8` 파일 경로 문제

`APPLE_API_KEY_PATH`는 실제 파일 경로여야 한다.  
CI에서는 secret 문자열을 파일로 복원하지 않으면 동작하지 않는다.

### 12.3 DMG 생성 방식 차이

현재 저장소는 기본 Tauri `bundle_dmg.sh`를 그대로 쓰지 않는다.  
`/Users/choiho/coding/gbgr/gbgr-migration/migration/scripts/tauri-wrapper.mjs`가 `GBGR.app` 생성 후 수동 DMG 생성을 수행한다.

### 12.4 ad-hoc 서명과 notarization 혼동

Apple Silicon 테스트용 ad-hoc 서명과, 실제 배포용 Developer ID 서명/노타라이즈는 다르다.  
실제 사용자 배포는 `Developer ID Application` + notarization 기준으로 봐야 한다.

## 13. 이 문서와 같이 봐야 하는 파일

- [Tauri 프로덕션 릴리즈 절차](/Users/choiho/coding/gbgr/gbgr-migration/docs/TAURI_PRODUCTION_RELEASE.md)
- [GitHub Actions 배포 Secret 발급 및 조회 가이드](/Users/choiho/coding/gbgr/gbgr-migration/docs/GITHUB_ACTIONS_SECRETS_ISSUANCE.md)
- [프로덕션 핸드오프 TODO](/Users/choiho/coding/gbgr/gbgr-migration/docs/PRODUCTION_HANDOFF_TODO.md)
- [migration README](/Users/choiho/coding/gbgr/gbgr-migration/migration/README.md)
- [tauri-release.yml](/Users/choiho/coding/gbgr/gbgr-migration/.github/workflows/tauri-release.yml)

## 14. 참고 자료

- [Tauri macOS signing](https://v2.tauri.app/distribute/sign/macos/)
- [Tauri 환경 변수 문서](https://tauri.app/ja/reference/environment-variables/)
- [Apple notarization 개요](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)
