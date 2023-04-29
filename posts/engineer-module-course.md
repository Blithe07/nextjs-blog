---
title: "Module Course"
date: "2023-04-28"
category: "engineer"
---

## Module Solution

### Function

There is no guarantee that they won't have naming conflicts with other modules, and there is no direct relationship between module members, which will still cause trouble for later maintenance.

```
function fn1(){};
function fn2(){};
function fn3(){
  fn1();
  fn2();
};
```

### Namespace

The problem with naming conflicts was fixed, but a new problem appeared. The module name can be set externally.

```
var myModule = {
  name: "isboyjc",
  getName: function (){
    console.log(this.name)
  }
  xxx: function(){}
}
```

### IIFE

Use the featureof function closures to implement private data and shared methods.

```
var myModule = (()=>{
  const name = "moduleName";
  const getName = ()=>{console.log(name)};
  return {getName}
})()

// Usage: myModule.getName()

// If depend on other module, use param
var otherModule = (function(){
  return {
    a: 1,
    b: 2
  }
})()
var mainModule = (function(other) {
  var name = 'isboyjc'
  
  function getName() {
    console.log(name)
    console.log(other.a, other.b)
  }
  
  return { getName } 
})(otherModule)
```

### Dependency Indection

We need a dependency registrar to help us solve the following problems:
- Implement dependency register
- Accept dependency and output a function that can get all resources
- Keep the scope of the passed function
- The passed function can receive custom parameters

```
let injector = {
  dependencies: {},
  register: function(key, value) {
    this.dependencies[key] = value;
  },
  resolve: function(deps, func, scope) {
    var args = [];
    for(var i = 0; i < deps.length, d = deps[i]; i++) {
      if(this.dependencies[d]) {
        // 存在此依赖
        args.push(this.dependencies[d]);
      } else {
        // 不存在
        throw new Error('不存在依赖：' + d);
      }
    }
    return function() {
      func.apply(scope || {}, args.concat(Array.prototype.slice.call(arguments, 0)));
    }   
  }
}

// Usage
injector.register('fnA', fnA)
injector.register('fnB', fnB)
(injector.resolve(['fnA', 'fnB'], function(fnA, fnB, str){
  let a = fnA()
  let b = fnB()
  console.log(a, b, str)
}))('isboyjc')
```

### CommonJS

The CommonJS specification stipulates that each file is an independent module with its own scope. The variables, functions, and classes of the module are all private. If you want to call them externally, you must use `module.exports` to actively expose them. In another file For reference, use `require(path)` directly.

The CommonJS specification apply to server side. The feature are as follows:

- All code execute in module scope and won't pollute the global scope .
- Modules can be loaded multiple times. But it will only run once during the first load, and then the run result will be cached. If it's loaded later, the cached result will be read directlt. To make the module run again, the cache must be cleared.
- The order in which modules are loaded, in the order they appear in the code.

```
let path = require('path');
let fs = require('fs');
let vm = require('vm');

let n = 0

// 构造函数Module
function Module(filename){
  this.id = n++; // 唯一ID
  this.filename = filename; // 文件的绝对路径
  this.exports = {}; // 模块对应的导出结果
}

// 存放可解析的文件模块扩展名
Module._extensions = ['.js'];
// 缓存
Module._cache = {};
// 拼凑成闭包的数组
Module.wrapper = ['(function(exports,require,module){','\r\n})'];

// 没写扩展名，默认添加扩展名
Module._resolveFilename = function (p) {
  p = path.join(__dirname, p);
  if(!/\.\w+$/.test(p)){
    //如果没写扩展名,尝试添加扩展名
    for(let i = 0; i < Module._extensions.length; i++){
      //拼接出一个路径
      let filePath = p + Module._extensions[i];
      // 判断文件是否存在
      try{
        fs.accessSync(filePath);
        return filePath;
      }catch (e) {
        throw new Error('module not found')
      }
    }
  }else {
    return p
  }
}

// 加载模块本身
Module.prototype.load = function () {
  // 解析文件后缀名 isboyjc.js -> .js
  let extname = path.extname(this.filename);
  // 调用对应后缀文件加载方法
  Module._extensions[extname](this);
};

// 后缀名为js的加载方法
Module._extensions['.js'] = function (module) {
  // 读文件
  let content = fs.readFileSync(module.filename, 'utf8');
  // 形成闭包函数字符串
  let script = Module.wrapper[0] + content + Module.wrapper[1];
  // 创建沙箱环境，运行并返回结果
  // like `eval` in browser
  let fn = vm.runInThisContext(script);
  // 执行闭包函数，将被闭包函数包裹的加载内容
  fn.call(module, module.exports, req, module)
};

// 仿require方法, 实现加载模块
function req(path) {
  // 根据输入的路径 转换绝对路径
  let filename = Module._resolveFilename(path);
  // 查看缓存是否存在，存在直接返回缓存
  if(Module._cache[filename]){
      return Module._cache[filename].exports;
  }
  // 通过文件名创建一个Module实例
  let module = new Module(filename);
  // 加载文件，执行对应加载方法
  module.load();
  // 入缓存
  Module._cache[filename] = module;
  return module.exports
}

let str = req('./test');
console.log(str);
```

### AMD(Asynchronous Module Definition)

Designed for browser environment specifically. CommonJS loads module synchronously and it's inappropriate for browser.

```
// syntax
define(id?: String, dependencies?: String[], factory: Function|Object)

// usage
// 定义依赖 myModule，该模块依赖 JQ 模块
define('myModule', ['jquery','xxxModule'], function($,xxxModule) {
  // $ 是 jquery 模块的输出
  $('body').text('isboyjc')
  // xxxModule
})

// 引入依赖
require(['myModule'], function(myModule) {
  // todo...
})

// implement
(function () {
  // 缓存
  const cache = {}
  let moudle = null
  const tasks = []
  
  // 创建script标签，用来加载文件模块
  const createNode = function (depend) {
    let script = document.createElement("script");
    script.src = `./${depend}.js`;
    // 嵌入自定义 data-moduleName 属性，后可由dataset获取
    script.setAttribute("data-moduleName", depend);
    let fs = document.getElementsByTagName('script')[0];
    fs.parentNode.insertBefore(script, fs);
    return script;
  }

  // 校验所有依赖是否都已经解析完成
  const hasAlldependencies = function (dependencies) {
    let hasValue = true
    dependencies.forEach(depd => {
      if (!cache.hasOwnProperty(depd)) {
        hasValue = false
      }
    })
    return hasValue
  }

  // 递归执行callback
  const implementCallback = function (callbacks) {
    if (callbacks.length) {
      callbacks.forEach((callback, index) => {
        // 所有依赖解析都已完成
        if (hasAlldependencies(callback.dependencies)) {
          const returnValue = callback.callback(...callback.dependencies.map(it => cache[it]))
          if (callback.name) {
            cache[callback.name] = returnValue
          }
          tasks.splice(index, 1)
          implementCallback(tasks)
        }
      })
    }
  }
   
  // 根据依赖项加载js文件
  const require = function (dependencies, callback) {
    if (!dependencies.length) { // 此文件没有依赖项
      moudle = {
        value: callback()  
      }
    } else { //此文件有依赖项
      moudle = {
        dependencies,
        callback
      }
      tasks.push(moudle)
      dependencies.forEach(function (item) {
        if (!cache[item]) {
          // script加载文件结束
          createNode(item).onload = function () {
            // 获取嵌入属性值，即module名
            let modulename = this.dataset.modulename
            // 校验module中是否存在value属性
            if (moudle.hasOwnProperty('value')) {
              // 存在，将其module value（模块返回值｜导出值）存入缓存
              cache[modulename] = moudle.value
            } else {
              // 不存在
              moudle.name = modulename
              if (hasAlldependencies(moudle.dependencies)) {
                // 所有依赖解析都已完成，执行回调，抛出依赖返回（导出）值
                cache[modulename] = callback(...moudle.dependencies.map(v => cache[v]))
              }
            }
            // 递归执行callback
            implementCallback(tasks)
          }
        }
      })
    }
  }
  window.require = require
  window.define = require
})(window)
```

### CMD

Drawing on the advantages of CommonJS and AMD specifications, it is also specifically designed for asynchronous module loading in browsers.

<table>
  <tr>
    <th>
      规范
    </th>
    <th>
      推崇
    </th>
    <th>
      代表作
    </th>
  </tr>
  <tr>
    <td>AMD</td>
    <td>依赖前置</td>
    <td>requirejs</td>
  </tr>
  <tr>
    <td>CMD</td>
    <td>依赖就近</td>
    <td>seajs</td>
  </tr>
</table>

### UMD

Run the same code module in a project using CommonJs, CMD, or even AMD through runtime or compile time。

```
((root, factory) => {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory();
  } else if (typeof define === 'function' && define.cmd){
  // CMD
    define(function(require, exports, module) {
      module.exports = factory()
    })
  } else {
    root.umdModule = factory();
  }
})(this, () => {
  console.log('我是UMD')
  // todo...
});
```

### ES Module

Implemented module functionality, enabling the determination of module dependencies and their input and output variables at compile time, unlike commonJS, AMD, which require runtime determination

