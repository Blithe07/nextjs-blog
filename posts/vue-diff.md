---
title: "Vue3 Diff"
date: "2023-05-16"
category: "vue"
---

## Diff(easy)

A single pointer traverses new and old nodes from beginning to end, performing corresponding add, delete, and move operations.

```
function patchChildren(n1, n2, container){
    // ...other type
    if(Array.isArray(n2.children)){
        const oldChildren = n1.children
        const newChildren = n2.children

        let lastIndex = 0
        for(let i = 0; i < newChildren.length; i++){
            const newVNode = newChildren[i]
            let j = 0
            // record has reuse node in oldChildren
            let find = false
            for(j; j < oldChildren.length; j++){
                const oldVNode = oldChildren[j]
                if(newVNode.key === oldVNode.key){
                    find = true
                    patch(oldVNode, newVNode, container)
                    if(j < lastIndex){
                        const prevVNode = newChildren[i - 1]
                        if(prevVNode){
                            const anchor = prevVNode.el.nextSibling
                            // if anchor, insert newVNode.el before anchor
                            // else insert to the end of child list
                            insert(newVNode.el, container, anchor)
                        }
                    }else{
                        lastIndex = j
                    }
                }
            }

            // if find === false, mean that new node isn't exist in oldChildren
            if(!find){
                const prevVNode = newChildren[i - 1]
                let anchor = null
                if(prevVNode){
                    anchor = prevVNode.el.nextSibling
                }else{
                    anchor = container.firstChild
                }
                // mount newVNode
                patch(null, newVNode, container, anchor)
            }
        }

        // remove non-exist dom
        for(let i = 0; i < oldChildren.length; i++){
            const oldVNode = oldChildren[i]
            const has = newChildren.find(vnode => vnode.key === oldVNode.key)
            if(!has){
                unmount(oldVNode)
            }
        }
    }
}
```

## Diff(double ended)

Compare to easy diff, double ended diff use two pointers traverses new and old nodes to reduce dom operations.

```
function patchChildren(n1, n2, container){
    // ...other type
    if(Array.isArray(n2.children)){
        patchKeyedChildren(n1, n2, container)
    }
}

function patchKeyedChildren(n1, n2, container){
    const oldChildren = n1.children , newChildren = n2.children
    let oldStartIdx = 0 , oldEndIdx = oldChildren.length - 1 , newStartIdx = 0 , newEndIdx = newChildren.length - 1
    let oldStartVNode = oldChildren[oldStartIdx] , oldEndVNode = oldChildren[oldEndIdx] , newStartVNode = newChildren[newStartIdx] , newEndVNode = newChildren[newEndIdx]

    while(oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx){
        if(!oldStartVNode){
            // handle undefined
            oldStartVNode = oldChildren[++oldStartIdx]
        } else if(oldStartVNode.key === newStartVNode.key){
            // start - start
            patch(oldStartVNode, newStartVNode, container)

            oldStartVNode = oldChildren[++oldStartIdx]
            newStartVNode = newChildren[++newStartIdx]
        } else if(oldEndVNode.key === newEndVNode.key){
            // end - end
            patch(oldEndVNode, newEndVNode, container)

            oldEndVNode = oldChildren[--oldEndIdx]
            newEndVNode = newChildren[--newEndIdx]
        } else if(oldStartVNode.key === newEndVNode.key){
            // start - end
            patch(oldStartVNode, newEndVNode, container)

            insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling)

            oldStartVNode = oldChildren[++oldStartIdx]
            newEndVNode = newChildren[--newEndIdx]
        } else if(oldEndVNode.key === newStartVNode.key){
            // end - start
            patch(oldEndVNode, newStartVNode, container)

            insert(oldEndVNode.el, container, oldStartVNode.el)

            oldEndVNode = oldChildren[--oldEndIdx]
            newStartVNode = newChildren[++newStartIdx]
        } else {
            const idxInOld = oldChildren.findIndex(node => node.key === newStartVNode.key)
            if(idxInOld > 0){
                // find re-use node and it isn't the top node
                const vnodeToMove = oldChildren[idxInOld]
                patch(vnodeToMove, newStartVNode, container)

                insert(vnodeToMove.el, container, oldStartVNode.el)

                oldChildren[idxInOld] = undefined
            }else{
                // mount new node at the top
                //  newNode order: p4-p1-p2-p3
                //  oldNode order: p1-p3-p2
                patch(null, newStartVNode, container, oldStartVNode.el)
            }
            newStartVNode = newChildren[++newStartIdx]
        }
    }

    if(oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx){
        // exist new node
        // eg:
        //  newNode order: p4-p1-p2-p3
        //  oldNode order: p1-p2-p3
        for(let i = newStartIdx; i <= newEndIdx; i++){
            patch(null, newChildren[i], container, oldStartVNode.el)
        }
    } else if(newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx){
        // exist old node
        for(let i = oldStartIdx; i <= oldEndIdx; i++){
            unmount(oldChildren[i])
        }
    }
}
```

## Diff(fast)

Drawing inspiration from the plaintext Diff algorithm. (longest increasing subsequence)

```
function patchKeyedChildren(n1, n2, container){
    const newChildren = n2.children
    const oldChildren = n1.children

    let j = 0
    let oldVNode = oldChildren[j]
    let newVNode = newChildren[j]

    // traverse from start
    while(oldVNode.key === newVNode.key){
        patch(oldVNode, newVNode, container)

        j++
        oldVNode = oldChildren[j]
        newVNode = newChildren[j]
    }

    // traverse from end
    let oldEnd = oldChildren.length - 1
    let newEnd = newChildren.length - 1

    oldVNode = oldChildren[oldEnd]
    newVNode = newChildren[newEnd]

    while(oldVNode.key === newVNode.key){
        patch(oldVNode, newVNode, container)

        oldVNode = oldChildren[--oldEnd]
        newVNode = newChildren[--newEnd]
    }

    if(j > oldEnd && j<= newEnd){
        // exist new node
        const anchorIndex = newEnd + 1
        const anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null

        while(j <= newEnd){
            patch(null, newChildren[j++], container, anchor)
        }
    } else if(j > newEnd && j <= oldEnd){
        // exist old node
        while(j <= oldEnd){
            unmount(oldChildren[j++])
        }
    } else{
        // complex situation
        // find longest increasing subsequence
        const count = newEnd - j + 1
        const source = new Array(count)fill(-1)

        const oldStart = j
        const newStart = j

        // O(N^2)
        // for(let i = oldStart; i <= oldEnd; i++){
        //     const oldVNode = oldChildren[i]
        //     for(let k = newStart; k <= newEnd; k++){
        //         const newVNode = newChildren[k]
        //         if(oldVNode.key === newVNode.key){
        //             patch(oldVNode, newVNode, container)
        //             // record oldVNode index
        //             source[k - newStart] = i
        //         }
        //     }
        // }

        let moved = false
        // similar like easy diff
        let pos = 0

        // O(N)
        const keyIndex = {}
        for(let i = newStart; i <= newEnd; i++){
            keyIndex[newChildren[i].key] = i
        }

        // record updated node num
        // if updated > newChildren.length, unmount
        let patched = 0
        for(let i = oldStart; i <= oldEnd; i++){
            oldVNode = oldChildren[i]

            if(patched <= count){
                const k = keyIndex[oldVNode.key]
                if(k){
                    newVNode = newChildren[k]
                    patch(oldVNode, newVNode, container)
                    source[k - newStart] = i

                    if(k < pos){
                        moved = true
                    }else{
                        pos = k
                    }
                }else{
                    unmount(oldVNode)
                }
            }else{
                unmount(oldVNode)
            }
        }

        if(moved){
            const seq = getSequence(source) // get longest increasing subsequence

            let s = seq.length - 1
            let i = count - 1

            for(i; i >= 0; i--){
                if(source[i] === -1){
                    // mount
                    const pos = i + newStart
                    const newVNode = newChildren[pos]
                    const nextPos = pos + 1
                    const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null

                    patch(null, newVNode, container, anchor)
                }else if(i !== seq[s]){
                    // move
                    const pos = i + newStart
                    const newVNode = newChildren[pos]
                    const nextPos = pos + 1
                    const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null

                    insert(newVNode.el, container, anchor)
                }else {
                    s--
                }
            }
        }
    }
}

function getSequence(arr){
    const p = arr.slice()
    const result = [0]
    let i,j,u,v,c
    const len = arr.length
    for(let i = 0; i < len; i++){
        const cur = arr[i]
        if(cur !== 0){
            j = result.at(-1)
            if(arr[j] < cur){
                // record prev increasing index
                p[i] = j
                result.push(i)
                continue
            }
            u = 0
            v = reuslt.length - 1
            // find index that arr[index] >= cur or rightmost index
            while(u < v){
                c = (u + v) >> 1
                if(arr[result[c]] < cur){
                    u = c + 1
                }else {
                    v = c
                }
            }

            if(cur < arr[result[u]]){
                if(u > 0){
                    // record prev increasing index
                    p[i] = result[u - 1]
                }
                result[u] = i
            }
        }
    }

    u = result.length
    v = result[u - 1]
    while(u-- > 0){
        result[u] = v
        v = p[v]
    }

    return result
}
```
