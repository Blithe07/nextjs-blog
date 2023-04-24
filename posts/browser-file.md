---
title: "Browser File"
date: "2023-04-24"
category: "browser"
---

# File(浏览器)

**介绍**

- 由于 H5 之前客户端需要发送图片到服务器并通过服务器返回的 url 才能进行图片的访问，影响性能的同时，对用户体验也不友好。因此 H5 新增 FIleAPi（File，FileList，FileReader，Blob），允许 js 读取本地文件

**File 对象**

1. 继承于 Blob 对象，提供只读文件属性
2. 提供构造方法，new File(arr,name,options:{type,lastModified})

**FileList 对象**

1. 类数组对象

**FileReader 对象**

1. 读取文件内容，提供构造函数以及对应实例方法，事件
2. 实现原生 input 文件上传显示图片：通过 FileReader 实例的 readAsDataURL 方法得到 base64 字符串，并将其设置到 img 标签的 src 属性上
3. 扩展：通过 label 标签扩大点击范围的特性，可用 `<input type="file" />`配合其它元素搭配 CSS 实现 element 上传组件

**File System Access API**

1. File API 只能实现本地读取，File System Access API 可实现读写文件操作
2. 兼容性不好
