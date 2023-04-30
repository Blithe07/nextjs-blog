---
title: "Large File Upload"
date: "2023-04-30"
category: "interview"
---

## Main Process

Use the Blob. slice method to cut large files according to the specified size, and then upload them in blocks through multiple threads. After all blocks are successfully uploaded, notify the server to merge the blocks.

![Large File Upload](/images/large-file-upload.jpg)

## Code Implement

- client code

  ```
  function calcFileMD5(file) {
    return new Promise((resolve, reject) => {
      let chunkSize = 2097152, // 2M
        chunkNum = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5.ArrayBuffer(),
        fileReader = new FileReader();

        fileReader.onload = (e) => {
          spark.append(e.target.result);
          currentChunk++;
          if (currentChunk < chunkNum) {
            loadNext();
          } else {
            resolve(spark.end());
          }
        };

        fileReader.onerror = (e) => {
          reject(fileReader.error);
          reader.abort();
        };

        function loadNext() {
          let start = currentChunk * chunkSize,
            end = start + chunkSize >= file.size ? file.size : start + chunkSize;
          fileReader.readAsArrayBuffer(file.slice(start, end));
        }
        loadNext();
    });
  }

  /**
  * @param poolLimit     restricted concurrency
  * @param array         task array
  * @param iteratorFn    implement processing of each task item
  */
  async function asyncPool(poolLimit, array, iteratorFn) {
    const ret = []; // 存储所有的异步任务
    const executing = []; // 存储正在执行的异步任务
    for (const item of array) {
      // 调用iteratorFn函数创建异步任务
      const p = Promise.resolve().then(() => iteratorFn(item, array));
      ret.push(p); // 保存新的异步任务

      // 当poolLimit值小于或等于总任务个数时，进行并发控制
      if (poolLimit <= array.length) {
        // 当任务完成后，从正在执行的任务数组中移除已完成的任务
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e); // 保存正在执行的异步任务
        if (executing.length >= poolLimit) {
          await Promise.race(executing); // 等待较快的任务执行完成
        }
      }
    }
    return Promise.all(ret);
  }

  const request = axios.create({
    baseURL: "http://localhost:3000/upload",
    timeout: 10000,
  });
  // Check if the file has been uploaded. If it already exists, send it in seconds. Otherwise, return the list of uploaded block IDs
  function checkFileExist(url, name, md5) {
    return request.get(url, {
      params: {
        name,
        md5,
      },
    }).then((response) => response.data);
  }

  function upload({
    url, file, fileMd5,
    fileSize, chunkSize, chunkIds,
    poolLimit = 1,
  }) {
    const chunks = typeof chunkSize === "number" ? Math.ceil(fileSize / chunkSize) : 1;
    return asyncPool(poolLimit, [...new Array(chunks).keys()], (i) => {
      if (chunkIds.indexOf(i + "") !== -1) { // 已上传的分块直接跳过
        return Promise.resolve();
      }
      let start = i * chunkSize;
      let end = i + 1 == chunks ? fileSize : (i + 1) * chunkSize;
      const chunk = file.slice(start, end); // 对文件进行切割
      return uploadChunk({
        url,
        chunk,
        chunkIndex: i,
        fileMd5,
        fileName: file.name,
      });
    });
  }

  function uploadChunk({ url, chunk, chunkIndex, fileMd5, fileName }) {
    let formData = new FormData();
    formData.set("file", chunk, fileMd5 + "-" + chunkIndex);
    formData.set("name", fileName);
    formData.set("timestamp", Date.now());
    return request.post(url, formData);
  }

  // notify server to perform block merging operation
  function concatFiles(url, name, md5) {
    return request.get(url, {
      params: {
        name,
        md5,
      },
    });
  }

  // usage
  async function uploadFile() {
    if (!uploadFileEle.files.length) return;
    const file = uploadFileEle.files[0]; // 获取待上传的文件
    const fileMd5 = await calcFileMD5(file); // 计算文件的MD5
    const fileStatus = await checkFileExist(  // 判断文件是否已存在
      "/exists",
      file.name, fileMd5
    );
    if (fileStatus.data && fileStatus.data.isExists) {
      alert("文件已上传[秒传]");
      return;
    } else {
      await upload({
        url: "/single",
        file, // 文件对象
        fileMd5, // 文件MD5值
        fileSize: file.size, // 文件大小
        chunkSize: 1 * 1024 * 1024, // 分块大小
        chunkIds: fileStatus.data.chunkIds, // 已上传的分块列表
        poolLimit: 3, // 限制的并发数
       });
    }
    await concatFiles("/concatFiles", file.name, fileMd5);
  }
  ```

- server code

  ```
  const fs = require("fs");
  const path = require("path");
  const util = require("util");
  const Koa = require("koa");
  const cors = require("@koa/cors");
  const multer = require("@koa/multer");
  const Router = require("@koa/router");
  const serve = require("koa-static");
  const fse = require("fs-extra");

  const readdir = util.promisify(fs.readdir);
  const unlink = util.promisify(fs.unlink);
  const app = new Koa();
  const router = new Router();
  const TMP_DIR = path.join(__dirname, "tmp"); // 临时目录
  const UPLOAD_DIR = path.join(__dirname, "/public/upload"); // 文件目录
  const IGNORES = [".DS_Store"]; // 忽略的文件列表
  const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        let fileMd5 = file.originalname.split("-")[0];
        const fileDir = path.join(TMP_DIR, fileMd5);
        await fse.ensureDir(fileDir);
        cb(null, fileDir);
    },
    filename: function (req, file, cb) {
        let chunkIndex = file.originalname.split("-")[1];
        cb(null, `${chunkIndex}`);
    },
  });
  const multerUpload = multer({ storage });
 
  router.get("/upload/exists", async (ctx) => {
    const { name: fileName, md5: fileMd5 } = ctx.query;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const isExists = await fse.pathExists(filePath);
    if (isExists) {
        ctx.body = {
            status: "success",
            data: {
                isExists: true,
                url: `http://localhost:3000/${fileName}`,
            },
        };
    } else {
      let chunkIds = [];
      const chunksPath = path.join(TMP_DIR, fileMd5);
      const hasChunksPath = await fse.pathExists(chunksPath);
      if (hasChunksPath) {
          let files = await readdir(chunksPath);
          chunkIds = files.filter((file) => IGNORES.indexOf(file) === -1);
      }
      ctx.body = {
          status: "success",
          data: {
              isExists: false,
              chunkIds,
          },
      };
    }
  });

  router.post("/upload/single",multerUpload.single("file"),
    async (ctx, next) => {
        ctx.body = {
            code: 1,
            data: ctx.file,
        };
    }
  );

  router.get("/upload/concatFiles", async (ctx) => {
    const { name: fileName, md5: fileMd5 } = ctx.query;
    await concatFiles(
        path.join(TMP_DIR, fileMd5),
        path.join(UPLOAD_DIR, fileName)
    );
    ctx.body = {
        status: "success",
        data: {
            url: `http://localhost:3000/${fileName}`,
        },
    };
  });

  async function concatFiles(sourceDir, targetPath) {
    const readFile = (file, ws) => new Promise((resolve, reject) => {
        fs.createReadStream(file)
        .on("data", (data) => ws.write(data))
        .on("end", resolve)
        .on("error", reject);
    });
    const files = await readdir(sourceDir);
    const sortedFiles = files.filter((file) => IGNORES.indexOf(file) === -1).sort((a, b) => a - b);
    const writeStream = fs.createWriteStream(targetPath);
    for (const file of sortedFiles) {
        let filePath = path.join(sourceDir, file);
        await readFile(filePath, writeStream);
        await unlink(filePath); // 删除已合并的分块
    }
    writeStream.end();
  }
  // 注册中间件
  app.use(cors());
  app.use(serve(UPLOAD_DIR));
  app.use(router.routes()).use(router.allowedMethods());
  app.listen(3000, () => {
    console.log("app starting at port 3000");
  });

  ```
