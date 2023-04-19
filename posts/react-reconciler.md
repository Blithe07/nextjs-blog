---
title: "Source tour of 'beginWork' and 'completeWork'"
date: "2023-04-19"
category: "react"
---

The second stage work of Render is reconciler. It contains beginWork and completeWork.

- beginWork: According to current fiberNode, generate next fiberNode and then mark flags
- completeWork: According to wip.tag, create element or mark the update status of element and then handle flags bubble

![react reconciler](/public/images/react-reconciler.png)

## beginWork

![react reconciler beginWork](/public/images/react-reconciler-beginWork.png)

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

![react reconciler completeWork](/public/images/react-reconciler-completeWork.png)

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
4. bubbleProperties. flags bubble

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
