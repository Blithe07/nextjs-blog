---
title: "koa principle"
date: "2023-05-05"
category: "server"
---

## application

Class of koa application. Provide `listen`, `use` function after instance created.

```
class Application extends Emitter{
  constructor (options) {
    super()
    // init other attribute ...

    this.middleware = []
    this.context = Object.create(context)
    this.request = Object.create(request)
    this.response = Object.create(response)
  }

  listen (...args) {
    // native httpServer
    const server = http.createServer(this.callback())
    return server.listen(...args)
  }

  use (fn) {
    if (typeof fn !== 'function') throw new TypeError('middleware must be a function!')
    this.middleware.push(fn)
    // support chain call
    return this
  }

  callback () {
    // compose = require('koa-compose')
    const fn = compose(this.middleware)
    
    // handle error 
    if (!this.listenerCount('error')) this.on('error', this.onerror)

    const handleRequest = (req, res) => {
      // init ctx
      const ctx = this.createContext(req, res)
      if (!this.ctxStorage) {
        return this.handleRequest(ctx, fn)
      }
      return this.ctxStorage.run(ctx, async () => {
        return await this.handleRequest(ctx, fn)
      })
    }

    return handleRequest
  }

  handleRequest (ctx, fnMiddleware) {
    const res = ctx.res
    // set default statusCode
    res.statusCode = 404
    const onerror = err => ctx.onerror(err)
    // handle success. set ctx according to scene
    const handleResponse = () => respond(ctx)
    // execute callback if handle stream data
    onFinished(res, onerror)
    return fnMiddleware(ctx).then(handleResponse).catch(onerror)
  }
}
```

koa-compose

```
function compose (middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    // last called middleware
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      // back control
      if (!fn) return Promise.resolve()
      try {
        // Control is handed over to the next middleware
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```

## context

Use `delegates` library to integrate `request` and `response` and provide `onerror` function to catch error.

## request

Based on `node` native code, secondary packaging and ployfill.

## response

Based on `node` native code, secondary packaging and ployfill.
