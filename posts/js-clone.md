---
title: "Clone"
date: "2023-04-24"
category: "javascript"
---

## clone

```
function deepClone(target) {
    let result
    if (typeof target === 'object') {
        if (Array.isArray(target)) {
            result = []
            for (const item of target) {
                result.push(deepClone(item))
            }
        } else if (target === null) {
            result = null
        } else if (target.constructor === Date || target.constructor === RegExp) {
            result = target
        } else {
            result = {}
            for (const key in target) {
                result[key] = deepClone(target[key])
            }
        }
    } else {
        result = target
    }
    return result
}
```