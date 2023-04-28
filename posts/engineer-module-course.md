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
-  
