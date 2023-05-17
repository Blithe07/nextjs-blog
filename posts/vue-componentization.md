---
title: "Vue Componentization"
date: "2023-05-17"
category: "vue"
---

## Component Implement Principle

Distinguish `Component` by vnode.type

```
function patch(n1, n2, container, anchor){
    // unmount operations
    // ...

    const { type } = n2
    if(typeof type === 'object'){
        if(!n1){
            mountComponent(n2, container, anchor)
        }else{
            patchComponent(n1, n2, anchor)
        }
    }
}

let currentInstance = null
function setCurrentInstance(instance){
    currentInstance = instance
}

function mountComponent(vnode, container, anchor){
    const componentOptions = vnode.type

    const { render, data, beforeCreate, created, beforeMount, mounted, beforeUpdate, updated, props: propsOption, setup } = componentOptions

    beforeCreate && beforeCreate()

    const state = data ? reactive(data()) : null

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
        props: shallowReactive(props)
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

    effect(()=>{
        const subTree = render.call(state, state)

        if(!instance.isMounted){
            beforeMount && beforeMount.call(renderContext)
            patch(null, subTree, container, anchor)
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

// setup
function onMounted(fn)=>{
    if(currentInstance){
        currentInstance.mounted.push(fn)
    }else{
        console.error('onMounted function can only be executed in setup')
    }
}

function resolveProps(options, propsData){
    const props = {}
    const attrs = {}

    for(const key in propsData){
        if(key in options || key.startsWith('on')){
            props[key] = propsData[key]
        }else{
            attrs[key] = propsData[key]
        }
    }

    return [ props, attrs ]
}

const queue = new Set()
let isFlushing = false
const p = Promise.resolve()
function queueJob(job){
    queue.add(job)
    if(!isFlushing){
        isFlushing = true
        p.then(() => {
            try{
                queue.forEach(job => job())
            }finally{
                isFlushing = false
                queue.length = 0
            }
        })
    }
}

function patchComponent(n1, n2, container){
    const instance = n2.component = n1.component

    const { props } = instance

    if(hasPropsChanged(n1.props, n2.props)){
        const [nextProps] = resolveProps(n2.type.props, n2.props)
        // update props
        for(const k in nextProps){
            props[k] = nextProps[k]
        }
        // delete non-exist props
        for(const k in props){
            if(!(k in nextProps)) delete props[k]
        }
    }
}

function hasPropsChanged(prevProps, nextProps){
    const nextKeys = Object.keys(nextProps)
    if(nextKeys.length !== Object.keys(prevProps).length){
        return true
    }

    for(let i = 0; i < nextKeys.length; i++){
        const key = nextKeys[i]
        if(nextProps[key] !== prevProps[key]){
            return true
        }
    }

    return false
}
```

## Asynchronous Component And Functional Component

### Problems to be solved by asynchronous component

- allow user specify the component to render when loading errors occur
- allow user specify loading component and delay time
- allow user set loading component timeout
- provide retry ability to user when component loading errors occur

### principle

Implementing friendly user interfaces through encapsulation to reduce user level usage complexity

```
// usage
const AsyncComp = defineAsyncComponent(() => import('Comp.vue'))
const AsyncComp = defineAsyncComponent({
    loader: () => import('Comp.vue'),
    timeout: 2000,
    errorComponent: ErrorComponent,
    delay: 200,
    loadingComponent: {
        setup() {
            return () => { type: 'h2', children: 'loading'}
        }
    }
})

function defineAsyncComponent(options){
    if(typeof options === 'function'){
        options = {
            loader: options
        }
    }

    const { loader } = options

    let InnerComp = null

    let retries = 0

    function load(){
        return loader().catch(err => {
            if(options.onError){
                return new Promise((resolve, reject) => {
                    const retry = () => {
                        resolve(load())
                        retries++
                    }
                    const fail = () => reject(err)

                    options.onError(retry, fail, retries)
                })
            }else{
                throw error
            }
        })
    }

    return {
        name: 'AsyncComponentWrapper',
        setup() {
            const loaded = ref(false)
            const error = shallowRef(null)
            const loading = ref(false)
            let loadingTimer = null

            if(options.delay){
                loadingTimer = setTimeout(() => {
                    loading.value = true
                }, options.delay)
            }else{
                loading.value = true
            }

            load()
                .then(c => {
                    InnerComp = c
                    loaded.value = true
                })
                .catch(err => error.value = err)
                .finally(() => {
                    clearTimeout(loadingTimer)
                    loading.value = false
                })

            let timer = null
            if(options.timeout){
                timer = setTimeout(() => {
                    const err = new Error(`Async component timed out after ${options.timeout}ms.`)
                    error.value = err
                },options.timeout)
            }
            onUnmount(() => clearTimeout(timer))

            const placeholder = { type: Text, children: '' }

            return () => {
                if(loaded.value){
                    return { type: InnerComp }
                }else if(error.value && options.errorComponent){
                    return { type: options.errorComponent, props: { error: error.value} }
                }else if(loading.value && options.loadingComponent){
                    return { type: options.loadingComponent }
                }
                return placeholder
            }
        }
    }
}
```

### Functional Component

No self state, receiving external incoming props. Base on stateful component to implement.

```
function patch(n1, n2, container, anchor){
    // ...
    const { type } = n2
    if(typeof type === 'object' || typeof type === 'function'){
        if(!n1){
            mountComponent(n1, n2, container, anchor)
        }else{
            patchComponent(n1, n2, anchor)
        }
    }
}

function mountComponent(n1, n2, container, anchor){
    const isFunctional = typeof vnode.type === 'function'

    let componentOptions = vnode.type

    if(isFunctional){
        componentOptions = {
            render: vnode.type
            props: vnode.type.props
        }
    }

    // ...
}
```

## Built In Component and Module

### KeepAlive

cache + special mount/unmount logic

```
const KeepAlive = {
    __isKeepAlive: true,
    props:{
        include: RegExp,
        exclude: RegExp
    },
    setup(props, { slots }){
        // key: vnode.type
        // value: vnode
        const cache = new Map()

        const instance = currentInstance

        const { move, createElement } = instance.keepAliveCtx

        const storageContainer = createElement('div')

        instance._deActivate = (vnode) => {
            move(vnode, storageContainer)
        }
        instance._activate = (vnode, container, anchor) => {
            move(vnode, container, anchor)
        }

        return () => {
            let rawVNode = slots.default()

            // non component, render directly.
            if(typeof rawVNode.type !== 'object'){
                return rawVNode
            }

            const name = rawVNode.type.name
            if(name && 
                (
                    (props.include && !props.include.test(name))
                    ||
                    (props.exclude && props.exclude.test(name))
                )
            ){
                return rawVNode
            }

            cosnt cacheVNode = cache.get(rawVNode.type)
            if(cacheVNode){
                rawVNode.component = cacheVNode.component
                rawVNode.keptAlive = true
            }else{
                cache.set(rawVNode.type, rawVNode)
            }

            rawVNode.shouldKeepAlive = true
            rawVNode.keepAliveInstance = instance

            return rawVNode
        }
    }
}

function unmount(vnode){
    // ...
    if(typeof vnode.type === 'object'){
        if(vnode.shouldKeepAlive){
            vnode.keepAliveInstance._deActivate(vnode)
        }else{
            unmount(vnode.component.subTree)
        }
    }
}

function patch(n1, n2, container, anchor){
    // ...
    const { type } = n2
    if(typeof type === 'object' || typeof type === 'function'){
        if(!n1){
            if(n2.keptAlive){
                n2.keepAliveInstance._activate(n2, container, anchor)
            }else{
                mount(n2, container, anchor)
            }
        }
    }
}

function mountComponent(vnode, container, anchor){
    // ...
    const instance = { 
        // other property

        keepAliveCtx: false
    }

    const isKeepAlive = vnode.type.__isKeepAlive
    if(isKeepAlive){
        instance.keepAliveCtx = {
            move(vnode, container, anchor){
                insert(vnode.component.subTree.el, container, anchor)
            },
            createElement
        }
    }
}
```

### Teleport

cross DOM level render.

```
function patch(n1, n2, container, anchor){
    // ...
    const { type } = n2
    if(typeof type === 'object' && type.__isTeleport){
        // transfer render control
        type.process(n1, n2, container, anchor,{
            patch,
            patchChildren,
            move(vnode, container, anchor){
                insert(vnode.component ? vnode.component.subTree.el : vnode.el, container, anchor)
            }
        })
    }
}

const Teleport = {
    __isTeleport: true,
    process(n1, n2, container, anchor, internals){
        const { patch, patchChildren, move } = internals
        if(!n1){
            const target = typeof n2.props.to === 'string' ? document.querySelector(n2.props.to) : n2.props.to

            n2.children.forEach(child => patch(null, child, container, anchor))
        }else {
            patchChildren(n1, n2, container)

            // maybe props.to change
            if(n2.props.to !== n1.props.to){
                const newTarget = typeof n2.props.to === 'string' ? document.querySelector(n2.props.to) : n2.props.to 
                n2.children.forEach(child => move(child, newTarget, anchor))
            }
        }
    }
}
```

### Transition

similar to dom transition principle.

```
// expect virtual dom after compile
function render(){
    return {
        type: Transition,
        children:{
            default(){
                return { type: 'div', children: 'transition element'}
            }
        }
    }
}

const Transition = {
    name: 'Transition',
    setup(props, { slots }){
        return () => {
            const innerVNode = slots.default()

            innerVNode.transition = {
                beforeEnter(el){
                    el.classList.add('enter-from')
                    el.classList.add('enter-active')
                },
                enter(el){
                    nextFrame(() => {
                        el.classList.remove('enter-from')
                        el.classList.add('enter-to')
                        el.addEventListener('transitionend', () => {
                            el.classList.remove('enter-to')
                            el.classList.remove('enter-active')
                        })
                    })
                },
                leave(el, performRemove){
                    el.classList.add('leave-from')
                    el.classList.add('leave-active')

                    // force reflow
                    document.body.offsetHeight

                    nextFrame(() => {
                        el.classList.remove('leave-from')
                        el.classList.add('leave-to')
                        el.addEventListener('transitionend', () => {
                            el.classList.remove('leave-to')
                            el.classList.remove('leave-active')
                            
                            performRemove()
                        })
                    })
                }
            }

            return innerVNode
        }
    }
}

function mountComponent(vnode, container, anchor){
    // ...
    const needTransition = vnode.transition
    if(needTransition){
        vnode.transition.beforeEnter(el)
    }

    insert(el, container, anchor)

    if(needTransition){
        vnode.transition.enter(el)
    }
}

function unmount(vnode){
    // ...
    const needTransition = vnode.transition
    //...

    const parent = vnode.el.parentNode
    if(parent){
        const performRemove = () => parent.removeChild(vnode.el)
        if(needTransition){
            vnode.transition.leave(vnode.el, performRemove)
        }else{
            performRemove()
        }
    }
}
```
