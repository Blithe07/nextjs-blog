---
title: "Electron MessagePorts"
date: "2023-07-03"
category: "electron"
---

## MessagePorts in Electron

Allow passing messages between different contexts. It's like window.postMessage, but on different channels.

### MessagePorts in the main process

In order to handle and interact with MessagePorts in the main process, Electron adds two new classes: **`MessagePortMain`** and **`MessageChannelMain`**.

MessagePort objects can be created in either the renderer or the main process, and passed back and forth using the ipcRenderer.postMessage and WebContents.postMessage methods.

### Extension: close event

The **`close`** event, which is emitted when the other end of the channel is closed. Ports can also be implicitly closed by being garbage-collected.

renderer: port.onclose || port.addEventListener('close', ...)   
main: port.on('close', ...)

### Example

- [Setting up a MessageChannel between two renderers](https://www.electronjs.org/docs/latest/tutorial/message-ports#setting-up-a-messagechannel-between-two-renderers)
- [Worker process](https://www.electronjs.org/docs/latest/tutorial/message-ports#worker-process)
- [Reply streams](https://www.electronjs.org/docs/latest/tutorial/message-ports#reply-streams)
- [Communicating directly between the main process and the main world of a context-isolated page](communicating-directly-between-the-main-process-and-the-main-world-of-a-context-isolated-page)