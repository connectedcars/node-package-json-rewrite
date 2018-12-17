const { spawnSync } = require('child_process')

test('should run npm', () => {
  let npmRun = spawnSync(`${__dirname}/npm`)
  expect(npmRun.stdout.toString()).toMatch(/npm exit code: \d, signal: null/)
})
