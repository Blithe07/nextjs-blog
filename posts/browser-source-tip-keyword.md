---
title: "Source Tip Keyword"
date: "2023-04-24"
category: "browser"
---

# 资源提示关键词

由于浏览器渲染页面 JS 会阻塞进程渲染 DOM，CSS 虽然不会阻塞 DOM，但是会阻塞 JS(JS 可能会改变 CSS 属性)，导致延迟渲染。因此最佳实践是 CSS 写在 head 中，JS 写在 Body 尾。

现代浏览器提供 **_资源提示关键词_** 大幅度加载页面加载速度

1. defer 和 async   
   1. async:加载后续文档元素的过程和 js 并行执行(异步)，加载完直接阻塞后续 DOM 构建，执行 JS   
   2. defer:加载后续文档元素的过程和 js 并行执行(异步)，加载完等待 DOM 构建完成后，执行 JS
2. preload   
   1. 使用 link 标签将 rel 属性设置为 preload，实现预加载，通过 as 属性指定要加载的文件类型(style/script)，通过 href 属性指定加载文件路径   
   2. 常用于加载首页，加载完必不会立马使用该资源
3. prefetch   
   1. 利用浏览器空闲时间加载资源，用于加载非首页资源，加快后续页面首屏渲染速度。用法与 preload 一致   
   2. 当跳转至被标记为 prefetch 的页面未预加载完时不会被中断，会继续完成该请求的加载   
   3. 除了常用的 prefetch 值，还提供 rel = "dns-prefetch"，加速 DNS 寻址事件，常用于字体以及 CDN 之类的东西
4. prerender   
   1. 与 preload 用法一致，收集用户后续可能使用页面并渲染待
5. preconnect   
   1. 提前建立浏览器与服务器的连接，省去 DNS,TCP 等建立事件耗时   
   2. 与 preload 用法一致，crossorigin 属性允许携带 cookie
