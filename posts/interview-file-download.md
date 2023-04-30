---
title: "File Download"
date: "2023-04-30"
category: "interview"
---

## File Download Scene

Use `<a>`, `showSaveFilePicker` Api, `JSZip` and they are all base on Blob.

![Large File Download](images/file-download.jpg)

### a(HTMLElement)

```
function dataUrlToBlob(base64, mimeType) {
  let bytes = window.atob(base64.split(",")[1]);
  let ab = new ArrayBuffer(bytes.length);
  let ia = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i++) {
    ia[i] = bytes.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

// 保存文件
function saveFile(blob, filename) {
  const a = document.createElement("a");
  a.download = filename;
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href)
}
```

### showSaveFilePicker

Option as follow:

- excludeAcceptAllOption: boolean. default value is `false`. If `true`, `types` options will unuseful.
- types: Array<{ accept: {key: mimeType, value: list of filename extension}, description?: string}>
- suggestedName: string

```
async function saveFile(blob, filename) {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: "PNG file",
          accept: {
            "image/png": [".png"],
          },
        },
        {
          description: "Jpeg file",
          accept: {
            "image/jpeg": [".jpeg"],
          },
         },
      ],
     });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return handle;
  } catch (err) {
     console.error(err.name, err.message);
  }
}

function download() {
  if (!imgDataUrl) {
    alert("请先合成图片");
    return;
  }
  const imgBlob = dataUrlToBlob(imgDataUrl, "image/png");
  saveFile(imgBlob, "face.png");
}
```

**Tips: compatibility issue**

### JSZip

```
// html
<h3>Zip 下载示例</h3>
<div>
  <img src="../images/body.png" />
  <img src="../images/eyes.png" />
  <img src="../images/mouth.png" />
</div>
<button onclick="download()">打包下载</button

// js
const images = ["body.png", "eyes.png", "mouth.png"];
const imageUrls = images.map((name) => "../images/" + name);

async function download() {
  let zip = new JSZip();
  Promise.all(imageUrls.map(getFileContent)).then((contents) => {
    contents.forEach((content, i) => {
      zip.file(images[i], content);
    });
    zip.generateAsync({ type: "blob" }).then(function (blob) {
      // FileSaver Api(third library)
      saveAs(blob, "material.zip");
    });
  });
}

// 从指定的url上下载文件内容
function getFileContent(fileUrl) {
  return new JSZip.external.Promise(function (resolve, reject) {
    // 调用jszip-utils库提供的getBinaryContent方法获取文件内容
    JSZipUtils.getBinaryContent(fileUrl, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
```

### Download As Attachment

```
// attachment/file-server.js
const fs = require("fs");
const path = require("path");
const Koa = require("koa");
const Router = require("@koa/router");

const app = new Koa();
const router = new Router();
const PORT = 3000;
// attachment/static
const STATIC_PATH = path.join(__dirname, "./static/");

// http://localhost:3000/file?filename=mouth.png
router.get("/file", async (ctx, next) => {
  const { filename } = ctx.query;
  const filePath = STATIC_PATH + filename;
  const fStats = fs.statSync(filePath);
  ctx.set({
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename=${filename}`,
    "Content-Length": fStats.size,
  });
  ctx.body = fs.createReadStream(filePath);
});

// 注册中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    // ENOENT（无此文件或目录）：通常是由文件操作引起的，这表明在给定的路径上无法找到任何文件或目录
    ctx.status = error.code === "ENOENT" ? 404 : 500;
    ctx.body = error.code === "ENOENT" ? "文件不存在" : "服务器开小差";
  }
});
app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`应用已经启动：http://localhost:${PORT}/`);
});
```

### Base64

```
// client
function base64ToBlob(base64, mimeType) {
  let bytes = window.atob(base64);
  let ab = new ArrayBuffer(bytes.length);
  let ia = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i++) {
    ia[i] = bytes.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

async function download(filename) {
  const response = await request.get("/file", {
    params: {
      filename
    },
  });
  if (response && response.data && response.data.code === 1) {
    const fileData = response.data.data;
    const { name, type, content } = fileData;
    const imgBlob = base64ToBlob(content, type);
    saveAs(imgBlob, name);
  }
}

// server
const fs = require("fs");
const path = require("path");
const mime = require("mime");
const STATIC_PATH = path.join(__dirname, "./static/");
router.get("/file", async (ctx, next) => {
  const { filename } = ctx.query;
  const filePath = STATIC_PATH + filename;
  const fileBuffer = fs.readFileSync(filePath);
  ctx.body = {
    code: 1,
    data: {
      name: filename,
      type: mime.getType(filename),
      content: fileBuffer.toString("base64"),
    },
  };
});
```

### Chunked Download

Scene: Transferring a large amount of data, but the length of the response cannot be obtained before the request is processed completely.
Server: Transfer-Encoding(response header): chunked/gzip,chunked

```
// client
const chunkedUrl = "http://localhost:3000/file?filename=file.txt";

function download() {
  return fetch(chunkedUrl)
    .then(processChunkedResponse)
    .then(onChunkedResponseComplete)
    .catch(onChunkedResponseError);
}

function processChunkedResponse(response) {
  let text = "";
  let reader = response.body.getReader();
  let decoder = new TextDecoder();

  return readChunk();

  function readChunk() {
    // after read: { done: boolean, value: Uint8Array }
    return reader.read().then(appendChunks);
  }

  function appendChunks(result) {
    let chunk = decoder.decode(result.value || new Uint8Array(), {
      stream: !result.done,
    });
    console.log("已接收到的数据：", chunk);
    console.log("本次已成功接收", chunk.length, "bytes");
    text += chunk;
    console.log("目前为止共接收", text.length, "bytes\n");
    if (result.done) {
      return text;
    } else {
      return readChunk();
    }
  }
}

function onChunkedResponseComplete(result) {
  let blob = new Blob([result], {
    type: "text/plain;charset=utf-8",
  });
  saveAs(blob, "hello.txt");
}

function onChunkedResponseError(err) {
  console.error(err);
}

// server
router.get("/file", async (ctx, next) => {
  const { filename } = ctx.query;
  const filePath = path.join(__dirname, filename);
  ctx.set({
    "Content-Type": "text/plain;charset=utf-8",
  });
  ctx.body = fs.createReadStream(filePath);
});
```

### Range Download

Syntax as follow: 

    Range: <unit>=<range-start>-
    Range: <unit>=<range-start>-<range-end>
    Range: <unit>=<range-start>-<range-end>, <range-start>-<range-end>

```
// client
async function download() {
  try {
    let rangeContent = await getBinaryContent(
      "http://localhost:3000/file.txt",
       0, 100, "text"
    );
    const blob = new Blob([rangeContent], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, "hello.txt");
  } catch (error) {
    console.error(error);
  }
}

function getBinaryContent(url, start, end, responseType = "arraybuffer") {
  return new Promise((resolve, reject) => {
    try {
      let xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.setRequestHeader("range", `bytes=${start}-${end}`);
      xhr.responseType = responseType;
      xhr.onload = function () {
        resolve(xhr.response);
      };
        xhr.send();
    } catch (err) {
        reject(new Error(err));
    }
  });
}

// server
const Koa = require("koa");
const range = require("koa-range");
const app = new Koa();
app.use(range);
```

### Large File Download(describe it in a separate blog)
