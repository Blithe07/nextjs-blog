---
title: "Electron IPC"
date: "2023-07-03"
category: "electron"
---

## Inter-Process Communication(IPC)

Because the main and renderer processes have different responsibilities in Electron's process model, 
IPC is the only way to perform many common tasks, such as calling a native API from your UI or triggering changes in your web contents from native menus.

###  IPC channels

Processes communicate by passing messages through developer-defined "channels" with the **`ipcMain`** and **`ipcRenderer`** modules.

### Renderer to Main

1. To fire a one-way IPC message from a renderer process to the main process, 
you can use the **`ipcRenderer.send`** API to send a message that is then received by the **`ipcMain.on`** API.
2. Calling a main process module from your renderer process code and waiting for a result. 
This can be done by using **`ipcRenderer.invoke`** paired with **`ipcMain.handle`**.

### Main to Renderer

Messages need to be sent to a renderer process via **`win.webContents.send`** and then renderer process received by the **`ipcRenderer.on`** API.

### Renderer to Renderer

There's no direct way to send messages between renderer processes in Electron using the ipcMain and ipcRenderer modules. To achieve this, you have two options:

1. Use the main process as a message broker between renderers. This would involve sending a message from one renderer to the main process, which would forward the message to the other renderer.
2. Pass a MessagePort from the main process to both renderers. This will allow direct communication between renderers after the initial setup.

### Object serialization

Electron's IPC implementation uses the HTML standard [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) to serialize objects passed between processes.