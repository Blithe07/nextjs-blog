---
title: "Web Worker"
date: "2023-04-24"
category: "browser"
---

# web worker

**概述**

1. H5 推出该 API，可以让 web 应用具备后台能力，充分利用多 CPU 的优势，创建后台运行线程，避免阻塞。
2. 通过加载一个 js 文件进行复杂计算，通过 postMessage 和 onMessage 进行通信
3. 在 worker 中可调用 importScripts(urls)执行其它 js 脚本（逗号隔开）
4. 可使用定时器方法
5. 可使用 XMLHttpRequest 进行异步请求
6. 可访问 navigator 部分属性
7. 可使用 js 核心对象
8. 不能跨域加载 js 以及访问 DOM
9. 没有 JSONP 和 Ajax 高效
