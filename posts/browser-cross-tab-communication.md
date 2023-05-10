---
title: "Cross Tab Communication"
date: "2023-04-24"
category: "browser"
---

# 跨标签页通信(浏览器)

1. BroadCast Channel   
   1. window 自带类(new BroadCastChannel('xxx'))，需要同源   
   2. 发送方调用 BroadCastChannel.postMessage 方法发送消息，接收方调用 BroadCastChannel.onMessage 方法接受消息(数据来源:$event.data)
2. Service Worker   
   1. PWA 常用，类似代理服务器   
   2. 需要通过 navigator.serviceWorker.register('js file')注册安装，后续调用 then 方法执行注册成功的回调函数   
   3. 通过 navigator.serviceWorker.controller.postMessage 进行数据传输   
   4. 数据传输会传到 js file 中，js file 中通过 self.addEventListener('message'，async (event) => { await self.clients.matchAll() })获得所有注册的客户端   
   5. 获得到所有的客户端(Array)，遍历得到每个客户端并执行其 postMessage(event.data)传递到接收方   
   6. 接收方也需要进行注册，file 需要一致，并且调用 navigator.serviceWorker.onmessage 得到数据
3. LocalStorage   
   1. 通过 window.onstorage 监听数据变化。事件对象数据{key,oldValue,newValue,url,storageArea(Storage 对象信息)}
4. Shared Worker 定时器轮询   
   1. 特定类型 worker，需要同源   
   2. const worker = new SharedWorker('js file')，通过 worker.port.postMessage 进行消息推送   
   3. js file 中通过 self.onconnect 函数获取事件对象参数 e，e.ports[0]得到一个具备监听功能并具备发哦送消息的对象(类似 worker 实例)   
   4. port.onmessage = function(e) { if (e.data === 'get') { port.postMessage(变量)，清空变量(避免 setInterval 一直拿数据) } else { 变量保存 e.data } }实现 js file 的接收数据和传输数据   
   5. 接收方得到 worker 对象后，调用 worker.port.start()建立连接，再通过 setInterval 轮询调用 worker.port.postMessage('get') 进行消息获取，最后 worker.port.onmessage 接收数据(添加判断，当 data 有值才做对应逻辑操作)
5. IndexedDB 定时器轮询   
   1. 使用同一个数据库存放读取数据   
   2. 启用定时器轮询比较页面展示数据和数据库数据数量是否一致，不一致进行对应逻辑操作
6. cookie 定时器轮询   
   1. 启用定时器轮询比较上一次 cookie 数据和最新 cookie 数据是否一致，不一致进行对应逻辑操作
7. window.open window.postMessage   
   1. 页面 1 可通过 window.open 打开新窗口并得到页面 2 的引用   
   2. 在页面 1 中调用页面 2 的引用的 postMessage 方法进行消息发送，传递第二个参数 origin 为'\*'即可允许在页面 1 中调用页面 2 的 postMessage 方法   
   3. 页面 2 通过 addEventListener 监听 message 事件获取数据
8. Websocket   
   1. 服务端可主动向客户端推送数据   
   2. 页面 1 发送消息给服务器，服务器将数据推送给其它页面
