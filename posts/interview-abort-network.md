---
title: "Abort NetWork Request"
date: "2023-04-30"
category: "interview"
---

## AbortController

Controller object that can terminate one or more web requests as needed.

- AbortController(): return a new AbortController object instance
- signal: return an AbortSignal object instance that note web request info
- abort(): terminate a web request that unfinish(for fetch)

**Tips: compatibility issue**

## Axios interrupt request

### Method 1

```
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

axios.get('https://mdn.github.io/dom-examples/abort-api/sintel.mp4', {
  cancelToken: source.token
}).catch(function (thrown) {
  // 判断请求是否已中止
  if (axios.isCancel(thrown)) {
    // 参数 thrown 是自定义的信息
    console.log('Request canceled', thrown.message);
  } else {
    // 处理错误
  }
});

// 取消请求（message 参数是可选的）
source.cancel('Operation canceled by the user.');
```


### Method 2

```
const CancelToken = axios.CancelToken;
let cancel;

axios.get('/user/12345', {
  cancelToken: new CancelToken(function executor(c) {
    // executor 函数接收一个 cancel 函数作为参数
    cancel = c;
  })
});

// 取消请求
cancel('Operation canceled by the user.');
```