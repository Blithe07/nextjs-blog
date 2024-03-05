---
title: "Browser Cache"
date: "2023-04-24"
category: "browser"
---

# http缓存

**优点**

1. 减少数据传输，节省网费
2. 减少服务器负担，提升网站性能
3. 加快客户端加载网页速度

---

**http1.0**

Expires 设置缓存过期时间。缺点：设置的是一个固定的时间点，客户端时间和服务端时间可能有误差

---

**http1.1 缓存规则**   

响应体中 Cache-Control 字段
1.  private：仅浏览器可以缓存
2.  public：浏览器和代理服务器都可以缓存
3.  max-age=xxx：过期时间(强缓存)
4.  no-cache：协商缓存
5.  no-store：不缓存

**强缓存**

1. 第一次请求 a.js ，缓存表中没该信息，直接请求后端服务器。
2. 后端服务器返回了 a.js ，且 http response header 中 cache-control 为 max-age=xxxx，所以是强缓存规则，存入缓存表中。
3. 第二次请求 a.js ，缓存表中是 max-age， 那么命中强缓存，然后判断是否过期，如果没过期，直接读缓存的 a.js，如果过期了，则执行协商缓存的步骤了。

**协商缓存**

##### 触发条件：

1. Cache-Control 的值为 no-cache
2. max-age 过期

##### 相关规则：

1. ETag：文件标识(response header)
2. Last-Modified：文件修改时间(response header)
3. If-None-Match：文件标识(request header)
4. If-Modified-Since：文件修改时间(request header)

##### 步骤：

1. 请求资源时，把本地的 If-None-Match 和 If-Modified-Since 带到服务端做比较
2. 如果变化了，返回 200，更新资源
3. 如果没变化，返回 304，直接取缓存   
   
---
![](/images/cache.png)


# 浏览器缓存

1. Storage

2. indexDB

3. 应用缓存   
    通过manifest文件来注册被缓存的静态资源（已经被废弃），缓存静态文件的同时，也会默认缓存html文件。这导致页面的更新只能通过manifest文件中的版本号来决定。所以，应用缓存只适合那种常年不变化的静态网站。

4. Service Worker   
    1. 工作原理：   
        * 后台线程：独立于当前网页线程   
        * 网络代理：在网页发起请求时代理，来缓存文件
    2. 使用条件：
        * Service Worker中涉及到请求拦截，所以必须使用HTTPS协议来保障安全   
    3. 使用：
        * 注册。

                navigator?.serviceWorker?.register(fileUrl) => return promise
        * installing。 
        
                监听install事件，回调函数中处理sw的开启，安装时，sw就开始缓存文件了，会检查所有文件的缓存状态，如果都已经缓存了，则安装成功，进入下一阶段。
        * activated。
        
                第一次加载sw，在安装后，会直接进入activated阶段，而如果sw进行更新，情况就会显得复杂一些。流程如下：首先老的sw为A，新的sw版本为B。B进入install阶段，而A还处于工作状态，所以B进入waiting阶段。只有等到A被terminated后，B才能正常替换A的工作。
                这个terminated的时机有如下几种方式：
                    1、关闭浏览器一段时间；
                    2、手动清除Service Worker；
                    3、在sw安装时直接跳过waiting阶段.

                监听activate事件，回调函数中处理CacheStorage中的缓存数据
        * idle

                空闲状态一般是不可见的
                浏览器会周期性的轮询，去释放处于idle的sw占用的资源

        * fetch

                监听fetch事件，回调函数中拦截代理所有指定的请求，并进行对应的操作
    4. 扩展：   
        原生sw比较繁琐和复杂，Workbox出现解决该问题，并且提供precache<支持跨域的cdn和域内静态资源,适合于上线后就不会经常变动的静态资源>和runtimecache<根据不同资源，确定不同缓存策略，workbox.strategies.xxx>两种缓存方式。



![](/images/sw-workflow.png)