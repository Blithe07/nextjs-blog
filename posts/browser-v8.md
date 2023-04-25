---
title: "Chrome V8 GC"
date: "2023-04-25"
category: "browser"
---

## Javascript Memory Management

The lifecycles of memory:
1. allocate memory which you need
2. use memory for write or read
3. free memory which you don't need

In Javascript, the memory which save simple data type is allocated and released by operate system automatically 
and the memory which save reference data type is released by js enginer manually.

## Chorme GC Algorithm

V8 uses two different garbage collectors for more efficient implementation of garbage collection.

1. Secondary garbage collector - Scavenge: responsible for the new generation of garbage(1~8M)
2. Main garbage collector - Mark-Sweep & Mark-Compact: responsible for the old generation of garbage(>8M)


### Scavenge

Like `React Double Cache`. Copy activity object from `from-space` to `to-space`, Sort `to-space` and then swap `from-space` and `to-space`.

![Scavenge Workflow](/images/scavenge.jpg)

#### When will objects in the new generation become objects in the old generation?

The new generation is divided to `nursery` and `intermediate`. A object will be allocated to `nursery` when first allocate memory 
and will be allocated to `intermediate` when next gc if exist. Go through the next gc, this object will be move to the old generation if exist.


### Mark-Sweep

- mark stage: first scan and mark activity object
- sweep stage: second scan and sweep inactivity object

![Mark Sweep Workflow](/images/mark-sweep.jpg)


### Mark-Compact

move activity object and clean boundary memory

![Mark Compact Workflow](/images/mark-compact.jpg)


### Stop-The-World

When gc make Javascript application stop, it call `stop-the-world`.In the new generation, there is none problem because of `Scavenge` is fast. 
But in the old generation maybe cause page lag. 

To fix this problem, launched `Orinoco`.Specific implement is as follows:

- Incremental marking: Incremental marking is enabled when the size of the heap reaches a certain threshold. Once enabled, whenever a certain amount of memory is allocated, the execution of the script pauses and an incremental marking is performed.
- Lazy sweeping: Sweep one by one as needed.
- Concurrent: Allow the main thread to be suspended while garbage collection is in progress.
- Parallel: Allow both main and auxiliary threads to perform the same GC work simultaneously.


## Current Usage

### Secondary GC

Use `parallel`. To avoid multi threads operate same activity object, after the first thread replicate the active object and the replication is completed, V8 must maintain the pointer forwarding address after copying the active object, so that other assisting threads can find the active object and determine whether it has been replicated.

![Secondary GC](/images/secondary-gc.jpg)

### Main GC

`Concurrent` will startup when the size of the heap reaches a certain threshold. Main thread only execute `check` operation and auxiliary thread will sweep memory after `check`.

![Main GC](/images/main-gc.jpg)
