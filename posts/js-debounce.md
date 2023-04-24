---
title: "Debounce"
date: "2023-04-24"
category: "javascript"
---

## debounce

```
function debounce(cb, wait) {
    var timer = null
    return function (...args) {
        if (timer) {
            clearTimeout(timer)
        }
        timer = setTimeout(() => cb(...args), wait)
    }
}
```