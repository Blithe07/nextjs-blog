---
title: "File Upload"
date: "2023-04-30"
category: "interview"
---

## File Upload Scene

![File Upload](/images/file-upload.jpg)

- single file: use `input` element `accept` attribute to limit upload file's type
- multiple file: use `input` element `multiple` attribute to support upload multiple file
- directory: use `input` element `webkitdirectory` attribute to support upload file directory
- compressed directory: base on upload directory, use JSZip implement compressed directory
- drag: use drag event and DataTransfer object
- clipboard: use clipboard event and Clipboard Api
- large file partition: use Blob.slice、SparkMD5 and third library `async-pool`(describe it in a separate blog)
- server: use third library `form-data`

---

### Pre supplementary knowledge

1. Determine file type

   Actually, it's not accurate to distinguish file type by file suffix.We can identify the correct file type by reading the hexadecimal data of the file

   <table>
   <tr>
       <th>file type</th>
       <th>file suffix</th>
       <th>magic number</th>
   </tr>
   <tr>
       <td>JPEG</td>
       <td>jpg/jpeg</td>
       <td>0xFF D8 FF</td>
   </tr>
   <tr>
       <td>PNG</td>
       <td>png</td>
       <td>0x89 50 4E 47 0D 0A 1A 0A</td>
   </tr>
   <tr>
       <td>GIF</td>
       <td>gif</td>
       <td>0x47 49 46 38</td>
   </tr>
   <tr>
       <td>BMP</td>
       <td>bmp</td>
       <td>0x42 4D</td>
   </tr>
   </table>

   ```
   // read partial file info
   function readBuffer(file, start = 0, end = 2) {
     return new Promise((resolve, reject) => {
       const reader = new FileReader();
       reader.onload = () => {
         resolve(reader.result);
       };
       reader.onerror = reject;
       reader.readAsArrayBuffer(file.slice(start, end));
     });
   }
   // determine filt type
   function check(headers) {
     return (buffers, options = { offset: 0 }) =>
       headers.every(
         (header, index) => header === buffers[options.offset + index]
       );
   }

   // html code
   <div>
      选择文件：<input type="file" id="inputFile" accept="image/*"
                 onchange="handleChange(event)" />
      <p id="realFileType"></p>
   </div>

   // js code(only check PNG)
   const isPNG = check([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG图片对应的魔数
   const realFileElement = document.querySelector("#realFileType");

   async function handleChange(event) {
     const file = event.target.files[0];
     const buffers = await readBuffer(file, 0, 8);
     const uint8Array = new Uint8Array(buffers);
     realFileElement.innerText = `${file.name}文件的类型是：${
       isPNG(uint8Array) ? "image/png" : file.type
     }`;
   }
   ```

2. Drag

   - dragenter
   - dragover
   - dragleave
   - drop

   Base on above event, we can improve user experience. And then use `DataTransfer` object `files` attribute get fileList.

3. Clipboard
   ![Navigator Clipboard](/images/navigator-clipboard.jpg)
   - listen for container pasting event
   - read and parse clipboard content
   - build FormDATA object dynamic and upload

---

### Code implement

- Client File Upload

  ```
  /** html */
  // single file
  <input id="uploadFile" type="file" accept="image/*" />
  <button id="submit" onclick="uploadFile()">upload file</button>

  // multiple file
  <input id="uploadFile" type="file" accept="image/*" multiple />
  <button id="submit" onclick="uploadFile()">upload file</button>

  // directory
  <input id="uploadFile" type="file" accept="image/*" webkitdirectory />

  // drag(omit css)
  <div id="dropArea">
  <p>upload file by drag</p>
  <div id="imagePreview"></div>
  </div>

  // clipboard(omit css)
  <div id="uploadArea">
  <p>copy picture and paste</p>
  </div>


  /** js */
  const uploadFileEle = document.querySelector("#uploadFile");

  const request = axios.create({
  baseURL: "http://localhost:3000/upload",
  timeout: 60000,
  });

  // single file
  async function uploadFile() {
  if (!uploadFileEle.files.length) return;
  const file = uploadFileEle.files[0]; // 获取单个文件
  // 省略文件的校验过程，比如文件类型、大小校验
  upload({
      url: "/single",
      file,
  });
  }
  function upload({ url, file, fieldName = "file" }) {
  let formData = new FormData();
  formData.set(fieldName, file);
  request.post(url, formData, {
      // 监听上传进度
      onUploadProgress: function (progressEvent) {
      const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
      );
      console.log(percentCompleted);
      },
  });
  }

  // multiple file
  async function uploadFile() {
  if (!uploadFileEle.files.length) return;
  const files = Array.from(uploadFileEle.files);
  upload({
      url: "/multiple",
      files,
  });
  }
  function upload({ url, files, fieldName = "file" }) {
  let formData = new FormData();
  files.forEach((file) => {
      formData.append(fieldName, file);
  });
  request.post(url, formData, {
      // 监听上传进度
      onUploadProgress: function (progressEvent) {
      const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
      );
      console.log(percentCompleted);
      },
  });
  }

  // directory
  function upload({ url, files, fieldName = "file" }) {
  let formData = new FormData();
  files.forEach((file, i) => {
      formData.append(
      fieldName,
      files[i],
      files[i].webkitRelativePath.replace(/\//g, "@"); // special attribute, To ensure that @ koa/multer can handle the path of the file correctly, we need to perform special processing on the path
      );
  });
  request.post(url, formData); // 省略上传进度处理
  }

  // zip file
  function generateZipFile(
  zipName, files,
  options = { type: "blob", compression: "DEFLATE" }
  ) {
  return new Promise((resolve, reject) => {
      const zip = new JSZip();
      for (let i = 0; i < files.length; i++) {
      zip.file(files[i].webkitRelativePath, files[i]);
      }
      zip.generateAsync(options).then(function (blob) {
      zipName = zipName || Date.now() + ".zip";
      const zipFile = new File([blob], zipName, {
          type: "application/zip",
      });
      resolve(zipFile);
      });
  });
  }
  async function uploadFile() {
  let fileList = uploadFileEle.files;
  if (!fileList.length) return;
  let webkitRelativePath = fileList[0].webkitRelativePath;
  let zipFileName = webkitRelativePath.split("/")[0] + ".zip";
  let zipFile = await generateZipFile(zipFileName, fileList);
  upload({
      url: "/single",
      file: zipFile,
      fileName: zipFileName
  });
  }
  function upload({ url, file, fileName, fieldName = "file" }) {
  if (!url || !file) return;
  let formData = new FormData();
  formData.append(
      fieldName, file, fileName
  );
  request.post(url, formData); // 省略上传进度跟踪
  }

  // drag
  const dropAreaEle = document.querySelector("#dropArea");
  const imgPreviewEle = document.querySelector("#imagePreview");
  const IMAGE_MIME_REGEX = /^image\/(jpe?g|gif|png)$/i;
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropAreaEle.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
  });
  function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
  }
  ["dragenter", "dragover"].forEach((eventName) => {
      dropAreaEle.addEventListener(eventName, highlight, false);
  });
  ["dragleave", "drop"].forEach((eventName) => {
      dropAreaEle.addEventListener(eventName, unhighlight, false);
  });
  // 添加高亮样式
  function highlight(e) {
  dropAreaEle.classList.add("highlighted");
  }
  // 移除高亮样式
  function unhighlight(e) {
  dropAreaEle.classList.remove("highlighted");
  }
  dropAreaEle.addEventListener("drop", handleDrop, false);
  function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = [...dt.files];
  files.forEach((file) => {
      previewImage(file, imgPreviewEle);
  });
  files.forEach((file) => {
      // same to upload single file
      upload({
      url: "/single",
      file,
      });
  });
  }
  function previewImage(file, container) {
  if (IMAGE_MIME_REGEX.test(file.type)) {
      const reader = new FileReader();
      reader.onload = function (e) {
      let img = document.createElement("img");
      img.src = e.target.result;
      container.append(img);
      };
      reader.readAsDataURL(file);
  }
  }

  // clipboard
  const IMAGE_MIME_REGEX = /^image\/(jpe?g|gif|png)$/i;
  const uploadAreaEle = document.querySelector("#uploadArea");
  uploadAreaEle.addEventListener("paste", async (e) => {
  e.preventDefault();
  const files = [];
  if (navigator.clipboard) {
      let clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
          if (IMAGE_MIME_REGEX.test(type)) {
          const blob = await clipboardItem.getType(type);
          // same to drag previewImage
          previewImage(blob, uploadAreaEle);
          files.push(blob);
          }
      }
      }
  } else {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
          if (IMAGE_MIME_REGEX.test(items[i].type)) {
          let file = items[i].getAsFile();
          // same to drag previewImage
          previewImage(file, uploadAreaEle);
          files.push(file);
          }
      }
  }
  if (files.length > 0) {
      upload({
          url: "/multiple",
          files,
      });
  }
  })

  /** server */
  const path = require("path");
  const Koa = require("koa");
  const serve = require("koa-static");
  const cors = require("@koa/cors");
  const multer = require("@koa/multer");
  const Router = require("@koa/router");
  const fse = require("fs-extra");
  const app = new Koa();
  const router = new Router();
  const PORT = 3000;
  // 上传后资源的URL地址
  const RESOURCE_URL = `http://localhost:${PORT}`;
  // 存储上传文件的目录
  const UPLOAD_DIR = path.join(__dirname, "/public/upload");

  // single file/multiple file/zip file
  const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
      // 设置文件的存储目录
      cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
      // 设置文件名
      cb(null, `${file.originalname}`);
  },
  });

  // directory
  const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
      // images@image-1.jpeg => images/image-1.jpeg
      let relativePath = file.originalname.replace(/@/g, path.sep);
      let index = relativePath.lastIndexOf(path.sep);
      let fileDir = path.join(UPLOAD_DIR, relativePath.substr(0, index));
      // 确保文件目录存在，若不存在的话，会自动创建
      await fse.ensureDir(fileDir);
      cb(null, fileDir);
  },
  filename: function (req, file, cb) {
      let parts = file.originalname.split("@");
      cb(null, `${parts[parts.length - 1]}`);
  },
  });


  const multerUpload = multer({ storage });

  // single file/zip file
  router.post(
  "/upload/single",
  async (ctx, next) => {
      try {
      await next();
      ctx.body = {
          code: 1,
          msg: "文件上传成功",
          url: `${RESOURCE_URL}/${ctx.file.originalname}`,
      };
      } catch (error) {
      ctx.body = {
          code: 0,
          msg: "文件上传失败"
      };
      }
  },
  multerUpload.single("file")
  );

  // multiple file/directory
  router.post(
  "/upload/multiple",
  async (ctx, next) => {
      try {
      await next();
      urls = ctx.files.file.map(file => `${RESOURCE_URL}/${file.originalname}`);
      ctx.body = {
          code: 1,
          msg: "文件上传成功",
          urls
      };
      } catch (error) {
      ctx.body = {
          code: 0,
          msg: "文件上传失败",
      };
      }
  },
  multerUpload.fields([
      {
      name: "file", // 与FormData表单项的fieldName相对应
      },
  ])
  );


  // 注册中间件
  app.use(cors());
  app.use(serve(UPLOAD_DIR));
  app.use(router.routes()).use(router.allowedMethods());

  app.listen(PORT, () => {
  console.log(`app starting at port ${PORT}`);
  });
  ```

- Server File Upload

  Upload file from one server to other server. Utilize the functionality provided by the `form data` library on Github

  ```
  const fs = require("fs");
  const path = require("path");
  const FormData = require("form-data");
  const form1 = new FormData();
  form1.append("file", fs.createReadStream(path.join(__dirname, "images/image-1.jpeg")));
  form1.submit("http://localhost:3000/upload/single", (error, response) => {
    if(error) {
      console.log("upload error");
      return;
    }
    console.log("upload success");
  });
  ```
