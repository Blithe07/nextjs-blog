---
title: "Large File Download"
date: "2023-04-30"
category: "interview"
---

## Main Process

![Large File Download](/images/large-file-download.jpg)

## Code Implement

```
// client
function getContentLength(url) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open("HEAD", url);
    xhr.send();
    xhr.onload = function () {
      resolve(
        ~~xhr.getResponseHeader("Content-Length") 
      );
    };
    xhr.onerror = reject;
  });
}

function getBinaryContent(url, start, end, i) {
  return new Promise((resolve, reject) => {
    try {
      let xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.setRequestHeader("range", `bytes=${start}-${end}`); // 请求头上设置范围请求信息
      xhr.responseType = "arraybuffer"; // 设置返回的类型为arraybuffer
      xhr.onload = function () {
        resolve({
          index: i, // 文件块的索引
          buffer: xhr.response, // 范围请求对应的数据
        });
      };
      xhr.send();
    } catch (err) {
      reject(new Error(err));
    }
  });
}

function concatenate(arrays) {
  if (!arrays.length) return null;
  let totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
  let result = new Uint8Array(totalLength);
  let length = 0;
  for (let array of arrays) {
    result.set(array, length);
    length += array.length;
  }
  return result;
}

async function download({ url, chunkSize, poolLimit = 1 }) {
  const contentLength = await getContentLength(url);
  const chunks = typeof chunkSize === "number" ? Math.ceil(contentLength / chunkSize) : 1;
  const results = await asyncPool(
    poolLimit,
    [...new Array(chunks).keys()],
    (i) => {
      let start = i * chunkSize;
      let end = i + 1 == chunks ? contentLength - 1 : (i + 1) * chunkSize - 1;
      return getBinaryContent(url, start, end, i);
    }
  );
  const sortedBuffers = results
    .map((item) => new Uint8Array(item.buffer));
  return concatenate(sortedBuffers);
}

function multiThreadedDownload() {
  const url = document.querySelector("#fileUrl").value;
  if (!url || !/https?/.test(url)) return;
  console.log("多线程下载开始: " + +new Date());
  download({
    url,
    chunkSize: 0.1 * 1024 * 1024,
    poolLimit: 6,
  }).then((buffers) => {
    console.log("多线程下载结束: " + +new Date());
    saveAs({ buffers, name: "我的压缩包", mime: "application/zip" });
  });
}
```