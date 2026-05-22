import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const migrationDir = resolve(scriptDir, '..')
const repoRoot = resolve(migrationDir, '..')
const sidecarDir = join(repoRoot, 'sidecar', 'posture-engine')
const entryScriptPath = join(sidecarDir, 'main.py')
const modelsDir = join(sidecarDir, 'models')
const macosSidecarEntitlementsPath = join(
  migrationDir,
  'src-tauri',
  'SidecarEntitlements.plist',
)
const outputName =
  process.platform === 'win32' ? 'posture-engine.exe' : 'posture-engine'
const shouldBuildMacosOnefile =
  process.platform === 'darwin' &&
  process.env.GBGR_MACOS_SIDECAR_ONEFILE === '1'
const outputPath = join(sidecarDir, 'posture-engine')
const outputExecutablePath = shouldBuildMacosOnefile
  ? outputPath
  : join(outputPath, outputName)
const buildDir = join(sidecarDir, '.pyinstaller-build')
const specDir = join(sidecarDir, '.pyinstaller-spec')
const dataSeparator = process.platform === 'win32' ? ';' : ':'
const python =
  process.env.PYTHON ?? resolveSetupPythonCommand() ?? resolvePythonCommand()

function fail(message, detail) {
  if (detail) {
    console.error(detail)
  }
  console.error(message)
  process.exit(1)
}

function ensurePathExists(path, description) {
  if (!existsSync(path)) {
    fail(`${description} 경로를 찾을 수 없습니다: ${path}`)
  }
}

function resolvePythonCommand() {
  const candidates =
    process.platform === 'win32'
      ? ['python']
      : ['python', 'python3.11', 'python3']

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], {
      stdio: 'ignore',
    })
    if (result.status === 0) {
      return candidate
    }
  }

  return candidates.at(-1)
}

function resolveSetupPythonCommand() {
  const pythonLocation = process.env.pythonLocation
  if (!pythonLocation) {
    return null
  }

  const candidates =
    process.platform === 'win32'
      ? [join(pythonLocation, 'python.exe')]
      : [
          join(pythonLocation, 'bin', 'python3'),
          join(pythonLocation, 'bin', 'python'),
        ]

  return candidates.find(candidate => existsSync(candidate)) ?? null
}

function ensurePythonAvailable() {
  const result = spawnSync(python, ['--version'], {
    encoding: 'utf8',
  })

  if (result.status === 0) {
    return
  }

  fail(
    [
      `Python 실행 파일을 찾을 수 없습니다: ${python}`,
      '환경 변수 `PYTHON`으로 사용할 Python 3.11 경로를 지정하거나,',
      'Python 3.11과 sidecar 의존성을 먼저 설치해주세요.',
    ].join('\n'),
    result.stderr?.trim(),
  )
}

function ensurePythonPackage(moduleName, installHint) {
  const result = spawnSync(
    python,
    ['-c', `import ${moduleName.replaceAll('-', '_')}`],
    {
      encoding: 'utf8',
    },
  )

  if (result.status === 0) {
    return
  }

  fail(
    [
      `Python 패키지 \`${moduleName}\`를 불러오지 못했습니다.`,
      installHint,
    ].join('\n'),
    result.stderr?.trim(),
  )
}

function resolveMediaPipeBinaryPath() {
  const libName =
    process.platform === 'win32'
      ? 'libmediapipe.dll'
      : process.platform === 'darwin'
        ? 'libmediapipe.dylib'
        : 'libmediapipe.so'

  const probe = spawnSync(
    python,
    [
      '-c',
      [
        'from pathlib import Path',
        'import mediapipe',
        `lib_name = ${JSON.stringify(libName)}`,
        'base = Path(mediapipe.__file__).resolve().parent',
        "target = base / 'tasks' / 'c' / lib_name",
        'print(target)',
      ].join('; '),
    ],
    {
      encoding: 'utf8',
    },
  )

  if (probe.status !== 0) {
    fail(
      [
        'MediaPipe 동적 라이브러리 경로를 확인할 수 없습니다.',
        '`sidecar/posture-engine/requirements.txt` 기준으로 의존성 설치를 다시 확인해주세요.',
      ].join('\n'),
      probe.stderr?.trim(),
    )
  }

  const resolvedPath = probe.stdout.trim()
  if (!resolvedPath || !existsSync(resolvedPath)) {
    console.warn(
      `MediaPipe 동적 라이브러리 경로가 유효하지 않아 add-binary를 생략합니다: ${resolvedPath}`,
    )
    return null
  }

  return resolvedPath
}

function runCodesign(args, failureMessage) {
  const result = spawnSync('codesign', args, {
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    fail(failureMessage, result.stderr?.trim() || result.stdout?.trim())
  }
}

function collectRegularFiles(rootPath) {
  const entries = []

  for (const entry of readdirSync(rootPath)) {
    const path = join(rootPath, entry)
    const stats = lstatSync(path)

    if (stats.isDirectory()) {
      entries.push(...collectRegularFiles(path))
      continue
    }

    if (stats.isFile()) {
      entries.push(path)
    }
  }

  return entries
}

function collectFrameworkDirs(rootPath) {
  const entries = []

  for (const entry of readdirSync(rootPath)) {
    const path = join(rootPath, entry)
    const stats = statSync(path)

    if (!stats.isDirectory()) {
      continue
    }

    if (entry.endsWith('.framework')) {
      entries.push(path)
    }

    entries.push(...collectFrameworkDirs(path))
  }

  return entries
}

function isMacosBinary(path) {
  const result = spawnSync('file', ['-b', path], {
    encoding: 'utf8',
  })

  return result.status === 0 && result.stdout.includes('Mach-O')
}

function isInsideFramework(path) {
  return path.split('/').some(part => part.endsWith('.framework'))
}

function materializeSymlink(path) {
  if (!existsSync(path)) {
    return
  }

  const stats = lstatSync(path)
  if (!stats.isSymbolicLink()) {
    return
  }

  const realPath = realpathSync(path)
  const realStats = statSync(realPath)

  if (!realStats.isFile() || !isMacosBinary(realPath)) {
    return
  }

  rmSync(path)
  copyFileSync(realPath, path)
  chmodSync(path, realStats.mode)
}

function materializeMacosBinarySymlinks(rootPath) {
  for (const entry of readdirSync(rootPath)) {
    const path = join(rootPath, entry)
    const stats = lstatSync(path)

    if (stats.isSymbolicLink()) {
      materializeSymlink(path)
      continue
    }

    if (stats.isDirectory()) {
      materializeMacosBinarySymlinks(path)
    }
  }
}

function signMacosPath(
  path,
  identity,
  { deep = false, entitlements = false } = {},
) {
  const args = ['--force', '--options', 'runtime', '--timestamp']

  if (deep) {
    args.push('--deep')
  }

  if (entitlements) {
    args.push('--entitlements', macosSidecarEntitlementsPath)
  }

  args.push('--sign', identity, path)

  runCodesign(args, `macOS sidecar 코드 서명에 실패했습니다: ${path}`)
}

function verifyMacosSignature(path) {
  runCodesign(
    ['--verify', '--strict', '--verbose=2', path],
    `macOS sidecar 코드 서명 검증에 실패했습니다: ${path}`,
  )
}

function signMacosSidecar() {
  const identity = process.env.APPLE_SIGNING_IDENTITY

  if (process.platform !== 'darwin' || !identity) {
    return
  }

  if (shouldBuildMacosOnefile) {
    signMacosPath(outputExecutablePath, identity, { entitlements: true })
    verifyMacosSignature(outputExecutablePath)
    return
  }

  materializeMacosBinarySymlinks(outputPath)

  const binaryPaths = collectRegularFiles(outputPath)
    .filter(path => path !== outputExecutablePath)
    .filter(path => !isInsideFramework(path))
    .filter(isMacosBinary)
    .sort((left, right) => right.split('/').length - left.split('/').length)

  for (const binaryPath of binaryPaths) {
    signMacosPath(binaryPath, identity)
  }

  for (const frameworkPath of collectFrameworkDirs(outputPath)) {
    signMacosPath(frameworkPath, identity, { deep: true })
  }

  signMacosPath(outputExecutablePath, identity, { entitlements: true })
  verifyMacosSignature(outputExecutablePath)
}

function appendMacosPyInstallerSigningArgs(args) {
  const identity = process.env.APPLE_SIGNING_IDENTITY

  if (process.platform !== 'darwin' || !identity) {
    return
  }

  args.push(
    '--codesign-identity',
    identity,
    '--osx-entitlements-file',
    macosSidecarEntitlementsPath,
  )
}

function cleanupPyInstallerArtifacts() {
  for (const path of [buildDir, specDir]) {
    if (existsSync(path)) {
      rmSync(path, { recursive: true, force: true })
    }
  }
}

ensurePathExists(sidecarDir, '자세 엔진 디렉터리')
ensurePathExists(entryScriptPath, '자세 엔진 엔트리 스크립트')
ensurePathExists(modelsDir, '자세 엔진 모델 디렉터리')
if (process.platform === 'darwin') {
  ensurePathExists(macosSidecarEntitlementsPath, 'macOS sidecar entitlement')
}
ensurePythonAvailable()
ensurePythonPackage(
  'PyInstaller',
  '`pip install pyinstaller` 또는 프로젝트 요구사항 설치가 필요합니다.',
)
ensurePythonPackage(
  'mediapipe',
  '`pip install -r sidecar/posture-engine/requirements.txt`로 MediaPipe 의존성을 설치해주세요.',
)
const mediaPipeBinaryPath = resolveMediaPipeBinaryPath()

for (const path of [outputPath, buildDir, specDir]) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true })
  }
}

const args = [
  '-m',
  'PyInstaller',
  '--clean',
  shouldBuildMacosOnefile ? '--onefile' : '--onedir',
  '--name',
  'posture-engine',
  '--distpath',
  sidecarDir,
  '--workpath',
  buildDir,
  '--specpath',
  specDir,
  '--add-data',
  `${modelsDir}${dataSeparator}models`,
  '--collect-submodules',
  'mediapipe.tasks.python.core',
  '--collect-submodules',
  'mediapipe.tasks.python.components.containers',
  '--collect-submodules',
  'mediapipe.tasks.python.vision.core',
  '--hidden-import',
  'mediapipe.tasks.c',
  '--hidden-import',
  'mediapipe.tasks.python.core.base_options',
  '--hidden-import',
  'mediapipe.tasks.python.vision.core.image',
  '--hidden-import',
  'mediapipe.tasks.python.vision.core.vision_task_running_mode',
  '--hidden-import',
  'mediapipe.tasks.python.vision.pose_landmarker',
  '--exclude-module',
  'tensorflow',
  '--exclude-module',
  'matplotlib',
  '--exclude-module',
  'sounddevice',
  entryScriptPath,
]

appendMacosPyInstallerSigningArgs(args)

if (mediaPipeBinaryPath) {
  args.splice(
    args.indexOf('--collect-submodules'),
    0,
    '--add-binary',
    `${mediaPipeBinaryPath}${dataSeparator}mediapipe/tasks/c`,
  )
}

const result = spawnSync(python, args, {
  cwd: sidecarDir,
  stdio: 'inherit',
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

if (!existsSync(outputExecutablePath)) {
  console.error(`자세 엔진 실행 파일 산출 실패: ${outputExecutablePath}`)
  process.exit(1)
}

signMacosSidecar()

const smoke = spawnSync(outputExecutablePath, {
  input: `${JSON.stringify({ command: 'latest_result', session_id: 'smoke' })}\n`,
  encoding: 'utf8',
  timeout: 300000,
})

if (smoke.status !== 0) {
  process.stderr.write(smoke.stderr)
  if (smoke.error) {
    console.error(smoke.error.message)
  }
  process.exit(smoke.status ?? 1)
}

const response = smoke.stdout.trim()
if (!response.includes('"session_id": "smoke"')) {
  console.error(`자세 엔진 smoke 응답이 올바르지 않음: ${response}`)
  process.exit(1)
}

cleanupPyInstallerArtifacts()

console.log(`자세 엔진 실행 파일 생성 완료: ${outputExecutablePath}`)
