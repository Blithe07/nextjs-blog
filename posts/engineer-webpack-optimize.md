---
title: "Webpack Practice Optimization"
date: "2023-04-30"
category: "engineer"
---

1. off productionSourceMap、css sourceMap in production

```
const isProduction = process.env.NODE_ENV === 'production' 
module.exports = {     
  productionSourceMap: !isProduction,
  css: {         
    sourceMap: !isProduction, 
  },     
}
```

2. analysis file by `webpack-bundle-analyzer`
```
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin  
module.exports = {     
   plugins: [             
      new BundleAnalyzerPlugin()         
   ]    
}
```

### Practical Cases

- component library on-demand loading
- use cdn load third js
    ```
    const isProduction = process.env.NODE_ENV === 'production'
    // 正式环境不打包公共js
    let externals = {}
    // 储存cdn的文件
    let cdn = {
        css: [],
        js: []
    }

    if (isProduction) {
        externals = {
            vue: 'Vue',
            'element-ui': 'ELEMENT',
            echarts: 'echarts',
        }
        cdn.js = [
            'https://cdn.bootcdn.net/ajax/libs/vue/2.6.11/vue.min.js', // vuejs
            'https://cdn.bootcdn.net/ajax/libs/element-ui/2.6.0/index.js', // element-ui js
            'https://cdn.bootcdn.net/ajax/libs/element-ui/2.6.0/locale/zh-CN.min.js',
            'https://cdn.bootcdn.net/ajax/libs/echarts/5.1.2/echarts.min.js',
        ]
    }
    module.exports = {
        configureWebpack: {
            // 常用的公共js 排除掉，不打包 而是在index添加cdn，
            externals, 
        },
        chainWebpack: config => {
            // 注入cdn变量 (打包时会执行,htmlWebpackPlugin)
            config.plugin('html').tap(args => {
                args[0].cdn = cdn // 配置cdn给插件
                return args
            })
        }    
    }
    ```
    ```
    <!DOCTYPE html>
        <head>
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width,initial-scale=1.0">
            <title>web</title>
            <link rel="icon" href="<%= BASE_URL %>favicon.ico">
            <!-- 引入样式 -->
            <% for(var css of htmlWebpackPlugin.options.cdn.css) { %>
               <link rel="stylesheet" href="<%=css%>" >
            <% } %>

            <!-- 引入JS -->
            <% for(var js of htmlWebpackPlugin.options.cdn.js) { %>
               <script src="<%=js%>"></script>
            <% } %>
        </head>
        <body style="font-size:14px">
            <section id="app"></section>
        </body>
    </html>
    ```
- lazy load
    ```
    download(){
        // 使用import().then()方式
        import("table2excel.js").then((Table2Excel) => {
            // 多了一层default
            new Table2Excel.default("#table").export('filename')  
        })
    }
    ```
- technical selection
- server(nginx startup static compress)