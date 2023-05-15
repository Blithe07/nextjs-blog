---
title: "React Diff"
date: "2023-04-23"
category: "react"
---

## Introduction

The stage of Render will generate FiberTree and the `diff` happened in it actually.  
`diff`: **compare with current FiberNode and JSX Object, and then generate new wip FiberNode.**  
> React -> `diff`   Vue -> `patch`

## Diff Limit

The time complexity of a complete comparison of the entire tree is O(n^3). So in order to reduce complexity, React set limit to the algorithm：
- Only find diff for same level element, otherwise none reuse.
- Only find diff for same tag element, otherwise destory element.
- Use `key` to keep element stable.

## Diff Single Node

Single Node means new Node's quantity is single, but not mean to old Node(maybe multi).  
Whether it can be reused follows the following process:
- Determine whether the `key` is same
  - If none `key` exist, key is null which is belong to equal situation.
  - If `key` same, jump to step 2.
  - If `key` difference, judge can not reuse.(if sibling exist, map sibling.)
- If `key` same, determine whether the `type` is same
  - If `type` same, reuse.
  - If `type` difference, judge can not reuse.(if sibling exist, mark sibling `delete` flag)

## Diff Multi Nodes

Multi Node means new Node's quantity is multi, but not mean to old Node(maybe single).  
React Team find the operation of update is more than `insert、delete、move` in daily development. So there are two traverse when diff multi nodes:
1. Try reuse node one by one.
2. Handle node which isn't finished at prev traverse. 

### First Traverse

Traverse from start to end, exist three situations:
- If the `key` and `type` of new and old nodes are same, mean can reuse.
- If the `key` of new and old nodes are same, but the `type` are difference. At this time, generate a new fiber and put old fiber into `deletions` array wait for delete together.(no break traverse)
- If the `key` of new and old nodes are difference, end the traverse.

### Second Traverse

In this traverse, mean to exist new React element or old fiberNode isn't traverse complete. And then exist three situations:
- Only remain old node, push them into `deletions` array delete directly.(situation of delete)
- Only remain new JSX element, create FiberNode(situation of insert)
- Remain new and old nodes, push them into a `map` array. Find node which can reuse(situation of move). If find none, insert it. And then if traverse end, exist fiberNode in `map`,push them into `deletions` wait for delete together.


## Double Ended Diff Algorithm

Use two pointers point to array start and end, move them closer to the middle.

But React didn't use this algorithm, because fiberNode don't exist back pointer. FiberNode only can traverse form start to end. And there are fewer scenarios where list inversion and double-ended search are required, so React Team live with hitting the bad case in for every insert or move.(If this method is not ideal, consider implementing double-ended diff in the future)
