---
title: "Algorithm Union"
date: "2024-01-02"
category: "javascript"
---

## step

1. initialize. initialize the collection of the node to the identifier of node.
2. search. search the collection of two nodes. find the ancestor through recursion and then set the collection of all nodes along the way as ancestor node.
3. merge. merge two nodes to one collection if the collections of two nodes are difference.

## implement

```
// n: number of node
const fa = new Array(n)

function init(){
   for(let i = 1; i < n; i++){
    fa[i] = i
   } 
}

function find(node){
    if(node !== fa[node]){
        fa[node] = find(fa[node])
    }
    return fa[node]
}

function union(nodeA, nodeB){
    const ancestorA = find(nodeA)
    const ancestorB = find(nodeB)
    if(ancestorA !== ancestorB){
        fa[ancestorB] = ancestorA
    }
}
```

## analysis(Time Complexity)

n nodes、e edges => O(elogn)