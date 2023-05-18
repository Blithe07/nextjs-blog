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

## Compile Optimize

### Block And PatchFlags

set extra information into VNode by compiler.

```
// call it 'Block',
const vnode = {
    tag: 'div',
    children: [
        { tag: 'div', children: 'foo' },
        { tag: 'p', children: ctx.bar, patchFlag: PatchFlags.TEXT},
        { tag: 'div' children: [
           { tag: 'p', children: ctx.foo, patchFlag: PatchFlags.TEXT},
        ]}
    ],
    // collect all dynamic child node
    dynamicChildren: [
        { tag: 'p', children: ctx.bar, patchFlag: PatchFlags.TEXT},
        { tag: 'p', children: ctx.foo, patchFlag: PatchFlags.TEXT},
    ]
}
```

The conditions for becoming a block:

- template root node
- node with directive

```
// collect Block
const dynamicChildrenStack = []
let currentDynamicChildren = null

function openBlock(){
    dynamicChildrenStack.push((currentDynamicChildren = []))
}

function closeBlock(){
    currentDynamicChildren = dynamicChildrenStack.pop()
}

function createVNode(tag, props, children, flags){
    const key = props.key
    props && delete props.key

    const vnode = {
        tag,
        props,
        children,
        key,
        patchFlag: flags
    }

    if(typeof flags !== 'undefined' && currentDynamicChildren){
        currentDynamicChildren.push(vnode)
    }

    return vnode
}

function createBlock(tag, props, children){
    const block = createVNode(tag, props, children)
    block.dynamicChildren = currentDynamicChildren

    closeBlock()

    return block
}

// template
<div id="foo">
    <p class="bar">{{ text }}</p>
</div>
// compile result
render(){
    return (openBlock(), createBlock('div', { id: 'foo' }, [
        createVNode('p', { class: 'bar' }, ctx.text, 1 /* patch flag */)
    ]))
}

```

### Renderer runtime support

handle dynamicChildren in Renderer.

```
function patchElement(n1, n2){
    const el = n2.el = n1.el
    const oldProps = n1.props
    const newProps = n2.props
    // ...

    if(n2.patchFlag){
        // update necessary props
        switch(n2.patchFlag){
            case xx:
                // ...
                break
        }
    }else{
        // update all
    }

    if(n2.dynamicChildren){
        patchBlockChildren(n1, n2)
    }else{
        patchChildren(n1, n2, el)
    }
}

function patchBlockChildren(n1, n2){
    for(let i = 0; i < n2.dynamicChildren.length; i++){
        patchElement(n1.dynamicChildren[i], n2.dynamicChildren[i])
    }
}
```

### Static lifting

lift static node outside of the render function to implement node reuse.  
static lifting is based on tree as a unit

```
const hoist1 = createVNode('p', null, 'text')

function render(){
    return (openBlock(), createBlock('div', null, [
        hoist1,
        createVNode('p', null, ctx.title, 1 /* TEXT */)
    ]))
}
```

### Pre stringing

use pre stringing instead of static lifting when template includes lot of continuous static nodes.  
There are three advantages as follow:

- it has advantage on performance when use `innerHTML` to setup large static content
- reduce performance overhead that create VNode
- reduce memory consumption

```
const hoistStatic = createStaticVNode('<p></p>...<p></p>')

render(){
    return (openBlock(), createBlock('div', null, [hoistStatic]))
}
```

### cache inner event handler and v-once

```
// usage
<Comp @change="a + b" />

function render(ctx, cache){
    return h(Comp, {
        onChange: cache[0] || (cache[0] = ($event) => (ctx.a + ctx.b))
    })
}

// usage
<div v-once>{{ CONST }}</div>

function render(ctx, cache){
    return (openBlock(), createBlock('div', null, [
        cache[1] || (
            setBlockTracking(-1), // stop collect this vnode from block
            cache[1] = h('div', null, ctx.CONST, 1 /* TEXT */)
            setBlockTracking(1), // restore
            cache[1] // return
        )
    ]))
}
```
