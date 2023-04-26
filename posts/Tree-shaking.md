---
title: "Tree Shaking"
date: "2023-04-26"
category: "engineer"
---

## Tree-shaking Vs Dead Code Elimation

same: The purpose is to reduce code.   
difference: Implement way.   
    - DCE: Sweep dead code. Like making a cake, directly mix the egg and finally remove the eggshell from the prepared cake.   
    - Tree-shaking: Keep live code. Like making a cake, break the eggshell and mix something what we want.

## Old Tree-shaking

Early, Rollup support tree-shaking, but it doesn't do extra DCE. Only save the code which import from module in build result.

## Current Tree-shaking

> Tree-shaking, also known as Live Code Inclusion, refers to the process of Rollup eliminating unused code in project. It's a way of DCE, but it will be more effective than other methods in terms of output. The name is derived from the module's Abstract Syntax Tree. The algorithm first marks all relevant statements, and then removes all dead codes by shaking the syntax tree. It's similar in thought to the mark-sweep algorithm in GC. Although, the algorithm isn't limited to ES Modules, they make it more efficient because it allows Rollup to treat all modules together as one big abstract syntax tree with shared bindings.

- Use **ES Module** analysic module situation statically and save Live Code.
- Clean Dead Code which none executed and none side effect.
