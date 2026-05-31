import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(__dirname, '../../../..')

describe('camera privacy guards', () => {
  it('does not add remote frame upload paths in usePostureEngine', () => {
    const source = readFileSync(
      resolve(
        repoRoot,
        'src/features/posture-engine/model/use-posture-engine.ts',
      ),
      'utf8',
    )

    expect(source).not.toMatch(/\bfetch\s*\(/)
    expect(source).not.toMatch(/\baxios\s*\./)
    expect(source).not.toContain('imagePayload')
    expect(source).not.toContain('data:image/jpeg')
  })

  it('allows camera preview images only from local stream origins', () => {
    const tauriConfig = JSON.parse(
      readFileSync(resolve(repoRoot, 'src-tauri/tauri.conf.json'), 'utf8'),
    )
    const csp = tauriConfig.app.security.csp as string
    const imgSrc = csp.match(/img-src ([^;]+)/)?.[1] ?? ''

    expect(imgSrc).toContain('http://127.0.0.1:*')
    expect(imgSrc).not.toContain('https://')
  })
})
