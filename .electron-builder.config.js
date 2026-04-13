// .env 파일 로드
require('dotenv').config()
const fs = require('node:fs')

if (process.env.VITE_APP_VERSION === undefined) {
  try {
    // 기본은 package.json 버전을 사용 (autoUpdater/electron-updater의 semver 비교와 일치)
    // 필요하면 빌드 시점에 VITE_APP_VERSION으로 오버라이드 가능
    // 예) VITE_APP_VERSION=0.9.0 pnpm build:mac
    const pkg = require('./package.json')
    if (typeof pkg?.version === 'string' && pkg.version.trim().length > 0) {
      process.env.VITE_APP_VERSION = pkg.version.trim()
    } else {
      throw new Error('package.json version is missing')
    }
  } catch {
    const now = new Date()
    process.env.VITE_APP_VERSION = `${now.getUTCFullYear() - 2000}.${
      now.getUTCMonth() + 1
    }.${now.getUTCDate()}-${now.getUTCHours() * 60 + now.getUTCMinutes()}`
  }
}

const hasNotarizeCredentials = () => {
  // electron-builder(app-builder-lib) supports 3 auth strategies for notarytool:
  // 1) APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID
  // 2) APPLE_API_KEY + APPLE_API_KEY_ID + APPLE_API_ISSUER
  // 3) APPLE_KEYCHAIN_PROFILE (+ optional APPLE_KEYCHAIN)
  if (
    process.env.APPLE_ID &&
    process.env.APPLE_APP_SPECIFIC_PASSWORD &&
    process.env.APPLE_TEAM_ID
  ) {
    return true
  }

  if (
    process.env.APPLE_API_KEY &&
    process.env.APPLE_API_KEY_ID &&
    process.env.APPLE_API_ISSUER
  ) {
    return true
  }

  if (process.env.APPLE_KEYCHAIN_PROFILE) {
    return true
  }

  return false
}

const resolveNotarizeEnabled = () => {
  // Optional override:
  // - NOTARIZE=true  => force enable
  // - NOTARIZE=false => force disable
  if (process.env.NOTARIZE === 'true') return true
  if (process.env.NOTARIZE === 'false') return false

  return hasNotarizeCredentials()
}

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  appId: 'co.kr.bugi.electron',
  productName: 'bugi',
  directories: {
    output: 'electron-dist',
    buildResources: 'buildResources',
  },
  files: [
    'dist/main/**',
    'dist/preload/**',
    'dist/renderer/**',
    'package.json',
  ],
  /* 알림 이미지 + 런타임 환경변수 파일(존재 시) */
  extraResources: [
    {
      from: 'src/main/assets/Symbol_Logo.png',
      to: 'Symbol_Logo.png',
    },
    ...(fs.existsSync('.secrets/runtime.env')
      ? [
          {
            from: '.secrets/runtime.env',
            to: 'config/runtime.env',
          },
        ]
      : []),
  ],
  asar: true,
  // 빌드 전에 필요한 파일들이 존재하는지 확인
  beforeBuild: async context => {
    const fs = require('node:fs')
    const path = require('node:path')

    const requiredFiles = [
      'dist/main/index.cjs',
      'dist/preload/index.cjs',
      'dist/renderer/index.html',
    ]

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(
          `Required file not found: ${file}. Run 'npm run build' first.`,
        )
      }
    }
  },
  extraMetadata: {
    version: process.env.VITE_APP_VERSION,
    main: 'dist/main/index.cjs',
  },
  // 업데이트 서버 설정
  // GitHub Releases 사용
  // GH_TOKEN 또는 GITHUB_TOKEN 환경변수가 필요합니다
  publish: {
    provider: 'github',
    owner: 'kusitms-bugi', // GitHub 조직명
    repo: 'FE', // 저장소 이름
    // GitHub Releases 업로드가 큰 파일/느린 네트워크에서 60s 기본 타임아웃에 걸릴 수 있어 여유 있게 설정 (ms)
    timeout: 15 * 60 * 1000,
  },
  mac: {
    category: 'public.app-category.productivity',
    target:
      process.env.BUGI_SKIP_DMG === 'true'
        ? [
            {
              target: 'zip',
              arch: ['x64', 'arm64'],
            },
          ]
        : [
            {
              target: 'dmg',
              arch: ['x64', 'arm64'],
            },
            {
              target: 'zip',
              arch: ['x64', 'arm64'],
            },
          ],
    icon: 'buildResources/icon.icns',
    artifactName: '${productName}-${version}-${arch}.${ext}',
    // 코드 서명 설정
    identity: process.env.APPLE_IDENTITY || undefined, // 환경변수로 인증서 지정 가능
    hardenedRuntime: true, // 코드 서명 시 true 권장
    gatekeeperAssess: true, // Gatekeeper 검증 활성화
    entitlements: 'buildResources/entitlements.mac.plist',
    entitlementsInherit: 'buildResources/entitlements.mac.plist',
    extendInfo: {
      NSCameraUsageDescription:
        '거부기린은 사용자의 자세를 실시간으로 분석하기 위해 카메라에 접근합니다.',
      NSMicrophoneUsageDescription:
        '거부기린은 사용자의 자세를 실시간으로 분석하기 위해 마이크에 접근합니다.',
    },
    // 공증(Notarization) 설정
    // 인증정보가 있으면(로컬/CI 무관) 공증을 수행합니다.
    // 강제 제어가 필요하면: NOTARIZE=true|false
    notarize: resolveNotarizeEnabled(),
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32'],
      },
    ],
    icon: 'buildResources/icon.png',
    artifactName: '거부기린.${ext}',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
  // DMG 설정: 루트 레벨에 설정 (mac 객체 안이 아님)
  dmg: {
    title: '${productName}-${version}',
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: 'link', path: '/Applications' },
    ],
  },
  afterPack: async context => {
    const fs = require('node:fs')

    const { electronPlatformName, appOutDir } = context

    if (electronPlatformName !== 'darwin') {
      return
    }

    const {
      productFilename,
      info: {
        _metadata: { electronLanguagesInfoPlistStrings },
      },
    } = context.packager.appInfo

    const resPath = `${appOutDir}/${productFilename}.app/Contents/Resources/`

    console.log(
      '\n> package.json의 "electronLanguagesInfoPlistStrings" 설정을 기반으로 언어 패키지 생성 시작\n',
      '\n>  electronLanguagesInfoPlistStrings:\n',
      electronLanguagesInfoPlistStrings,
      '\n\n',
      '>  ResourcesPath:',
      resPath,
    )

    // APP 언어 패키지 파일 생성
    return await Promise.all(
      Object.keys(electronLanguagesInfoPlistStrings).map(langKey => {
        const infoPlistStrPath = `${langKey}.lproj/InfoPlist.strings`
        let infos = ''

        const langItem = electronLanguagesInfoPlistStrings[langKey]

        Object.keys(langItem).forEach(infoKey => {
          infos += `"${infoKey}" = "${langItem[infoKey]}";\n`
        })

        return new Promise(resolve => {
          // 디렉토리가 없으면 생성
          const dirPath = `${resPath}${langKey}.lproj`
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
          }

          fs.writeFile(`${resPath}${infoPlistStrPath}`, infos, err => {
            if (err) {
              console.error(
                `>  "${resPath}${infoPlistStrPath}" 생성 실패:`,
                err,
              )
              throw err
            }
            console.log(`>  "${resPath}${infoPlistStrPath}" 생성 완료.`)
            resolve()
          })
        })
      }),
    )
  },
}

module.exports = config
