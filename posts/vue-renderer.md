---
title: "Vue Renderer"
date: "2023-05-15"
category: "vue"
---

## Renderer

### The Combination of Renderer and Reactivity System

- Renderer: Not only can it render real DOM, but it is also the key to the framework's cross platform capabilities
- Reactivity: reactivity data update, re execute corresponding function
- Combination: Utilize the ability of the reactivity system to automatically call the renderer to complete page rendering and updating

### Custom Renderer

Provide configurable interfaces to achieve cross platform capabilities of renderers

## Mount

The function of **HTML Attributes** is to set the initial value of the corresponding **DOM Properties**

```
function shouldSetAsProps(el, key, value){
    // eg: <form id="form1"></form> <input form="form1" />
    if(key === 'form' && el.tagName === 'INPUT') return false
    return key in el
}

function mountElement(vnode, container) {
    const el = createElement(vnode.type)

    if(typeof vnode.children === 'string'){
        setElementText(el, vnode.children)
    }else if(Array.isArray(vnode.children)){
        vnode.children.forEach(child => {
            // mountElement recursive
            patch(null, child, el)
        })
    }

    if(vnode.props){
        for(const key in vnode.props){
            patchProps(el, key, null, vnode.props[key])
        }
    }
    insert(el, container)
}
// custom renderer
const renderer = createRenderer({
    createElement(tag){
        return document.createElement(tag)
    },
    setElementText(el, text){
        el.textContent = text
    },
    insert(el, parent, anchor = null){
        parent.insertBefore(el, anchor)
    },
    patchProps(el, key, prevValue, nextValue){
        if(key === 'class'){
            // enhance
            el.className = nextValue || ''
        }else if(shouldSetAsProps(el, key, nextValue)){
            const type = typeof el[key]
            // handle special property like disabled
            if(type === 'boolean' && nextValue === ''){
                el[key] = true
            }else{
                el[key] = nextValue
            }
        }
        }else{
            // The property to be set doesn't have a corresponding DOM Properties
            el.setAttribute(key, nextValue)
        }
    }
})
```

### Unmount

We cann't use `innerHTML` to complete unmount operation. There are three reasons for this:

- Component lifecycle hooks like `beforeUnmount`、`unmounted` need to be executed
- Some elements have custom instructions need to be executed
- Use `innerHTML` to clear container that won't remove event listener

```
function unmount(vnode){
    const parent = vnode.el.parentNode
    if(parent){
        // execute unmount related lifecycle
        // ...

        parent.removeChild(vnode.el)
    }
}
```

### Distinguish Vnode Type

```
function patch(n1, n2, container){
    if(n1 && n1.type !== n2.type){
        unmount(n1)
        n1 = null
    }

    const { type } = n2
    if(typeof type === 'string'){
        // normal label element
        if(!n1){
            mountElement(n2, container)
        }else{
            patchElement(n1, n2)
        }
    }else if(typeof type === 'object'){
        // component
    }else if(typeof type === xxx){
        // other type vnode
    }
}
```

### Event

By human convention, attributes starting with the string `on` in vnode.props are considered events.

```
function patchProps(el, key, prevValue, nextValue){
    if(/^on/.test(key)){
        // bind fake event handler and update it when trigger event
        // support difference type event
        const invokers = el._vei || (el._vei = {})
        let invoker = invokers[key]
        const name = key.slice(2).toLowerCase()
        if(nextValue){
            if(!invoker){
                invoker = el._vei[key] = (e)=>{
                    // Block the execution of all event handling functions with binding time later than the event trigger time
                    // resolve event bubble cause event execute time abnormal issue
                    if(e.timStamp < invoker.attached) return

                    if(Array.isArray(invoker.value)){
                        // support multiple same event
                        invoker.value.forEach(fn => fn(e))
                    }else{
                        invoker.value(e)
                    }
                }
                invoker.value = nextValue
                // record event trigger time
                invoker.attached = performance.now()
                el.addEventListener(name, invoker)
            }else{
                invoker.value = nextValue
            }
        }else if(invoker){
            el.removeEventListener(name, invoker)
        }
    }
    // ...other key
}
```

### Update Child Node

![patchElement situtation](/images/vue3-patchElement.png)

```
function patchElement(n1, n2){
    const el = n2.el = n1.el
    const oldProps = n1.props
    const newProps = n2.props
    // update props
    for(const key in newProps){
        if(newProps[key] !== oldProps[key]){
            patchProps(el, key, oldProps[key], newProps[key])
        }
    }
    for(const key in oldProps){
        if(!(key in newProps)){
            patchProps(el, key ,oldProps[key], null)
        }
    }

    // update children
    patchChildren(n1, n2, el)
}

function patchChildren(n1, n2, container){
    if(typeof n2.children === 'string'){
        // new node is text
        if(Array.isArray(n1.children)){
            n1.children.forEach(child => unmount(child))
        }
        setElementText(container, n2.children)
    }else if(Array.isArray(n2.children)){
        // new node is array
        if(Array.isArray(n1.children)){
            // main diff core(inefficient implementation)
            n1.children.forEach(child => unmount(child))
            n2.children.forEach(child => patch(null, child, container))
        }else{
            setElementText(container, '')
            n2.children.forEach(child => patch(null, child, container))
        }
    }else{
        // new node is null
        if(Array.isArray(n1.children)){
            n1.children.forEach(child => unmount(child))
        }else if(typeof n1.children === 'string'){
            setElementText(container, '')
        }
    }
}
```