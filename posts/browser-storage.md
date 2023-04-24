---
title: "Browser Storage"
date: "2023-04-24"
category: "browser"
---

# 本地存储

**Cookie**

1. 作用：解决 HTTP 协议无状态特性的问题
2. 缺陷：
   1. 安全问题：Cookie 在每次请求中都会被发送，如果不使用 HTTPS 并对其加密，其保存的信息很容易被窃取，导致安全风险
   2. 只能存储 4kb 数据
   3. 增加带宽占用
3. 使用场景：第三方 cookie(a,b 网站都嵌入同一个图片广告，该图片发送请求到该服务器，服务器返回消息并设置 cookie，第二次请求时，发现本地已存在该服务器发送的 cookie，会将重复的 cookie 发送回去。因此 a,b 网站跳转页面一致)
4. 配置：
   1. SameSite，默认(Lax)仅允许本站及子站访问 cookie。因此设置第三方 cookie 需要将 SameSite 设置为 None
   2. HttpOnly，禁止使用 JS 访问 cookie
   3. Secure，只允许 Cookie 在 HTTPS 请求中被使用
5. 由 cookie 造成的隐患：
   1. XSS 攻击，通过恶意脚本获取 cookie 信息，可通过 HttpOnly 避免 (高版本浏览器可通过自带的Sanitizer Api去预防XSS)
   2. CSRF 攻击，跨站请求伪造，访问到恶意网站，恶意网站可通过表单提交(允许跨域)的方式传递 cookie 信息(cookie 自动发送)并做恶意操作

**LocalStorage**

1. 作用：存储空间更多(10MB)，解决 CSRF 问题(将服务器提供的 token 保存到 localStorage 中，每次请求的时候从中取出并配合 HTTPS 连接传输，避免泄露)
2. 缺点：
   1. 无法设置过期时间
   2. 只能存入字符串(可配合 JSON 提供的方法解决，但 JSON.stringify 不能转换 undefined，Function，RegExp，Date，Symbol)

**IndexedDB**

1. 作用：
   1. 储存量理论上没有上限(硬盘可用空间的三分之一)
   2. 所有操作都是异步的，相比 LocalStorage 同步操作性能更高，尤其是数据量较大时
   3. 原生支持储存 JS 的对象
   4. 正经的数据库，意味着数据库能干的事它都能干
2. 缺点：
   1. 操作非常繁琐
   2. 需要具备数据库相关知识
3. 基操：
   1. window.indexedDB.open(库名，没有则会创建)，得到数据库类;
   2. 数据库类上存在事件，函数中传递 event 对象，可从中获取实例
      - onupgradeneeded 在版本改变时触发(event.target.result)
        注意首次连接数据库时，版本从 0 变成 1，因此也会触发，且先于 onsuccess，且表的创建也只能在该阶段
      - onsuccess 在连接成功后触发(event.result)
      - onerror 在连接失败时触发
      - onblocked 在连接被阻止的时候触发，比如打开版本低于当前存在的版本
   3. 得到数据库实例
