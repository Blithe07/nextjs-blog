---
title: "Source tour of 'beginWork'、'completeWork' and  `commitWork`"
date: "2023-04-25"
category: "react"
---

# Render Stage

The second stage work of Render is reconciler. It contains beginWork and completeWork.

- beginWork: According to current fiberNode, generate next fiberNode and then mark flags
- completeWork: According to wip.tag, create element or mark the update status of element and then handle flags bubble

![react reconciler](/images/react-reconciler.png)

## beginWork

![react reconciler beginWork](/images/react-reconciler-beginWork.png)

`mountChildFibers` and `reconcileChildFiber` are both call `ChilReconciler`, and pass difference param(mount pass `false`, update pass `true`)

```
function beginWork(current,workInProgress,renderLanes){
    if(current !== null){
        // update
    }else{
        // mount
    }

    // ...

    switch(workInProgress.tag){
        case IndeterminateComponent:{
            // ...
        }
        case FunctionComponent:{
            // ...
        }
        case ClassComponent:{
            // ...
        }
    }
}
```

## completeWork

![react reconciler completeWork](/images/react-reconciler-completeWork.png)

### mount

1. createInstance. create dom by fiberNode.
2. appendAllChildren.
   - depth-first traversal. Insert current level dom into parent(appendChild).
   - perform step one on the sibling.
   - no exist sibling, perform step one on the parent fiberNode's sibling.
   - stop when return to initial step or parent level
3. finalizeInitialChildren. Init properties.
   - styles => setValueForStyles
   - innerHTML => setInnerHTML
   - text children => setTextContent
   - non bubble event => listenToNonDelegatedEvent
   - other properties => setValueForProperty

```
function createInstance(type,props,rootContainerInstance,hostContext,internalInstanceHandle){
    // ...
    if(typeof props.children === 'string' || typeof props.children === 'number'){
        // special handle
    }

    // create dom element
    const domElement = createElement(type,props,rootContainerInstance,parentNamespace)

    // ...

    return domElement
}

function appendAllChildren(parent,workInProgress,...){
    let node = workInProgress.child

    while(node !== null){
        if(node.tag === HostComponent || node.tag === HostText){
            appendInitialChild(parent, node.stateNode)
        }else if(node.child !== null){
            node.child.return = node
            node = node.child
            continue
        }

        if(node === workInProgress){
            return
        }

        while(node.sibling === null){
            if(node.return === null || node.return === workInProgress){
                return
            }
            node = node.return
        }

        node.sibling.return = node
        node = node.sibling
    }
}
```

### update

The aim is to mark property which is update. Main logic method: `diffProperties`

```
function diffProperties(
  domElement: Element,
  tag: string,
  lastProps: Object,
  nextProps: Object,
): null | Array<mixed> {
  // [key1,value1,key2,value2,...]
  let updatePayload: null | Array<any> = null;

  let propKey;
  let styleName;
  let styleUpdates = null;
  // mark delete property(old exist, new non exist)
  for (propKey in lastProps) {
    if (
      nextProps.hasOwnProperty(propKey) ||
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] == null
    ) {
      continue;
    }
    switch (propKey) {
      case 'style': {
        const lastStyle = lastProps[propKey];
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            if (!styleUpdates) {
              styleUpdates = ({}: {[string]: $FlowFixMe});
            }
            styleUpdates[styleName] = '';
          }
        }
        break;
      }
      default: {
        // For all other deleted properties we add it to the queue. We use
        // the allowed property list in the commit phase instead.
        (updatePayload = updatePayload || []).push(propKey, null);
      }
    }
  }
  // mark update property(new exist)
  for (propKey in nextProps) {
    const nextProp = nextProps[propKey];
    const lastProp = lastProps != null ? lastProps[propKey] : undefined;
    if (
      nextProps.hasOwnProperty(propKey) &&
      nextProp !== lastProp &&
      (nextProp != null || lastProp != null)
    ) {
      switch (propKey) {
        case 'style': {
          if (lastProp) {
            // Unset styles on `lastProp` but not on `nextProp`.
            for (styleName in lastProp) {
              if (
                lastProp.hasOwnProperty(styleName) &&
                (!nextProp || !nextProp.hasOwnProperty(styleName))
              ) {
                if (!styleUpdates) {
                  styleUpdates = ({}: {[string]: string});
                }
                styleUpdates[styleName] = '';
              }
            }
            // Update styles that changed since `lastProp`.
            for (styleName in nextProp) {
              if (
                nextProp.hasOwnProperty(styleName) &&
                lastProp[styleName] !== nextProp[styleName]
              ) {
                if (!styleUpdates) {
                  styleUpdates = ({}: {[string]: $FlowFixMe});
                }
                styleUpdates[styleName] = nextProp[styleName];
              }
            }
          } else {
            // Relies on `updateStylesByID` not mutating `styleUpdates`.
            if (!styleUpdates) {
              if (!updatePayload) {
                updatePayload = [];
              }
              updatePayload.push(propKey, styleUpdates);
            }
            styleUpdates = nextProp;
          }
          break;
        }
        case 'is':
          if (__DEV__) {
            console.error(
              'Cannot update the "is" prop after it has been initialized.',
            );
          }
        // Fall through
        default: {
          (updatePayload = updatePayload || []).push(propKey, nextProp);
        }
      }
    }
  }
  if (styleUpdates) {
    (updatePayload = updatePayload || []).push('style', styleUpdates);
  }
  return updatePayload;
}
```

### flags bubble(mount and update)

Find fiberNode with flag efficiently by flags bubble. Before React 18, use effect list track side effect. It's difficult to track fiberNode side effect and child side effect.

```
function bubbleProperties(completedWork: Fiber) {
  const didBailout =
    completedWork.alternate !== null &&
    completedWork.alternate.child === completedWork.child;

  let newChildLanes = NoLanes;
  let subtreeFlags = NoFlags;

  let child = completedWork.child;
  // Bubble up the earliest expiration time.
  if (enableProfilerTimer && (completedWork.mode & ProfileMode) !== NoMode) {
    // In profiling mode, resetChildExpirationTime is also used to reset
    // profiler durations.

    // It is reset to 0 each time we render and only updated when we don't bailout.
    // So temporarily set it to 0.
    let actualDuration = completedWork.actualDuration ?? 0;
    let treeBaseDuration = ((completedWork.selfBaseDuration: any): number);

    while (child !== null) {
      newChildLanes = mergeLanes(
        newChildLanes,
        mergeLanes(child.lanes, child.childLanes),
      );

      subtreeFlags |= !didBailout
        ? child.subtreeFlags
        : child.subtreeFlags & StaticMask;
      subtreeFlags |= !didBailout ? child.flags : child.flags & StaticMask;

      // When a fiber is cloned, its actualDuration is reset to 0. This value will
      // only be updated if work is done on the fiber (i.e. it doesn't bailout).
      // When work is done, it should bubble to the parent's actualDuration. If
      // the fiber has not been cloned though, (meaning no work was done), then
      // this value will reflect the amount of time spent working on a previous
      // render. In that case it should not bubble. We determine whether it was
      // cloned by comparing the child pointer.
      // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
      if (!didBailout) {
        actualDuration += child.actualDuration ?? 0;
      }

      // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
      treeBaseDuration += child.treeBaseDuration;
      child = child.sibling;
    }

    if (!didBailout) {
      completedWork.actualDuration = actualDuration;
    }
    completedWork.treeBaseDuration = treeBaseDuration;
  } else {
    while (child !== null) {
      newChildLanes = mergeLanes(
        newChildLanes,
        mergeLanes(child.lanes, child.childLanes),
      );

      // "Static" flags share the lifetime of the fiber/hook they belong to,
      // so we should bubble those up even during a bailout. All the other
      // flags have a lifetime only of a single render + commit, so we should
      // ignore them.
      subtreeFlags |= !didBailout
        ? child.subtreeFlags
        : child.subtreeFlags & StaticMask;
      subtreeFlags |= !didBailout ? child.flags : child.flags & StaticMask;

      // Update the return pointer so the tree is consistent. This is a code
      // smell because it assumes the commit phase is never concurrent with
      // the render phase. Will address during refactor to alternate model.
      child.return = completedWork;

      child = child.sibling;
    }
  }

  completedWork.subtreeFlags |= subtreeFlags;
  completedWork.childLanes = newChildLanes;

  return didBailout;
}

```

# Commit Stage

Startup cann't be interrupted until execution synchronization complete.

- BeforeMutation: Handle deletions(just dispatch 'beforeblur' event) and then execute corresponding method according to flag.
- Mutation:  Insert or append placementNode. Execute `recursivelyTraverseMutationEffects` and `commitReconciliationEffects` mainly and then execute other's method according to flag.
- Layout: Handle lifecycles for mount、updateQueue.callbacks and so on. Execute `recursivelyTraverseLayoutEffects` mainly and then execute other's method according to flag.

## BeforeMutation

```
function commitBeforeMutationEffects(
  root: FiberRoot,
  firstChild: Fiber,
){
  // ...
  // set global variable
  nextEffect = firstChild;
  // main task
  commitBeforeMutationEffects_begin();
  // ...
}

function commitBeforeMutationEffects_begin() {
  while (nextEffect !== null) {
    const fiber = nextEffect;

    // This phase is only used for beforeActiveInstanceBlur.
    // Let's skip the whole loop if it's off.
    if (enableCreateEventHandleAPI) {
      // TODO: Should wrap this in flags check, too, as optimization
      const deletions = fiber.deletions;
      if (deletions !== null) {
        for (let i = 0; i < deletions.length; i++) {
          const deletion = deletions[i];
          commitBeforeMutationEffectsDeletion(deletion);
        }
      }
    }

    const child = fiber.child;
    // DFS
    if (
      (fiber.subtreeFlags & BeforeMutationMask) !== NoFlags &&
      child !== null
    ) {
      child.return = fiber;
      nextEffect = child;
    } else {
      commitBeforeMutationEffects_complete();
    }
  }
}

function commitBeforeMutationEffects_complete() {
  while (nextEffect !== null) {
    const fiber = nextEffect;
    try {
      commitBeforeMutationEffectsOnFiber(fiber);
    } catch (error) {
      captureCommitPhaseError(fiber, fiber.return, error);
    }

    const sibling = fiber.sibling;
    // exist sibling, execute commitBeforeMutationEffects_begin
    if (sibling !== null) {
      sibling.return = fiber.return;
      nextEffect = sibling;
      return;
    }
    // none exist sibling, execute commitBeforeMutationEffects_complete
    nextEffect = fiber.return;
  }
}

function commitBeforeMutationEffectsOnFiber(finishedWork: Fiber) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;
  
  // handle SuspenseComponent
  if (enableCreateEventHandleAPI) {
    if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
      // Check to see if the focused element was inside of a hidden (Suspense) subtree.
      // TODO: Move this out of the hot path using a dedicated effect tag.
      if (
        finishedWork.tag === SuspenseComponent &&
        isSuspenseBoundaryBeingHidden(current, finishedWork) &&
        // $FlowFixMe[incompatible-call] found when upgrading Flow
        doesFiberContain(finishedWork, focusedInstanceHandle)
      ) {
        shouldFireAfterActiveInstanceBlur = true;
        beforeActiveInstanceBlur(finishedWork);
      }
    }
  }

  switch (finishedWork.tag) {
    case FunctionComponent: {
      if (enableUseEffectEventHook) {
        if ((flags & Update) !== NoFlags) {
          commitUseEffectEventMount(finishedWork);
        }
      }
      break;
    }
    case ClassComponent: {
      if ((flags & Snapshot) !== NoFlags) {
        if (current !== null) {
          const prevProps = current.memoizedProps;
          const prevState = current.memoizedState;
          const instance = finishedWork.stateNode;
          // We could update instance props and state here,
          // but instead we rely on them being set during last render.
          // TODO: revisit this when we implement resuming.

          const snapshot = instance.getSnapshotBeforeUpdate(
            finishedWork.elementType === finishedWork.type
              ? prevProps
              : resolveDefaultProps(finishedWork.type, prevProps),
            prevState,
          );
          instance.__reactInternalSnapshotBeforeUpdate = snapshot;
        }
      }
      break;
    }
    case HostRoot: {
      if ((flags & Snapshot) !== NoFlags) {
        if (supportsMutation) {
          const root = finishedWork.stateNode;
          clearContainer(root.containerInfo);
        }
      }
      break;
    }
    case HostComponent:
    case HostHoistable:
    case HostSingleton:
    case HostText:
    case HostPortal:
    case IncompleteClassComponent:
    case ForwardRef:
    case SimpleMemoComponent:
      // Nothing to do for these component types
      break;
    default: {
      if ((flags & Snapshot) !== NoFlags) {
        throw new Error(
          'This unit of work tag should not have side-effects. This error is ' +
            'likely caused by a bug in React. Please file an issue.',
        );
      }
    }
  }
}
```

## Mutation

```
function commitMutationEffects(
  root: FiberRoot,
  finishedWork: Fiber,
  committedLanes: Lanes,
) {
  inProgressLanes = committedLanes;
  inProgressRoot = root;

  commitMutationEffectsOnFiber(finishedWork, root, committedLanes);

  inProgressLanes = null;
  inProgressRoot = null;
}

function commitMutationEffectsOnFiber(
  finishedWork: Fiber,
  root: FiberRoot,
  lanes: Lanes,
) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

  // The effect flag should be checked *after* we refine the type of fiber,
  // because the fiber tag is more specific. An exception is any flag related
  // to reconciliation, because those can be set on all fiber types.
  switch (finishedWork.tag) {
    case xxx: {
      // handle deletions
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      // insert or append placement node
      commitReconciliationEffects(finishedWork);

      // According to flag, execute corresponding method
      // ...
    }
  }
}
```

## Layout

```
function commitLayoutEffects(
  finishedWork: Fiber,
  root: FiberRoot,
  committedLanes: Lanes,
): void {
  inProgressLanes = committedLanes;
  inProgressRoot = root;

  const current = finishedWork.alternate;
  // main task
  commitLayoutEffectOnFiber(root, current, finishedWork, committedLanes);

  inProgressLanes = null;
  inProgressRoot = null;
}

function commitLayoutEffectOnFiber(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
  // When updating this function, also update reappearLayoutEffects, which does
  // most of the same things when an offscreen tree goes from hidden -> visible.
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case xxx: {
        // WFS execute commitLayoutEffectOnFiber(sibling)
        recursivelyTraverseLayoutEffects(
          finishedRoot,
          finishedWork,
          committedLanes,
        );
        // According to flag, execute corresponding method
    }
  }
}

```
