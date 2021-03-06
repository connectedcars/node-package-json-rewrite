const { packageJSONRewrite, findCmd } = require('.')

test('replace all git+ssh with https', () => {
  let packageJSON = {
    dependencies: {
      'awesome-module': 'git+ssh://git@github.com/connectedcars/awesome-module.git'
    }
  }
  packageJSONRewrite(packageJSON, 'ACCESSTOKENHERE')
  expect(packageJSON).toEqual({
    dependencies: {
      'awesome-module': 'git+https://ACCESSTOKENHERE:@github.com/connectedcars/awesome-module.git'
    }
  })
})

test('replace all git+ssh semver with https', () => {
  let packageJSON = {
    dependencies: {
      'awesome-module': 'git+ssh://git@github.com/connectedcars/awesome-module.git#semver:^v1.0.0'
    }
  }
  packageJSONRewrite(packageJSON, 'ACCESSTOKENHERE')
  expect(packageJSON).toEqual({
    dependencies: {
      'awesome-module': 'git+https://ACCESSTOKENHERE:@github.com/connectedcars/awesome-module.git#semver:^v1.0.0'
    }
  })
})

test('replace all github: with https', () => {
  let packageJSON = {
    dependencies: {
      '@connectedcars/some-project': 'github:connectedcars/some-project'
    }
  }
  packageJSONRewrite(packageJSON, 'ACCESSTOKENHERE')
  expect(packageJSON).toEqual({
    dependencies: {
      '@connectedcars/some-project': 'git+https://ACCESSTOKENHERE:@github.com/connectedcars/some-project.git'
    }
  })
})

test('replace all github: semver with https', () => {
  let packageJSON = {
    dependencies: {
      '@connectedcars/some-project': 'github:connectedcars/some-project#semver:^v1.0.0'
    }
  }
  packageJSONRewrite(packageJSON, 'ACCESSTOKENHERE')
  expect(packageJSON).toEqual({
    dependencies: {
      '@connectedcars/some-project':
        'git+https://ACCESSTOKENHERE:@github.com/connectedcars/some-project.git#semver:^v1.0.0'
    }
  })
})

test('findCmd', () => {
  let path = findCmd(`${__dirname}/npm`, `${__dirname}/../bin:${__dirname}`, 'npm')
  expect(path).toMatch(/npm$/)
})
