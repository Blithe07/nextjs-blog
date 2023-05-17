---
title: "Vue Compiler"
date: "2023-05-17"
category: "vue"
---

![vue compiler process](/images/vue-compiler.png)

```
function compile(template){
    const ast = parse(template)

    transform(ast)

    const code = generate(ast.jsNode)
    
    return code
}
```
