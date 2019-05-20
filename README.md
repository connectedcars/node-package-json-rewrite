# package-json-rewrite

Simple wrapper to inject GitHub personal access tokens into package.json or load an ssh key into ssh-agent on npm/yarn install

## Installation

``` bash
# Setup github token injection wrappers for npm and yarn
npm install -g https://github.com/connectedcars/node-package-json-rewrite
mkdir -p /opt/connectedcars/bin
ln -s /usr/local/bin/package-json-rewrite /opt/connectedcars/bin/npm
ln -s /usr/local/bin/package-json-rewrite /opt/connectedcars/bin/yarn
export PATH=/opt/connectedcars/bin:$PATH
```

## How to use

Only one method will be used at a time, if both GITHUB_PAT and SSH_KEY_PATH/SSH_KEY_PASSWORD are set ssh-agent method will be used.

* GITHUB_PAT: Set GitHub personal access token as an environment variable
* SSH_KEY_PATH: Path to SSH key to load
* SSH_KEY_PASSWORD: Password for SSH key

## VS Code

launch.json:

``` jsonc
{
    // Use IntelliSense to learn about possible Node.js debug attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "name": "vscode-jest-tests",
            "request": "launch",
            "program": "${workspaceFolder}/node_modules/jest/bin/jest",
            "args": [
                "--runInBand"
            ],
            "cwd": "${workspaceFolder}",
            "console": "integratedTerminal",
            "internalConsoleOptions": "neverOpen"
        },
        {
            "type": "node",
            "request": "launch",
            "name": "Launch Program",
            "program": "${workspaceRoot}/bin/npm",
            "env": {}
        }
    ]
}
```

settings.json:

``` jsonc
// Place your settings in this file to overwrite default and user settings.
{
    "eslint.autoFixOnSave": true
}
```
