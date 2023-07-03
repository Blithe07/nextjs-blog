---
title: "Electron Sandbox"
date: "2023-07-03"
category: "electron"
---

## Process Sandboxing

The sandbox limits the harm that malicious code can cause by limiting access to most system resources — sandboxed processes can only freely use CPU cycles and memory.

In Chromium, sandboxing is applied to most processes other than the main process. This includes renderer processes, as well as utility processes such as the audio service, the GPU service and the network service.

### Sandbox behavior in Electron

#### Renderer processes

A sandboxed renderer won't have a Node.js environment initialized and only perform privileged tasks (such as interacting with the filesystem, making changes to the system, or spawning subprocesses) by delegating these tasks to the main process via inter-process communication (IPC).

### Preload scripts

A require function similar to Node's require module is exposed, but can only import a subset of Electron and Node's built-in modules:

- electron(following renderer process modules: contextBridge, crashReporter, ipcRenderer, nativeImage, webFrame)
- events
- timers
- url
- node:events
- node:timers
- node:url
- Buffer
- process
- clearImmediate
- setImmediate

By default, we can't use CommonJS modules to separate preload script into multiple files.
If you need to split your preload code, use a bundler such as webpack or Parcel. 

### Configuring the sandbox

1. BrowserWindow({
    webPreferences: {
      sandbox: false
    }
  })
2. BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    }
  })
3. app.enableSandbox() (global)
4. --no-sandbox CLI flag