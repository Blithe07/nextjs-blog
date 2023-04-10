---
title: Fiber Node And Double Cache
date: 2023-04-10
---

## Fiber Node

```
function FiberNode(tag, pendingProps, key, mode){
  // Instance
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null; // dom node
  
  // Fiber
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;
  // Effects
  this.flags = NoFlags;
  this.subtreeFlags = NoFlags;
  this.deletions = null;
  // Priority
  this.lanes = NoLanes;
  this.childLanes = NoLanes;
}
```

## Double Cache

Similar to how a graphics card works. The graphics card is divided into a frontbuffer and a backbuffer. Frontbuffer wille show image and new image will be written to the backbuffer. After that, make exchange between frontbuffer and backbuffer. This call double cache.

In fiber framework, exist two fiber trees. One is associated with dom node which is like to frontbuffer, the other is build in cache which is like to backbuffer.

```
// current: frontbuffer fiber; workInProgress: backbuffer fiber
function createWorkInProgress(current,pendingProps){
  let workInProgress = current.alternate;
  // We use a double buffering pooling technique because we know that we'll
  // only ever need at most two versions of a tree. We pool the "other" unused
  // node that we're free to reuse. This is lazily created to avoid allocating
  // extra objects for things that are never updated. It also allow us to
  // reclaim the extra memory if needed.
  if(workInProgress === null){
    // ...
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  }
}
```

