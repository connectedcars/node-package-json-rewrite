const { spawnSync } = require('child_process')

test('should run npm', () => {
  let npmRun = spawnSync(`${__dirname}/npm`)
  expect(npmRun.stdout.toString()).toMatch(/npm\s*exit code: \d, signal: null/)
})

test('should run npm with arch', () => {
  let npmRun = spawnSync(`${__dirname}/npm`, { env: { ...process.env, OECORE_TARGET_ARCH: 'x86_64' } })
  expect(npmRun.stdout.toString()).toMatch(/npm\s*--arch=x86_64 exit code: \d, signal: null/)
})

test('should run npm when in path', () => {
  let npmRun = spawnSync(`npm`, { env: { ...process.env, PATH: `${__dirname}:${process.env['PATH']}` } })
  expect(npmRun.stdout.toString()).toMatch(/npm\s*exit code: \d, signal: null/)
})

test('should run npm when in path and relative run', () => {
  let npmRun = spawnSync(`${__dirname}/../bin/npm`, {
    env: { ...process.env, PATH: `${__dirname}:${process.env['PATH']}` }
  })
  expect(npmRun.stdout.toString()).toMatch(/npm\s*exit code: \d, signal: null/)
})
