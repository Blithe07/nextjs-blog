---
title: "Git Action"
date: "2023-04-25"
category: "utils"
---

## Effect

implement merge code or push code to main, `dependabot` update dependency and other action 
will automatically trigger a series of processes such as testing and publish version.

## implement

- create `.github/workflows` folder in root, then create `ci.yml` and `cd.yml` file inside.

```
// ci.yml
name: CI

on:
  push:
    branches:
      - '**'
  pull_request:
    branches:
      - '**'
jobs:
  linter:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 16
      - run: npm ci
      - run: npm run lint
  tests:
    needs: linter
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 16
      - run: npm ci
      - run: npm run test

```

- register npm account and create `package`, then create `GH_TOKEN` and `NPM_TOKEN`.Finally, set them into project `Actions secrets`.

```
// cd.yml
name: CD

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 16
      # https://github.com/semantic-release/git/issues/209
      - run: npm ci --ignore-scripts
      - run: npm run build
      - run: npx semantic-release
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- install `semantic-release`, `@semantic-release/changelog`, `@semantic-release/git`
- create `.releaserc`
    - Only when `push` and `pull_request` to main branch will be published
    - Only commit prefixed with `feature`, `fix`, or `perf` will be published
```
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/github",
    "@semantic-release/npm",
    "@semantic-release/git"
  ]
}
```

- create `dependabot.yml` to implement update dependency automatically
```
version: 2
updates:
  # Enable version updates for npm
  - package-ecosystem: 'npm'
    # Look for `package.json` and `lock` files in the `root` directory
    directory: '/'
    # Check the npm registry for updates every day (weekdays)
    schedule:
      interval: 'weekly'
```