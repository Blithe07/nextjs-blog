---
title: "Download Source"
date: "2023-04-28"
category: "browser"
---

There are two ways of donwload source from web server or cdn.
- <a>tag
- window.open

## <a>

Browser will open a new tab to show the source which it recognizes such as images,video or pdf.   

Adding `download` attribute to the <a> tag allows browser to interpret it as download instead of open.   

### Tips for `download` attribute

This attribute only applies to same-origin URL. So if set web url as a `src` attribute in <a> tag, `download` attribute will have no effect.

Solution
```
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <!--解决img标签不能展示网络图片的问题-->
        <meta name="referrer" content="no-referrer">
        <!--代替import axios from 'axios'语句-->
        <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
        <title></title>
    </head>

    <script>

//        import axios from 'axios'
        /**
         * 下载文件
         * @param url 文件url
         * @param fileName
         */
        function downloadByURL(url,fileName) {
              axios
                .get(url, {
                        responseType: 'blob'
                    })
              .then(response => {
                  data = response.data
                if (!data) return

                const blob = new Blob([data], {type: "image/png"})
                const link = document.createElement("a")    // 创建<a>标签
                link.style.display = "none"        // 隐藏<a>标签
                link.href = URL.createObjectURL(blob)        // 根据二进制流对象生成一个url，这个url是我们自己站点可访问的url，没有禁止跨域的限制
                link.download = fileName // 这里填保存成的文件名
                link.click()    //强制触发a标签事件
                URL.revokeObjectURL(link.href)
                link.remove();
              });
        }
    </script>
    <body>
        <img src = "https://img2020.cnblogs.com/blog/1456655/202110/1456655-20211004112059587-1817640282.png" alt = "cdn和对象存储"/>
        <a href = "#" onclick="downloadByURL('https://img2020.cnblogs.com/blog/1456655/202110/1456655-20211004112059587-1817640282.png','cdn.png')">点击下载图片</a>
    </body>
</html>
```

## window.open

[Window.open Usage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/open#%E8%AF%AD%E6%B3%95)
