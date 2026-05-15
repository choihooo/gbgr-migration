import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const migrationDir = resolve(scriptDir, '..')
const tauriDir = join(migrationDir, 'src-tauri')
const tauriConfig = JSON.parse(readFileSync(join(tauriDir, 'tauri.conf.json'), 'utf8'))

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: options.stdio ?? 'inherit',
    ...options,
  })

  if (result.status !== 0) {
    throw new Error(`${command} 명령이 실패했습니다.`)
  }

  return result
}

function findBundleRoot({ target, debug }) {
  const profileDir = debug ? 'debug' : 'release'
  const candidate = target
    ? join(tauriDir, 'target', target, profileDir, 'bundle')
    : join(tauriDir, 'target', profileDir, 'bundle')

  return existsSync(candidate)
    ? candidate
    : join(tauriDir, 'target', profileDir, 'bundle')
}

function detectAppPath(bundleRoot, productName) {
  const appPath = join(bundleRoot, 'macos', `${productName}.app`)
  if (!existsSync(appPath)) {
    throw new Error(`앱 번들을 찾을 수 없습니다: ${appPath}`)
  }
  return appPath
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true })
}

function createStagingDir(appPath) {
  const stageDir = mkdtempSync('/tmp/gbgr-dmg-stage-')
  const appName = appPath.split('/').at(-1)
  const destination = join(stageDir, appName)

  if (!appName) {
    throw new Error('앱 번들 이름을 확인할 수 없습니다.')
  }

  run('rsync', ['-a', `${appPath}/`, `${destination}/`])

  return stageDir
}

function getArchSuffix(target) {
  if (target?.includes('aarch64') || process.arch === 'arm64') return 'aarch64'
  if (target?.includes('x86_64') || process.arch === 'x64') return 'x64'
  return process.arch
}

function getImageSizeMb(appPath) {
  const result = run('du', ['-sk', appPath], { stdio: 'pipe' })
  const sizeKb = Number.parseInt(result.stdout.split(/\s+/)[0] ?? '0', 10)

  if (!Number.isFinite(sizeKb) || sizeKb <= 0) {
    return 512
  }

  return Math.max(512, Math.ceil((sizeKb / 1024) * 1.35) + 64)
}

export function buildMacosDmg(options = {}) {
  if (process.platform !== 'darwin') {
    throw new Error('macOS에서만 DMG를 생성할 수 있습니다.')
  }

  const productName = tauriConfig.productName
  const version = tauriConfig.version
  const bundleRoot = findBundleRoot(options)
  const appPath = detectAppPath(bundleRoot, productName)
  const stageDir = createStagingDir(appPath)
  const dmgDir = join(bundleRoot, 'dmg')
  const archSuffix = getArchSuffix(options.target)
  const dmgName = `${productName}_${version}_${archSuffix}.dmg`
  const dmgPath = join(dmgDir, dmgName)
  const tempDmgPath = join(dmgDir, `rw.${process.pid}.${dmgName}`)
  const mountPoint = `/Volumes/${productName}-${process.pid}`
  const imageSizeMb = getImageSizeMb(appPath)

  ensureDir(dmgDir)

  try {
    rmSync(dmgPath, { force: true })
    rmSync(tempDmgPath, { force: true })
    rmSync(mountPoint, { recursive: true, force: true })

    run('hdiutil', [
      'create',
      '-size',
      `${imageSizeMb}m`,
      '-fs',
      'HFS+',
      '-volname',
      productName,
      tempDmgPath,
    ])

    run('hdiutil', ['attach', tempDmgPath, '-mountpoint', mountPoint, '-nobrowse'])
    run('cp', ['-R', join(stageDir, `${productName}.app`), mountPoint])

    try {
      run('ln', ['-s', '/Applications', join(mountPoint, 'Applications')])
    } catch {
      // Finder 편의용 링크 생성 실패는 패키징 실패로 보지 않는다.
    }

    run('hdiutil', ['detach', mountPoint])

    run('hdiutil', [
      'convert',
      tempDmgPath,
      '-format',
      'UDZO',
      '-imagekey',
      'zlib-level=9',
      '-o',
      dmgPath,
    ])
  } finally {
    if (existsSync(mountPoint)) {
      try {
        run('hdiutil', ['detach', mountPoint])
      } catch {
        // 이미 분리되었거나 attach 이전에 실패한 경우는 무시한다.
      }
    }
    rmSync(stageDir, { recursive: true, force: true })
    rmSync(mountPoint, { recursive: true, force: true })
    rmSync(tempDmgPath, { force: true })
  }

  console.log(`수동 DMG 생성 완료: ${dmgPath}`)
}

function parseCliOptions(args) {
  const targetIndex = args.indexOf('--target')
  return {
    debug: args.includes('--debug'),
    target: targetIndex >= 0 ? args[targetIndex + 1] : undefined,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildMacosDmg(parseCliOptions(process.argv.slice(2)))
}
