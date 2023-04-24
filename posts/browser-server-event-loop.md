---
title: "EventLoop"
date: "2023-04-24"
category: "browser,server"
---

# 事件循环

**浏览器**

1. 执行所有同步任务
2. 执行所有微任务(Promise，MutationObserver，Fetch 基于 Promise)
3. 执行一个宏任务(定时器回调 / DOM 事件回调 / AJAX 回调)
4. 检查是否存在微任务
5. 存在跳转至 2，不存在跳转至 3。重复执行直到所有任务清空

**Node**

1. 执行所有同步任务
2. poll 阶段，I/O 操作等外部输入数据。如果 poll 队列不为空，则按顺序执行，如果为空并且没有其它异步任务，则一直等待
3. check 阶段，setImmediately
4. close callback 阶段，socket 关闭回调
5. timer 阶段，setTimeout,setInterval
6. I/O callback 阶段，处理一些上个循环少数未执行的 I/O 操作
7. prepare 阶段，闲置，nodejs 内部适用

当队列为空或者执行的回调函数数量到达系统阈值，就会进入下一个阶段。按照顺序反复运行

以上阶段不包括 Process.nextTick，Promise 等微任务，这些任务会放到单独的微任务队列中，微任务队列会在以上阶段执行之前清空
