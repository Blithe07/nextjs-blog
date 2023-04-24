---
title: "Curry"
date: "2023-04-24"
category: "javascript"
---

## curry

```
function curry() {
    const fn = arguments[0]
    const args = Array.prototype.slice.call(arguments, 1)
    function execute() {
        if (fn.length === args.length) {
            return fn.apply(null, args)
        }
    }
    // 判断第一次是否满足执行条件
    execute()
    function _curry() {
        args.push(...arguments)
        execute()
        return _curry
    }
    // 不满足传递函数继续收集参数
    return _curry
}
// usage
function add(a, b, c, d) {
    console.log(a + b + c + d)
}
curry(add, 1)(2)(3)(4)
```