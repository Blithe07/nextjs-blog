---
title: "CSS Virtual List"
date: "2023-04-24"
category: "css"
---

# CSS 实现虚拟列表

content-visibility: auto (实现懒加载数据) + contain-intrinsic-size:'200px'(解决滚动条问题)

优点：

- 通过 CSS 即可降低 render 时间

缺点：

- 当数据量小或者显示内容少的时候，渲染速度甚至变慢
- 兼容性不好
- 渲染 dom 数量与数据量一致
