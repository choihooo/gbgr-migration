import { builtinModules } from 'node:module'
import { join } from 'node:path'
import { chrome } from '../../.electron-vendors.cache.json'

const PACKAGE_ROOT = __dirname

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: process.cwd(),
  resolve: {
    alias: {
      '/@/': `${join(PACKAGE_ROOT, 'src')}/`,
    },
  },
  build: {
    sourcemap: 'inline',
    target: `chrome${chrome}`,
    outDir: '../../dist/preload',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron', ...builtinModules.flatMap(p => [p, `node:${p}`])],
      output: {
        entryFileNames: '[name].cjs',
      },
    },
    emptyOutDir: true,
    brotliSize: false,
  },
}

export default config
