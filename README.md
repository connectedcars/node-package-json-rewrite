# package-json-rewrite

Simple wrapper to inject GitHub personal access tokens into package.json on npm/yarn install

## Installation

``` bash
# Setup github token injection wrappers for npm and yarn
npm install -g https://github.com/connectedcars/node-package-json-rewrite
mkdir -p /opt/connectedcars/bin
ln -s /usr/local/bin/package-json-rewrite /opt/connectedcars/bin/npm
ln -s /usr/local/bin/package-json-rewrite /opt/connectedcars/bin/yarn
export PATH=/opt/connectedcars/bin:$PATH
```
