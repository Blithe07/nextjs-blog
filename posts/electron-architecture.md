---
title: "Electron Architecture"
date: "2023-07-03"
category: "electron"
---

## Concept

Electron inherits its **`multi-process architecture`** from Chromium, which makes the framework architecturally very similar to a modern web browser.

### Why not a single process?

In the earlier days, browsers usually used a single process for all of this functionality.
Although this pattern meant less overhead for each tab you had open, it also meant that one website crashing or hanging would affect the entire browser.

### The multi-process model

To solve this problem, the Chrome team decided that each tab would render in its own process, 
limiting the harm that buggy or malicious code on a web page could cause to the app as a whole.

![electron-architecture](/images/electron-architecture.png)

As an app developer, you control two types of processes: `main` and `renderer`.

### The main process

Each Electron app has a single main process(entry point). 
The main process runs in a `Node.js` environment

#### Window management

The main process' primary purpose is to create and manage application windows with the **`BrowserWindow`** module.

#### Application lifecycle

The main process also controls your application's lifecycle through Electron's **`app`** module.

#### Native APIs

Electron exposes various modules that control **`native desktop functionality`**, such as `menus`, `dialogs`, and `tray icons`.

### The renderer process

Each Electron app spawns a separate **`renderer process`**(no direct access to require or other Node.js APIs) for each open BrowserWindow.

### Preload scripts

Contain code that executes in a renderer process before its web content begins loading.
(granted more privileges by having access to Node.js APIs)

Because of the `contextIsolation` default, so use the **`contextBridge`** module to accomplish this securely:

```
// main.js
const { BrowserWindow } = require('electron')
const win = new BrowserWindow({
  webPreferences: {
    preload: 'path/to/preload.js'
  }
})

// preload.js
const { contextBridge } = require('electron')
contextBridge.exposeInMainWorld('myAPI', {
  desktop: true
})
```

### The utility process

Electron app can spawn `multiple child processes` from the main process using the **`UtilityProcess`** API.

Responsibility: untrusted services, CPU intensive tasks or crash prone components which would have previously been hosted in the main process 
or process spawned with Node.js child_process.fork API. 

Difference with Node.js child_process module: The utility process can establish a communication channel with a renderer process using **`MessagePorts`**.

Best Practice: use **`Utility Process`** API to fork a child process from the main process instead of Node.js **`child_process.fork`** API.