import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const migrationDir = resolve(scriptDir, '..')
const tauriCliPath = join(migrationDir, 'node_modules', '@tauri-apps', 'cli', 'tauri.js')
const dmgBuilderPath = join(scriptDir, 'build-macos-dmg.mjs')

function runNodeScript(scriptPath, args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: migrationDir,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function parseBundles(args) {
  const flagIndexes = []

  args.forEach((arg, index) => {
    if (arg === '--bundles' || arg === '-b') {
      flagIndexes.push(index)
    }
  })

  if (flagIndexes.length === 0) {
    return null
  }

  const values = []
  for (const index of flagIndexes) {
    const next = args[index + 1]
    if (next && !next.startsWith('-')) {
      values.push(...next.split(',').map(value => value.trim()).filter(Boolean))
    }
  }

  return values
}

function stripBundleFlags(args) {
  const stripped = []

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index]
    if (current === '--bundles' || current === '-b') {
      index += 1
      continue
    }
    stripped.push(current)
  }

  return stripped
}

function shouldBuildManualDmg(args) {
  if (args.includes('--no-bundle')) {
    return false
  }

  const bundles = parseBundles(args)
  if (!bundles || bundles.length === 0) {
    return true
  }

  return bundles.includes('all') || bundles.includes('dmg')
}

function buildArgsForTauri(args, manualDmg) {
  if (!manualDmg) {
    return args
  }

  return [...stripBundleFlags(args), '--bundles', 'app']
}

function parseDmgBuilderArgs(args) {
  const forwarded = []
  const targetIndex = args.indexOf('--target')

  if (args.includes('--debug')) {
    forwarded.push('--debug')
  }

  if (targetIndex >= 0 && args[targetIndex + 1]) {
    forwarded.push('--target', args[targetIndex + 1])
  }

  return forwarded
}

const cliArgs = process.argv.slice(2)
const command = cliArgs[0]

if (process.platform !== 'darwin' || command !== 'build') {
  runNodeScript(tauriCliPath, cliArgs)
}

const manualDmg = shouldBuildManualDmg(cliArgs.slice(1))
runNodeScript(tauriCliPath, buildArgsForTauri(cliArgs, manualDmg))

if (manualDmg) {
  runNodeScript(dmgBuilderPath, parseDmgBuilderArgs(cliArgs.slice(1)))
}
