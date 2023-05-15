---
title: "Vue Reactivity"
date: "2023-05-09"
category: "vue"
---

The goal is effect function re-execute when reactivity data change.

1. when execute effect function, trigger **read** operation.
2. when update reactivity data, trigger **write** operation.

<hr/>

- register effect function mechanism
- data structure of collect dependency

  ```
  target
      |-- key
          |-- effectFn

  WeakMap<target, Map<key, Set<Fn>>>

  ```

```
let activeEffect

const effectStack = []

function effect(fn, options = {}) {
    const effectFn = () => {
        cleanup(effectFn)

        activeEffect = effectFn

        // resolve effect nest issue
        effectStack.push(effectFn)

        // save result of fn
        const res = fn()

        // resolve effect nest issue
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]

        // return result
        return res
    }

    // collect dependency
    effectFn.deps = []

    // support scheduler
    effectFn.options = options

    // support lazy
    if (!options.lazy) {
        effectFn()
    }

    return effectFn
}
function cleanup(effectFn) => {
    for (let i = 0; i < effectFn.deps.length; i++){
        const deps = effectFn.dep[i]
        deps.delete(effectFn)
    }

    effectFn.deps.length = 0
}

const bucket = new WeakMap()

const ITERATE_KEY = Symbol()
const MAP_KEY_ITERATE_KEY = Symbol()

const reactiveMap = new Map()

function reactive(obj) {
    // resolve create difference proxy object
    // eg: const obj = {}; const arr = reactive([obj]); arr.includes(arr[0])
    // when read arr[0], it will create a new proxy object
    const existionProxy = reactiveMap.get(obj)
    if(existionProxy) return existionProxy

    const proxy = createReactive(obj)
    reactiveMap.set(obj, proxy)
    return proxy
}

function shallowReactive(obj){
    return createReactive(obj, true)
}

function readonly(obj){
    return createReactive(obj, false, true)
}

function shallowReadonly(obj){
    return createReactive(obj, true, true)
}

const arrayInstrumentations = {};
// resolve array method find value error issue
['includes', 'indexOf', 'lastIndexOf'].forEach(method => {
    const originMethod = Array.prototype[method]
    arrayInstrumentations[method] = function(...args) {
        let res = originMethod.apply(this, args)

        if(res === false){
            // get originArray by this.raw if proxyArray doesn't find result
            res = originMethod.apply(this.raw, args)
        }

        return res
    }
})

let shouldTrack = true;
// avoid array method execute repeatly cause stack overflow
// eg: push will read length property and then set length property
['push', 'pop', 'shift', 'unshift', 'splice'].forEach(method =>{
    const originMethod = Array.prototype[method]
    arrayInstrumentations[method] = function(...args) {
        shouldTrack = false
        let res = originMethod.apply(this, args)
        shouldTrack = true
        return res
    }
})

function createReactive(obj, isShallow = false, isReadonly = false){
    return new Proxy(data, {
        get(target, key, receiver) {
            // define custom special property to resolve extend reactive prototype cause twice trigger issue
            if(key === 'raw'){
                return target
            }

            // rewrite some array method
            if(Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)){
                return Reflect.get(arrayInstrumentations, key, receiver)
            }

            // The execution of an array iterator will read the length attribute of the array, and if iterating on array element values, it will also read the index of the array
            // so skip the Symbol.iterator
            if(!isReadonly && typeof key !== 'symbol'){
                track(target, key)
            }

            // resolve `this` issue
            // eg: const originObj = { foo : 1, get bar(){ return this.foo }}
            const res = Reflect.get(target, key, receiver)

            // shallow reactive
            if(isShallow){
                return res
            }

            // deep reactive
            if(typeof res === 'function' && res !== null){
                return isReadonly ? readonly(res) : reactive(res)
            }

            return res
        },
        set(target, key, newVal, receiver){
            // support isReadonly
            if(isReadonly){
                console.warn(`prop ${key} isReadonly`)
                return true
            }

            // proxy array
            // resolve for...of update property issue
            const type = Array.isArray(target)
                ? Number(key) < target.length ? 'SET' : 'ADD'
                : Object.prototype.hasOwnProperty.call(target, key) ? 'SET' : 'ADD'

            const res = Reflect.set(target, key, newVal, receiver)

            const oldVal = target[key]

            // avoid trigger from prototype
            if(target === receiver.raw){
                // only trigger when oldVal !== newVal and it's not NaN, because NaN(before) !== NaN(after)
                if(oldVal !== newVal && (oldVal === oldVal || newVal === newVal)){
                    // pass newVal to reslove update arr.length issue
                    trigger(target, type, key, newVal)
                }
            }

            return res
        },
        // intercept `in` operation
        has(target, key){
            track(target ,key)

            return Reflect.has(target, key)
        },
        // intercept `for in`
        ownKeys(target){
            track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)

            return Reflect.ownKeys(target)
        },
        deleteProperty(target, key){
            // support isReadonly
            if(isReadonly){
                console.warn(`prop ${key} isReadonly`)
                return true
            }

            // check whether self property
            const hadKey = Object.prototype.hasOwnProperty.call(target, key)

            const res = Reflect.deleteProperty(target, key)

            if(res && hadKey){
                trigger(target, 'DELETE', key)
            }

            return res
        }
    })
}

function track(target, key){
    if (!activeEffect || !shouldTrack) return

    let depsMap = bucket.get(target)
    if (!depsMap){
        bucket.set(target, (depsMap = new Map()))
    }

    let deps = depsMap.get(key)
    if (!deps){
        depsMap.set(key, (dep = new Set()))
    }

    // collect dependency(double side)
    deps.add(activeEffect)
    activeEffect.deps.push(deps)
}

function trigger(target, type, key?, newVal?){
    const depsMap = bucket.get(target)
    if (!depsMap) return

    // wrap effects with Set to avoid dead loop
    const effectsToRun = new Set()

    const effects = depsMap.get(key)
    effects && effects.forEach(feffectFn => {
        // resolve infinite recursive loop issue
        if (effectFn !== activeEffect){
            effectsToRun.add(effectFn)
        }
    })

    // The third condition is for the forEach case of Map
    if(type === 'ADD' || type === 'DELETE' || (type === 'SET' && Object.prototype.toString.call(target) === '[Object Map]')){
        // resolve for...of update or delete property issue
        const iterateEffects = depsMap.get(ITERATE_KEY)
        iterateEffects && iterateEffects.forEach(effectFn => {
            if (effectFn !== activeEffect){
                effectsToRun.add(effectFn)
            }
        })
    }

    // Special handling of new Map().keys method situations
    if((type === 'ADD' || type === 'DELETE') && Object.prototype.toString.call(target) === '[Object Map]') {
        const iterateEffects = depsMap.get(MAP_KEY_ITERATE_KEY)
        iterateEffects && iterateEffects.forEach(effectFn => {
            if (effectFn !== activeEffect){
                effectsToRun.add(effectFn)
            }
        })
    }

    // reslove add value by arr.length issue
    if(type === 'ADD' && Array.isArray(target)){
        const lengthEffects = depsMap.get('length')
        lengthEffects && lengthEffects.forEach(effectFn => {
            if (effectFn !== activeEffect){
                effectsToRun.add(effectFn)
            }
        })
    }
    // resolve change arr.length issue. eg: arr.length = 0
    if(Array.isArray(target) && key === 'length'){
        const newLen = Number(newVal)
        depsMap.forEach((dep, key) => {
            if (key >= newLen) {
                deps.forEach(effectFn => {
                    if (effectFn !== activeEffect){
                        effectsToRun.add(effectFn)
                    }
                })
            }
        })
    }

    effectsToRun.forEach(effectFn => {
        if (effectFn.options.scheduler){
            // support scheduler
            effectFn.options.scheduler(effectFn)
        } else {
            effectFn()
        }
    })
}

// implement batch edit reactivity data but trigger once.
const jobQueue = new Set()
const p = Promise.resolve()
let isFlushing = false
function flushJob(){
    if (isFlushing) return
    isFlushing = true
    p.then(()=>{
        jobQueue.forEach(job => job())
    }).finally(()=>{
        isFlushing = false
    })
}


// implement computed
function computed(getter){
    // cache
    let value
    // flag that whether need recalculate
    let dirty = true

    const effectFn = effect(getter, {
        lazy: true,
        // dependency change trigger scheduler to implement recalculate value
        scheduler(){
            dirty = true
            // resolve effect nest issue
            trigger(obj, 'SET', 'value')
        }
    })

    const obj = {
        get value() {
            if(dirty){
                value = effectFn()
                dirty = false
            }

            // resolve effect nest issue
            track(obj, 'value')

            return value
        }
    }

    return obj
}


// implement watch
function watch(source, cb, options = {}){
    let getter
    // allow accept a getter function
    if(typeof source === 'function'){
        getter = source
    }else{
        getter = () => traverse(source)
    }

    // build cb params
    let newValue, oldValue
    const job = ()=>{
        // set newValue
        newValue = effectFn()

        // execute expiration callback
        if(cleanup){
            cleanup()
        }

        cb(newValue, oldValue, onInvalidate)

        // set oldValue
        oldValue = newValue
    }

    // resolve race issue
    let cleanup
    // the third param of watch function
    function onInvalidate(fn){
        cleanup = fn
    }

    const effectFn = effect(
        () => getter(),
        {
            lazy: true,
            scheduler: ()=>{
                // controll scheduler execute time
                // options.flush => 'post' | 'sync' | 'pre'
                if(options.flush === 'post'){
                    const p = Promise.resolve()
                    p.then(job)
                }else{
                    job()
                }
            }
        }
    )

    if(options.immediate){
        job()
    }else{
        // execute effectFn manually, get first render value
        oldValue = effectFn()
    }
}
// collect dependency
function traverse(value, seen = new Set()){
    if(typeof value !== 'object' || value === null || seen.has(value)) return
    // avoid recursive dead loop
    seen.add(value)

    for(const k in value){
        traverse(value[k], seen)
    }

    return value
}


// implement reactive Map and Set
const mutableInsrumentations = {
    add(key){
        const target = this.raw
        const res = target.add(key)

        const hadKey = target.has(key)
        if(!hadKey){
            trigger(target, 'ADD', key)
        }

        // Implement chain calling
        return res
    },
    delete(key){
        const target = this.raw
        const res = target.delete(key)

        const hadKey = target.has(key)
        if(hadKey){
            trigger(target, 'ADD', key)
        }

        // Implement chain calling
        return res
    },
    get(key){
        const target = this.raw
        const hadKey = target.has(key)
        if(hadKey){
            const res = target.get(key)
            return typeof res === 'object' ? reactive(res) : res
        }
        // return undefined if !hadKey
    },
    set(key, value){
        const target = this.raw
        const hadKey = target.has(key)
        const oldVal = target.get(key)
        // avoid nest reactive cause data pollution
        const rawValue = value.raw || value
        target.set(key, rawValue)
        if(!hadKey){
            trigger(target, key, 'ADD')
        }else if(oldVal !== value || (oldVal === oldVal && value === value)){
            trigger(target, key, 'SET')
        }
    },
    forEach(callback, thisArg){
        const wrap = (val) => typeof val === 'object' ? reactive(val) : val
        const target = this.raw
        track(target, ITERATE_KEY)
        target.forEach((v, k)=>{
            // implement deep reactive
            callback(thisArg, wrap(v), wrap(k), this)
        })
    },
    [Symbol.iterator]: iterationMethod(),
    entries: iterationMethod(),
    values: iterationMethod('values'),
    keys:iterationMethod('keys')
}

function iterationMethod(type?: string) {
    return ()=>{
        const target = this.raw

        let itr
        switch(type) {
            case 'keys':
                itr = target.keys()
                break
            case 'values':
                itr = target.values()
                break
            default:
                itr = target[Symbol.iterator]();
                break
        }

        const wrap = val => typeof val === 'object' && val !== null ? reactive(val) : val
        
        // Special handling of keys method situations
        track(target, type === 'keys' ? MAP_KEY_ITERATE_KEY : ITERATE_KEY)

        // custom iterator
        return {
            next() {
                const {value, done} = itr.next()
                return {
                    value: type ? wrap(value) : value ? [wrap(value[0]), wrap(value[1])] : value
                    done
                }
            },
            // implement iterative protocol for map.entries
            [Symbol.iterator]() {
                return this
            }
        }
    }
}

function createReactiveMapOrSet(obj, isShallow = false, isReadonly = false){
    return new Proxy(obj, {
        get(target, key, receiver){
            if(key === 'raw') return target
            if(key === 'size'){
                track(target, ITERATE_KEY)
                return Reflect.get(target, key, target)
            }

            return mutableInsrumentations[key]
        }
    })
}


// implement ref
function ref(val) {
    const wrapper = {
        value: val
    }
    // Distinguish between ref and reactive
    Object.defineProperty(wrapper, '__v_isRef', {
        value: true
    })

    return reactive(wrapper)
}

// avoid reactive loss
function toRef(obj, key){
    const wrapper = {
        get value(){
            return obj[key]
        }
        set value(){
            obj[key] = val
        }
    }
    // Distinguish between ref and reactive
    Object.defineProperty(wrapper, '__v_isRef', {
        value: true
    })
    return wrapper
}
// batch keep reactive
function toRefs(obj){
    const ret = {}
    for(const key in obj){
        ret[key] = toRef(obj, key)
    }
    return ret
}

// implement automatic removal of ref(template principle)
function proxyRefs(target){
    return new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver)
            return value.__v_isRef ? value.value : value
        },
        set(target, key, newVal, receiver) {
            const value = target[key]

            if(value.__v_isRef){
                value.value = newVal
                return true
            }

            return Reflect.set(target, key, newVal, receiver)
        }
    })
}
```
