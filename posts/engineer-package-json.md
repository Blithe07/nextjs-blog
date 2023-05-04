---
title: "package.json"
date: "2023-05-04"
category: "engineer"
---

## attribute

1. script:  The sub directory of `node_modules/.bin` will be added in `PATH` variables when npm run shell. So `"build": "esbuild xxx.js"` is equal to `"build": "./node_modules/.bin/esbuild xxx.js"`
2. bin: Loaded executable file in global environment
3. workspaces: The packages in the workspaces declaration directory will be soft-linked to the node_modules of the top-level root package
4. type: Default is `commonjs`. When the type field is specified, all files ending with the .js suffix in the directory follow the modular specification specified by type
5. main: Define npm entry file(browser/node)
6. module: Define npm entry file which follow ESM modular specification(browser/node)
7. browser: Define npm entry file(browser)
8. exports: The real and all exports of the npm package will have higher priority than fields such as `main` and `file`
