const { writeFile } = require('node:fs/promises')
const { execSync } = require('node:child_process')
const electron = require('electron')
const path = require('node:path')
const vendorsCachePath = path.resolve(process.cwd(), '.electron-vendors.cache.json')
const browserslistrcPath = path.resolve(process.cwd(), '.browserslistrc')

/**
 * Returns versions of electron vendors
 * The performance of this feature is very poor and can be improved
 * @see https://github.com/electron/electron/issues/28006
 *
 * @returns {NodeJS.ProcessVersions}
 */
function getVendors() {
  const output = execSync(`${electron} -p "JSON.stringify(process.versions)"`, {
    env: { ELECTRON_RUN_AS_NODE: '1' },
    encoding: 'utf-8',
  })

  return JSON.parse(output)
}

function updateVendors() {
  if (process.env.VERCEL) {
    console.warn(
      'Skipping Electron vendor refresh on Vercel; using committed cache files.',
    )
    return Promise.resolve()
  }

  const electronRelease = getVendors()

  const nodeMajorVersion = electronRelease.node.split('.')[0]
  const chromeMajorVersion =
    electronRelease.v8.split('.')[0] + electronRelease.v8.split('.')[1]

  return Promise.all([
    writeFile(
      vendorsCachePath,
      `${JSON.stringify(
        {
          chrome: chromeMajorVersion,
          node: nodeMajorVersion,
        },
        null,
        2,
      )}\n`,
    ),

    writeFile(browserslistrcPath, `Chrome ${chromeMajorVersion}\n`, 'utf8'),
  ])
}

updateVendors().catch(err => {
  console.error(err)
  process.exit(1)
})
