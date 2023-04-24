---
title: "WebSocket"
date: "2023-04-24"
category: "browser"
---

# WebSocket

**简介**

1. 单个 TCP 连接上进行全双工通信的协议，使数据交换简单，允许服务端向客户端推送数据
2. 只需完成握手即可创建持久性连接，并进行双向数据传输
3. 计算机网络应用层协议，弥补 HTTP 协议的不足

**特点**

1. 建立在 TCP 协议
2. 与 HTTP 协议有着良好的兼容性。默认端口也是 80 和 443，并且握手阶段采用 HTTP 协议，因此握手时不容易屏蔽，能通过各种 HTTP 代理服务器
3. 数据格式简单，性能开销小，通信高效
4. 可以发送文本，也可以发送二进制数据
5. 没有同源限制，客户端可以与任意服务器通信
6. 协议标识符是 ws（如果加密，则为 wss），服务器网址就是 URL

**原理**
具体实现上是通过 http 协议建立通道，然后在此基础上用真正 WebSocket 协议进行通信  
额外请求字段：

- Upgrade: websocket
- Connection: Upgrade
- Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==
- Sec-WebSocket-Protocol: chat, superchat
- Sec-WebSocket-Version: 13

额外响应字段：

- Upgrade: websocket
- Connection: Upgrade
- Sec-WebSocket-Accept:HSmrc0sMlYUkAGmm5OPpG2HaGWk=
- Sec-WebSocket-Protocol: chat

**过程**

1. 客户端发起 http 请求，经过 3 次握手后，建立起 TCP 连接；http 请求里存放 WebSocket 支持的版本号等信息，如：Upgrade、Connection、WebSocket-Version 等；
2. 服务器收到客户端的握手请求后，同样采用 HTTP 协议回馈数据；
3. 客户端收到连接成功的消息后，开始借助于 TCP 传输信道进行全双工通信。
