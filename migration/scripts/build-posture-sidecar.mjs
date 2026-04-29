import { spawnSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const migrationDir = resolve(scriptDir, '..')
const repoRoot = resolve(migrationDir, '..')
const sidecarDir = join(repoRoot, 'sidecar', 'posture-engine')
const outputName =
  process.platform === 'win32' ? 'posture-engine.exe' : 'posture-engine'
const outputPath = join(sidecarDir, outputName)
const buildDir = join(sidecarDir, '.pyinstaller-build')
const specDir = join(sidecarDir, '.pyinstaller-spec')
const dataSeparator = process.platform === 'win32' ? ';' : ':'
const python = process.env.PYTHON ?? resolvePythonCommand()

function resolvePythonCommand() {
  const candidates =
    process.platform === 'win32' ? ['python'] : ['python3.11', 'python3']

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

for (const path of [outputPath, buildDir, specDir]) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true })
  }
}

const args = [
  '-m',
  'PyInstaller',
  '--clean',
  '--onefile',
  '--name',
  'posture-engine',
  '--distpath',
  sidecarDir,
  '--workpath',
  buildDir,
  '--specpath',
  specDir,
  '--add-data',
  `${join(sidecarDir, 'models')}${dataSeparator}models`,
  join(sidecarDir, 'main.py'),
]

const result = spawnSync(python, args, {
  cwd: sidecarDir,
  stdio: 'inherit',
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

if (!existsSync(outputPath)) {
  console.error(`자세 엔진 실행 파일 산출 실패: ${outputPath}`)
  process.exit(1)
}

const smoke = spawnSync(outputPath, {
  input: `${JSON.stringify({ command: 'latest_result', session_id: 'build-smoke' })}\n`,
  encoding: 'utf8',
  timeout: 120000,
})

if (smoke.status !== 0) {
  process.stderr.write(smoke.stderr)
  if (smoke.error) {
    console.error(smoke.error.message)
  }
  process.exit(smoke.status ?? 1)
}

const response = smoke.stdout.trim()
if (!response.includes('"session_id": "build-smoke"')) {
  console.error(`자세 엔진 smoke 응답이 올바르지 않음: ${response}`)
  process.exit(1)
}

console.log(`자세 엔진 실행 파일 생성 완료: ${outputPath}`)
