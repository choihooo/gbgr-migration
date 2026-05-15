# GitHub Actions 배포 Secret 발급 및 조회 가이드

작성일: 2026-05-15  
대상 저장소: `/Users/choiho/coding/gbgr/gbgr-migration`  
대상 워크플로우: `/Users/choiho/coding/gbgr/gbgr-migration/.github/workflows/tauri-release.yml`

## 1. 핵심 결론

현재 `choihooo/gbgr-migration` repository secrets는 비어 있는 상태로 확인됐다.

```bash
env -u GITHUB_TOKEN gh secret list --repo choihooo/gbgr-migration --json name,updatedAt,visibility
```

확인 결과:

```json
[]
```

GitHub Actions secret은 값 원문을 다시 조회할 수 없다. 이름과 갱신 시각만 확인 가능하다. 값을 잃어버렸다면 다시 발급하거나 로컬에 남아 있는 원본 파일에서 재등록해야 한다.

## 2. 현재 필요한 Secret 목록

### 2.1 현재 `tauri-release.yml`이 직접 요구하는 Secret

아래 3개는 현재 워크플로우에서 이미 참조한다.

| Secret 이름 | 용도 | 없으면 막히는 위치 |
| --- | --- | --- |
| `TAURI_UPDATER_PUBLIC_KEY` | Tauri updater 공개키 | `Validate updater secrets`, updater config 생성 |
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri updater 산출물 서명용 개인키 | `Validate updater secrets`, `tauri-action` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 개인키 비밀번호 | `tauri-action` |

### 2.2 macOS 배포까지 필요한 Apple Secret

아래 값들은 macOS Developer ID 서명과 notarization에 필요하다. 단, 현재 `tauri-release.yml`에는 아직 연결되어 있지 않다. GitHub에 등록만 해서는 부족하고, 워크플로우에서 env로 넘기는 작업이 필요하다.

| 권장 Secret 이름 | 용도 |
| --- | --- |
| `APPLE_CERTIFICATE` | Developer ID Application `.p12` 인증서를 base64로 인코딩한 값 |
| `APPLE_CERTIFICATE_PASSWORD` | `.p12` export 비밀번호 |
| `APPLE_SIGNING_IDENTITY` | codesign identity 문자열 |
| `APPLE_API_KEY` | App Store Connect API Key ID |
| `APPLE_API_ISSUER` | App Store Connect Issuer ID |
| `APPLE_API_KEY_P8` | `AuthKey_<KEY_ID>.p8` 파일 내용 전체 |

### 2.3 기존 Electron 워크플로우 Secret 이름과 매핑

기존 Electron 워크플로우는 아래 이름을 쓴다.

| Electron secret | Tauri 권장 secret | 비고 |
| --- | --- | --- |
| `BUILD_CERTIFICATE_BASE64` | `APPLE_CERTIFICATE` | 같은 `.p12` base64 값이면 재사용 가능 |
| `P12_PASSWORD` | `APPLE_CERTIFICATE_PASSWORD` | 같은 `.p12` 비밀번호면 재사용 가능 |
| `APPLE_IDENTITY` | `APPLE_SIGNING_IDENTITY` | 예: `Developer ID Application: ...` |
| `APPLE_ID` | 대안 방식에서 `APPLE_ID` | API Key 방식이면 필수 아님 |
| `APPLE_APP_SPECIFIC_PASSWORD` | 대안 방식에서 `APPLE_PASSWORD` | API Key 방식이면 필수 아님 |
| `APPLE_TEAM_ID` | 대안 방식에서 `APPLE_TEAM_ID` | API Key 방식에서는 보통 `APPLE_API_ISSUER` 사용 |
| `KEYCHAIN_PASSWORD` | Tauri 직접 필수 아님 | 인증서를 keychain에 직접 import하는 방식에서 사용 |

Tauri에서는 App Store Connect API Key 방식이 CI 자동화에 더 적합하다. Apple ID 앱 전용 비밀번호 방식은 계정 정책, 2FA, 조직 설정에 더 민감하다.

## 3. GitHub Secret 등록 여부 확인 방법

### 3.1 GitHub CLI 인증 상태 확인

로컬 환경에 깨진 `GITHUB_TOKEN` 환경변수가 있으면 `gh`가 키체인 로그인 대신 그 값을 먼저 사용해서 실패할 수 있다. 이 저장소에서는 아래처럼 `GITHUB_TOKEN`을 제거하고 확인하는 편이 안전하다.

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration
env -u GITHUB_TOKEN gh auth status
```

정상 예시:

```text
github.com
  ✓ Logged in to github.com account choihooo (keyring)
```

### 3.2 Secret 이름 목록 조회

```bash
env -u GITHUB_TOKEN gh secret list --repo choihooo/gbgr-migration
```

JSON으로 확인:

```bash
env -u GITHUB_TOKEN gh secret list \
  --repo choihooo/gbgr-migration \
  --json name,updatedAt,visibility
```

중요:

- GitHub secret 값 자체는 조회할 수 없다.
- 목록에 이름이 있어도 값이 올바른지는 알 수 없다.
- 값 검증은 workflow 실행 또는 별도 validation step으로만 가능하다.

## 4. Tauri Updater 키 발급 방법

### 4.1 새 키쌍 생성

`migration` 디렉터리에서 실행한다.

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration
pnpm dlx @tauri-apps/cli signer generate
```

명령 실행 중 비밀번호 입력을 요구할 수 있다. 비밀번호를 설정했다면 그 값이 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`다.

명령 결과로 보통 아래 성격의 값이 나온다.

- public key: updater가 서명을 검증할 때 쓰는 공개키
- private key: release artifact 서명에 쓰는 개인키

### 4.2 각 값을 Secret에 매핑

| 생성 결과 | GitHub Secret |
| --- | --- |
| Public key 전체 문자열 | `TAURI_UPDATER_PUBLIC_KEY` |
| Private key 전체 문자열 또는 private key 파일 내용 | `TAURI_SIGNING_PRIVATE_KEY` |
| 생성 시 입력한 비밀번호 | `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` |

주의:

- 공개키와 개인키는 한 쌍이다. 서로 다른 시점에 만든 값을 섞으면 updater 검증이 실패한다.
- 이미 배포된 앱의 `pubkey`가 바뀌면 기존 설치본이 새 업데이트 서명을 검증하지 못할 수 있다.
- 개인키를 잃어버렸다면 업데이트 체인을 유지하기 어렵다. 새 키로 교체할 경우 기존 사용자 업데이트 전략을 별도로 세워야 한다.

### 4.3 로컬에 기존 키가 있는지 찾기

키 원문을 어디에 저장했는지 모르면 아래처럼 후보를 찾는다. 개인키가 터미널에 출력될 수 있으니 결과를 외부에 공유하지 않는다.

```bash
find "$HOME" \
  -type f \
  \( -iname '*tauri*key*' -o -iname '*signing*key*' -o -iname '*.key' \) \
  -not -path '*/Library/Caches/*' \
  -not -path '*/node_modules/*' \
  2>/dev/null
```

저장소 안에서 참조 흔적만 찾기:

```bash
rg -n "TAURI_UPDATER_PUBLIC_KEY|TAURI_SIGNING_PRIVATE_KEY|pubkey|private key|signer" \
  /Users/choiho/coding/gbgr/gbgr-migration \
  -g '!**/node_modules/**' \
  -g '!**/target/**'
```

## 5. Apple Developer ID 인증서 발급 방법

### 5.1 전제 조건

필요한 계정 권한:

- Apple Developer Program에 가입된 계정
- Certificates, Identifiers & Profiles 접근 권한
- Developer ID Application 인증서를 만들 수 있는 권한

필요한 로컬 도구:

- macOS Keychain Access
- Xcode Command Line Tools
- `security`, `codesign`, `openssl`

### 5.2 CSR 생성

Keychain Access에서 생성하는 방법:

1. macOS에서 `키체인 접근` 앱을 연다.
2. 메뉴에서 `키체인 접근` > `인증서 지원` > `인증 기관에서 인증서 요청...`을 선택한다.
3. 사용자 이메일 주소와 이름을 입력한다.
4. `디스크에 저장됨`을 선택한다.
5. `CertificateSigningRequest.certSigningRequest` 파일을 저장한다.

CLI로 생성하는 방법:

```bash
openssl req \
  -new \
  -newkey rsa:2048 \
  -nodes \
  -keyout /tmp/gbgr-developer-id.key \
  -out /tmp/gbgr-developer-id.csr \
  -subj "/emailAddress=<APPLE_ID_EMAIL>, CN=<이름>, C=KR"
```

일반적으로 Keychain Access 방식이 더 단순하다.

### 5.3 Developer ID Application 인증서 생성

Apple Developer 웹 콘솔에서 진행한다.

1. `developer.apple.com/account`에 로그인한다.
2. `Certificates, Identifiers & Profiles`로 이동한다.
3. `Certificates`에서 새 인증서를 만든다.
4. 인증서 타입으로 `Developer ID Application`을 선택한다.
5. CSR 파일을 업로드한다.
6. 생성된 `.cer` 파일을 다운로드한다.
7. `.cer` 파일을 더블클릭해서 Keychain에 설치한다.

설치 후 identity 확인:

```bash
security find-identity -v -p codesigning
```

예시:

```text
1) XXXXX "Developer ID Application: 회사명 (TEAMID1234)"
```

따옴표 안의 전체 문자열이 `APPLE_SIGNING_IDENTITY` 값이다.

```text
Developer ID Application: 회사명 (TEAMID1234)
```

### 5.4 `.p12`로 export

Keychain Access에서 export하는 방법:

1. `키체인 접근`에서 `로그인` 키체인을 선택한다.
2. `내 인증서` 카테고리를 선택한다.
3. `Developer ID Application: ...` 인증서를 찾는다.
4. 인증서 왼쪽 화살표를 펼쳐 private key가 같이 있는지 확인한다.
5. 인증서와 private key가 함께 선택된 상태로 export한다.
6. 파일 형식은 `.p12`를 선택한다.
7. export 비밀번호를 설정한다.

이 export 비밀번호가 `APPLE_CERTIFICATE_PASSWORD`다.

주의:

- private key 없이 `.cer`만 있으면 CI 서명이 불가능하다.
- 반드시 private key가 포함된 `.p12`를 export해야 한다.

### 5.5 `.p12`를 base64로 변환

```bash
openssl base64 -A \
  -in /절대경로/DeveloperIDApplication.p12 \
  -out /tmp/gbgr-apple-certificate-base64.txt
```

값 확인:

```bash
cat /tmp/gbgr-apple-certificate-base64.txt
```

출력된 한 줄 전체가 `APPLE_CERTIFICATE`다.

기존 Electron 워크플로우 이름을 유지한다면 같은 값을 `BUILD_CERTIFICATE_BASE64`에도 넣을 수 있다.

## 6. App Store Connect API Key 발급 방법

### 6.1 언제 필요한가

Notarization을 CI에서 자동으로 처리하려면 App Store Connect API Key 방식이 가장 안정적이다.

필요한 값:

- Key ID
- Issuer ID
- `.p8` private key 파일

### 6.2 API Key 생성

App Store Connect에서 진행한다.

1. `appstoreconnect.apple.com`에 로그인한다.
2. `Users and Access`로 이동한다.
3. `Integrations` 또는 `Keys` 영역에서 App Store Connect API 키를 만든다.
4. 키 이름은 예를 들어 `GBGR Tauri Notarization`처럼 용도를 알 수 있게 쓴다.
5. 접근 권한은 notarization에 필요한 수준으로 설정한다. 보통 `Developer` 또는 `App Manager` 권한을 쓴다.
6. 생성 후 `Key ID`를 기록한다.
7. `Issuer ID`를 기록한다.
8. `AuthKey_<KEY_ID>.p8` 파일을 다운로드한다.

중요:

- `.p8` 파일은 생성 직후 한 번만 다운로드할 수 있다.
- 잃어버리면 같은 키의 `.p8`를 다시 받을 수 없다.
- 잃어버렸다면 기존 키를 revoke하고 새 키를 만들어야 한다.

### 6.3 각 값을 Secret에 매핑

| App Store Connect 값 | GitHub Secret |
| --- | --- |
| Key ID | `APPLE_API_KEY` |
| Issuer ID | `APPLE_API_ISSUER` |
| `AuthKey_<KEY_ID>.p8` 파일 내용 전체 | `APPLE_API_KEY_P8` |

`.p8` 파일 내용 등록 시에는 파일 전체를 넣는다.

```bash
cat /절대경로/AuthKey_<KEY_ID>.p8
```

형태 예시:

```text
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

## 7. Apple ID 앱 전용 비밀번호 방식

현재 문서에서는 API Key 방식을 권장한다. 그래도 Apple ID 방식이 필요하면 아래 값을 준비한다.

| 값 | Secret |
| --- | --- |
| Apple ID 이메일 | `APPLE_ID` |
| 앱 전용 비밀번호 | `APPLE_PASSWORD` 또는 기존 Electron 기준 `APPLE_APP_SPECIFIC_PASSWORD` |
| Apple Team ID | `APPLE_TEAM_ID` |

앱 전용 비밀번호는 Apple Account 관리 화면의 보안 섹션에서 생성한다.

주의:

- 일반 Apple ID 로그인 비밀번호를 넣으면 안 된다.
- 2FA가 켜진 계정은 앱 전용 비밀번호를 사용해야 한다.
- 조직 정책에 따라 앱 전용 비밀번호 사용이 제한될 수 있다.

## 8. GitHub에 Secret 등록하는 방법

### 8.1 GitHub 웹 UI

1. GitHub에서 `choihooo/gbgr-migration` 저장소를 연다.
2. `Settings`로 이동한다.
3. `Secrets and variables` > `Actions`로 이동한다.
4. `Repository secrets`에서 `New repository secret`을 누른다.
5. `Name`에 secret 이름을 넣는다.
6. `Secret`에 값을 넣는다.
7. 저장한다.

값을 채팅, 이슈, PR 코멘트에 붙이지 않는다.

### 8.2 GitHub CLI

단일 값 등록:

```bash
env -u GITHUB_TOKEN gh secret set TAURI_UPDATER_PUBLIC_KEY \
  --repo choihooo/gbgr-migration
```

파일 내용을 secret으로 등록:

```bash
env -u GITHUB_TOKEN gh secret set APPLE_CERTIFICATE \
  --repo choihooo/gbgr-migration \
  < /tmp/gbgr-apple-certificate-base64.txt
```

`.p8` 파일 내용을 secret으로 등록:

```bash
env -u GITHUB_TOKEN gh secret set APPLE_API_KEY_P8 \
  --repo choihooo/gbgr-migration \
  < /절대경로/AuthKey_<KEY_ID>.p8
```

등록 후 이름만 확인:

```bash
env -u GITHUB_TOKEN gh secret list --repo choihooo/gbgr-migration
```

## 9. 등록 후 최소 검증

### 9.1 Secret 이름 체크

아래 이름이 모두 나와야 한다.

```bash
env -u GITHUB_TOKEN gh secret list --repo choihooo/gbgr-migration
```

현재 Tauri workflow 최소값:

```text
TAURI_UPDATER_PUBLIC_KEY
TAURI_SIGNING_PRIVATE_KEY
TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

macOS 서명/노타라이즈까지 연결할 값:

```text
APPLE_CERTIFICATE
APPLE_CERTIFICATE_PASSWORD
APPLE_SIGNING_IDENTITY
APPLE_API_KEY
APPLE_API_ISSUER
APPLE_API_KEY_P8
```

### 9.2 로컬 서명 identity 검증

```bash
security find-identity -v -p codesigning
```

`APPLE_SIGNING_IDENTITY`와 동일한 `Developer ID Application: ...` 문자열이 보여야 한다.

### 9.3 인증서 base64 복원 검증

secret에 넣기 전 로컬에서 base64가 정상인지 확인한다.

```bash
base64 --decode /tmp/gbgr-apple-certificate-base64.txt > /tmp/gbgr-check.p12
file /tmp/gbgr-check.p12
```

`data` 또는 PKCS12 계열 파일로 인식되면 정상이다. 복원된 `/tmp/gbgr-check.p12`는 확인 후 삭제한다.

```bash
rm -f /tmp/gbgr-check.p12
```

### 9.4 `.p8` 파일 형식 검증

```bash
head -1 /절대경로/AuthKey_<KEY_ID>.p8
tail -1 /절대경로/AuthKey_<KEY_ID>.p8
```

각각 아래처럼 보여야 한다.

```text
-----BEGIN PRIVATE KEY-----
-----END PRIVATE KEY-----
```

## 10. 지금 저장소에서 추가로 해야 할 일

현재 `/Users/choiho/coding/gbgr/gbgr-migration/.github/workflows/tauri-release.yml`은 Tauri updater secret 3개만 연결되어 있다.

macOS 배포까지 완성하려면 아래 작업이 필요하다.

1. GitHub repository secrets에 필요한 값을 등록한다.
2. `tauri-release.yml`에 Apple 인증서 import 또는 Tauri macOS signing env 전달 단계를 추가한다.
3. `APPLE_API_KEY_P8`를 CI runner의 파일로 복원한다.
4. `APPLE_API_KEY_PATH`가 복원된 파일 경로를 가리키게 한다.
5. macOS matrix job에서만 Apple signing/notarization env를 넘긴다.
6. 릴리즈 후 `codesign`, `spctl`, `stapler` 검증을 workflow 또는 수동 검증으로 남긴다.

## 11. 실패 시 판단 기준

### 11.1 `TAURI_UPDATER_PUBLIC_KEY secret 이 필요합니다.`

`TAURI_UPDATER_PUBLIC_KEY`가 GitHub repository secret에 없거나 빈 값이다.

### 11.2 `TAURI_SIGNING_PRIVATE_KEY secret 이 필요합니다.`

`TAURI_SIGNING_PRIVATE_KEY`가 GitHub repository secret에 없거나 빈 값이다.

### 11.3 `code has no resources but signature indicates they must be present`

앱 번들은 생성됐지만 배포용 서명 상태가 아니다. 현재 로컬에서 확인된 상태가 여기에 해당한다.

확인 명령:

```bash
codesign --verify --deep --strict --verbose=2 \
  /Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri/target/release/bundle/macos/GBGR.app
```

### 11.4 `The specified item could not be found in the keychain`

CI runner에 인증서가 import되지 않았거나 `APPLE_SIGNING_IDENTITY` 문자열이 실제 identity와 다르다.

### 11.5 `Invalid credentials`

App Store Connect API Key 값이 틀렸거나 `.p8` 파일 복원이 잘못됐다.

확인할 값:

- `APPLE_API_KEY`
- `APPLE_API_ISSUER`
- `APPLE_API_KEY_P8`
- `APPLE_API_KEY_PATH`

## 12. 보관 원칙

- `TAURI_SIGNING_PRIVATE_KEY`, `.p12`, `.p8`는 절대 저장소에 커밋하지 않는다.
- secret 원문은 채팅, 이슈, PR, 로그에 남기지 않는다.
- `/tmp`에 만든 인증서 복원 파일은 검증 후 삭제한다.
- 개인키를 재발급하면 기존 배포/업데이트 체인에 영향이 있는지 먼저 확인한다.
- secret 이름만 공유하고 값은 GitHub Secrets UI 또는 `gh secret set`으로 직접 등록한다.

