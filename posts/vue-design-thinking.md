---
title: "Framework design from global perspective"
date: "2023-04-18"
category: "vue"
---

## imperative and declarative

imperative code(focus on process)

```
const div = document.querySelector('#app)
div.innerText = 'hello world'
div.addEventListener('click',()=>{alter('ok')})
```

declarative code(focus on result)

```
<div @click="()=>{alter('ok')}">hello world</div>
```

so Vue.js internal implementation is imperative, expose to user is declarative.

## The trade off between performance and maintainability

First, the performance of declarative is lower than imperative.

- imperative: update consumption
- declarative: update consumption + find diff consumption

so Vue.js select declarative to keep maintainability and make performance consumption minimize.

## virtual dom performance

In theory, the update performance by use virtual dom isn't better than native js operate dom. But it's hard to write prefect imperative code and unnecessary.

```
low                                                                 high
------------------------------------------------------------------------
innerHTML               virtual dom                 native js

middle pressure         low pressure                high pressure
low performance         high maintainability        low maintainability
                        good performance            high performance
```

## runTime and compileTime

Three choices of design framework: runTime, runTime + compileTime, compileTime.
- runTime: no compile process, can't analysis the content which user provide.
- runTime + compileTime: support user provide data object and html string.
- compileTime: complie html string to imperative code directly, lack of flexibility.

so Vue.js select runTime + compileTime and make the performance isn't inferior to compileTime.