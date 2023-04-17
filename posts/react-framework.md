---
title: 'React Framework'
date: '2023-04-09'
category: "react"
---

## Before React 16(Stack)

### Architecture
- Reconciler: the implement of virtual dom and be reponsible for calculate UI change.
- Renderer: be reponsible for render UI change to host environment.

In Reconciler,mount component will execute mountComponent, update component will execute updateComponent.Both of them will create or update children recursive. When the task start, it cann't be interrupted.

As the scale of the project increases, cause UI stuck. The reasons for stck are mainly limited by the following two aspects:
1. calculate oversize. Because of before React 16, react diff recursive so it's difficult to interrupt process.
2. I/O waiting. Long time network request also cause UI stuck.


## React 16(Fiber)

### Architecture
- Scheduler: handle the priority of scheduler task, high priority task will enter into Reconciler.
- Reconciler: the implement of virtual dom and be reponsible for calculate UI change.
- Renderer: be reponsible for render UI change to host environment.

Import `Fiber` concept, describe dom node by object. The difference to stack framework, each fiber object is connected in series linked list. `child` connect to children element, `sibling` connect to brother element, `return` connect to parent element.

Use Fiber, we can interrupt process. Each loop will execute shouldYield to judge if there is timeRemaining. If no, pause update process, give the main thread to renderer and wait for next macro task to execute(fix calculate oversize). Pass by Scheduler, we can handle the high priority like user input immediately and set the priority of task(fix I/O waiting).
