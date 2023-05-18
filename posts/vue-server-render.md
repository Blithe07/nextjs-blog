---
title: "Vue Server Renderer"
date: "2023-05-18"
category: "vue"
---

## Isomorphic rendering

Combinate with SSR and CSR advantage. Divided to first render and non first render.


### render normal VDOM to HTML string

```
// void element
const VOID_TAGS = 'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr'.split(',')

function renderElementNode(vnode){
    const { type:tag, props, children } = vnode
    const isVoidElement = VOID_TAGS.includes(tag)

    let ret = `<${tag}`

    if(props){
        ret += renderAttrs(props)
    }

    ret += isVoidElement ? '/>' : '>'

    if(typeof children === 'string'){
        ret += children
    }else{
        children.forEach(child=>{
            ret += renderElementNode(child)
        })
    }

    ret += `</${tag}>`

    return ret
}

const shouldIgnoreProp = ['key', 'ref']
function renderAttrs(props){
    let ret = ''
    for(const key in props){
        if(shouldIgnoreProp.includes(key) || /^on[^a-z]/.test(key)){
            continue
        }
        const value = props[key]
        ret += renderDynamicAttr(key, value)
    }
    return ret
}

const isBooleanAttr = (key) =>{
    // boolean type attribute
    return 'checked,multiple...'.split(',').includes(key)
}
function renderDynamicAttr(key, value){
    if(isBooleanAttr(key)){
        return value === false ? '' : `${key}`
    }else if(isSSRSafeAttrName(key)){
        return value === '' ? `${key}` : `${key}="${escapeHtml(value)}"`
    }else{
        // skip unsafe attribute
    }
    return ''
}

// prevent XSS
const escapeRE = /["'&<>]/
function escapeHtml(string){
    const str = '' + string
    const match = escapeRE.exec(str)

    if(!match){
        return str
    }
    let html = ''
    let escaped, index, lastIndex = 0
    for(index = match.index; index < str.length; index++){
        switch(str.charCodeAt(index)){
            case 34: // "
                escaped = '&quot;'
                break
            case 38: // &
                escaped = '&amp;'
                break
            case 39: // '
                escaped = '&#39;'
                break
            case 60: // <
                escaped = '&lt;'
                break
            case 62: // >
                escaped = '&gt;'
                break
            default:
                continue
        }

        if(lastIndex !== index){
            html += str.substring(lastIndex, index)
        }

        lastIndex = index + 1
        html += escaped
    }
    return lastIndex !== index ? html + str.substring(lastIndex, index) : html
}
```

### render component to HTML string

![init component](/images/vue-init-component.png)

```
// usage
const MyComponent ={
    setup(){
        return ()=>{
            return {
                type: 'div',
                children: 'hello'
            }
        }
    }
}
const ComponentVNode = {
    type: MyComponent
}

function renderComponentVNode(vnode){
    const isFunctional = typeof vnode.type === 'function'
    
    const componentOptions = vnode.type

    if(isFunctional){
        componentOptions = {
            render: vnode.type,
            props: vnode.type.props
        }
    }

    const { render, data, beforeCreate, created, props: propsOption, setup } = componentOptions

    beforeCreate && beforeCreate()

    const state = data ? data() : null

    const [props, attrs] = resolveProps(propsOption, vnode.props)

    function emit(event, ...payload){
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
        const handler = instance.props[eventName]
        if(handler){
            handler(...payload)
        }else{
            console.log('event non-exist')
        }
    }

    const slots = vnode.children || {}

    const instance = {
        state,
        props: props
        isMounted: false,
        subTree: null,
        slots,
        // support setup multiple mounted register
        // The principle of other lifecycle hook functions is the same as mounted
        mounted: []
    }

    const setupContext = { attrs, emit, slots }
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(props), setupContext)
    setCurrentInstance(null)
    let setupState = null

    if(typeof setupResult === 'function'){
        if(render) console.error('setup function return render function, render option will be ignored')
        render = setupResult
    }else{
        setupState = setupContext
    }

    vnode.component = instance

    const renderContext = new Proxy(instance, {
        get(t, k, r){
            const {state, props, slots} = t
            if(k === '$slots') return slots
            if(state && k in state){
                return state[k]
            }else if(props && k in props){
                return props[k]
            }else if(setupState && k in setupState){
                return setupState[k]
            }else{
                console.log('non-exist')
            }
        },
        set(t, k, v, r){
            const {state, props} = t

             if(state && k in state){
                state[k] = v
            }else if(props && k in props){
                props[k] = v
            }else if(setupState && k in setupState){
                setupState[k] = v
            }else{
                console.log('non-exist')
            }
        }
    })

    created && created.call(renderContext)

    const subTree = render.call(renderContext, renderContext)

    return renderVNode(subTree)
}
function renderVNode(vnode){
    const type = typeof vnode.type
    if(type === 'string'){
        return renderElementNode(vnode)
    }else if(type === 'object' || type === 'function'){
        return renderComponentVNode(vnode)
    }else if(type === Text){
        // handle text ...
    }else if(type === Fragment){
        // handle Fragment
    }else{
        // handle other type
    }
}
```


### Client hyrate

- create connection between DOM and VDOM
- addEventListener to DOM

```
function hydrate(vnode, container){
    hydrateNode(container.firstChild, vnode)
}

function hydrateNode(node, vnode){
    const { type } = vnode
    vnode.el = node

    if(typeof type === 'object'){
        mountComponent(vnode, container, null)
    }else if(typeof type === 'string'){
        if(node.nodeType !== 1){
            // mismatch, not element node
        }else{
            hydrateElement(node, vnode)
        }
    }

    return node.nextSibling
}

function hydrateElement(el, vnode){
    if(vnode.props){
        for(const key in vnode.props){
            // addEventListener
            if(/^on/.test(key)){
                patchProps(el, key, null, vnode.props[key])
            }
        }
    }

    // hydrate child recursive
    if(Array.isArray(vnode.children)){
        let nextNode = el.firstChild
        const len = vnode.children.length
        for(let i = 0; i < len; i++){
            nextNode = hydrateNode(nextNode, vnode.children[i])
        }
    }
}

function mountComponent(vnode, container, anchor){
    // ...

    instance.update = effect(()=>{
        const subTree = render.call(renderContext, renderContext)
        
        if(!instance.isMounted){
            beforeMount && beforeMount.call(renderContext)

            if(vnode.el){
                hydrateNode(vnode.el, subTree)
            }else{
                patch(null, subTree, container, anchor)
            }

            instance.isMounted = true

            mounted && mounted.call(renderContext)

            instance.mounted && instance.mounted.forEach(hook => hook.call(renderContext))
        }else{
            beforeUpdate && beforeUpdate.call(renderContext)
            patch(instance.subTree, subTree, container, anchor)
            updated && updated.call(renderContext)
        }

        instance.subTree = subTree
    },{
        scheduler: queueJob
    })
}
```

### write isomorphic code

pay attention to the code at difference runtime environment

- component lifecycle   
    
    > beforeMount, mounted, beforeUpdate, updated won't execute on server. So it will occur error when set timer at those lifecycle.
    - move timer code to mounted and it only execute on client.
    - use environment variable wrap code, make it not running on the server.

- cross platform API

    > use environment variable wrap platform specific API

- import module only at one end

    > use environment variable import module dynamically

- avoid state pollution caused by cross request

    > pay attention to global variable in component, because there is a one-to-many relationship between server and user.

- <ClientOnly> Component

    >  allow third party components that are not compatible with SSR run on server.
    ```
    const ClientOnly = defineComponent({
        setup(_, { slots }){
            const show = ref(false)
            // only run on client
            onMounted(() => {
                show.value = true
            })

            return () => (show.value && slots.default ? slots.default() : null)
        }
    })
    ```