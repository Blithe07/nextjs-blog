---
title: "Vue Reactivity 3.4.x"
date: "2024-03-06"
category: "vue"
---

## reactive

### createReactiveObject

* use `Proxy` and pass specific `ProxyHandler` to implement data reactive
* use `WeakMap` to cache data that has been proxied

## baseHandlers

work for `Object` and `Array`

### BaseReactiveHandler

* a class that implements `ProxyHandler`
* rewrite `get` method and return the result of executing `Reflect.get` method
* before return, `track` dependency

#### others
* special handling is required for execute corresponding array method   
    1. ['includes', 'indexOf', 'lastIndexOf'], `track` dependency
    2. ['push', 'pop', 'shift', 'unshift', 'splice'], pauses tracking temporarily, execute origin method and then resets the previous global effect tracking state

### MutableReactiveHandler

* a class that extends `BaseReactiveHandler`
* rewrite `set`,`deleteProperty`,`has`,`ownKeys` method, and then return the result of executing `Reflect` corresponding method
* before return, `trigger`<set,deleteProperty> or `track`<has,ownKeys> dependency

### ReadonlyReactiveHandler

* a class that extends `BaseReactiveHandler`
* rewrite `set`,`deleteProperty` method, and then return `true` directly (development env throw warning) 

## collectionHandlers

work for `Map`,`Set`,`WeakMap`,`WeakSet`

* rewrite `get` method and return the result of executing `Reflect.get` method
* different to baseHandlers, the first parameter in the `Reflect.get` method needs to be modified (the implementation principle like baseHandlers)

## reactiveEffect

### targetMap

```typescript
WeakMap<object,Map<any,Map<ReactiveEffect, number> & {
  cleanup: () => void
  computed?: ComputedRefImpl<any>
}>>
```

### track

check which effect is running at the moment and record it as dep which records all effects that depend on the reactive property.

* build targetMap when dependencies are not collected
* exectue `trackEffect`

### trigger

Finds all deps associated with the target (or a specific property) and triggers the effects stored within.

* find deps
* execute `triggerEffects`

## effect

### ReactiveEffect

* deps: (Map<ReactiveEffect, number> & {
  cleanup: () => void
  computed?: ComputedRefImpl<any>
})[]
* dirty check
* run: execute effect fn and execute cleanup function

### effect<function>

registers the given function to track reactive updates

### trackEffect

collect dependency

### triggerEffects

* update dirtyLevel
* if dirty, push scheduler function into `queueEffectSchedulers`
* cleanup queueEffectSchedulers and execute corresponding scheduler

```
// defualt effect scheduler function
() => {
    if (_effect.dirty) {
      _effect.run()
    }
}
```

## effectScope

Creates an effect scope object which can capture the reactive effects (i.e. computed and watchers) created within it so that these effects can be disposed together.

### EffectScope

* `run`: execute fn, record activeEffectScope
* `stop`: cleanup effect

### onScopeDispose

Registers a dispose callback on the current active effect scope. The
 callback will be invoked when the associated effect scope is stopped.


## ref

### RefImpl

* package getter and setter `value` method, `trackRefValue` when read value, `triggerRefValue` when write value.

### trackRefValue

* execute `trackEffect`

### triggerRefValue

* execute `triggerEffects`

## computed

 Takes a getter function and returns a readonly reactive ref object for the
 returned value from the getter. It can also take an object with get and set
 functions to create a writable ref object.

### ComputedRefImpl

* constructor(getter, setter, isReadonly, isSSR)
* use `Object.is` to check dirty value
