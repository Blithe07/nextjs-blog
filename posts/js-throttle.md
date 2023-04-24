---
title: "Throttle"
date: "2023-04-24"
category: "javascript"
---

## throttle

```
// 1.时间戳实现
function throttleByTimeStamp(cb, wait) {
    let time = 0
    let args = null
    return function () {
        args = arguments
        const now = new Date()
        if (now - time > wait) {
            cb.apply(null, args)
            time = now
        }
    }
}
// 2.定时器实现
function throttleByTimer(cb, wait) {
    let timer
    return function (...args) {
        if (!timer) {
            cb(...args)
            timer = setTimeout(() => timer = null, wait)
        }
    }
}
```