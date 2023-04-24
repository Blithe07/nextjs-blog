---
title: "Promise"
date: "2023-04-24"
category: "javascript"
---

## promise

```
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECT = 'reject'

class MyPromise {
  /**
   * 创建Promise
   * @param {Function} executor 立即执行函数
   */
  constructor(executor) {
    // 初始化promise返回状态和数据
    this._state = PENDING
    this._value = undefined
    // 初始化任务执行队列（存放微任务需要执行的任务）
    this._handlers = []
    try {
      // 接收resolve、reject函数
      executor(this._resolve.bind(this), this._reject.bind(this))
    } catch (error) {
      // 处理promise中报错
      this._reject(error)
    }
  }
  /**
   * 静态Promise方法
   * @param {any} data
   */
  static resolve(data) {
    if (data instanceof MyPromise) {
      // 传递的data是Promise，直接返回
      return data
    }
    // 传递的data是Promise Like(符合Promise A+规范)，返回新的promise，状态和数据与上一个一致
    return new MyPromise((resolve, reject) => {
      if (isPromise(data)) {
        data.then(resolve, reject)
      } else {
        resolve(data)
      }
    })
  }
  /**
   * Promise静态方法
   * @param {*} reason
   * @returns
   */
  static reject(reason) {
    // 直接reject
    return new MyPromise((resolve, reject) => {
      reject(reason)
    })
  }
  /**
 * promise成功后须操作
 * @param {Function} onFulFilled
 * @param {Function} onRejected
 */
  then(onFulFilled, onRejected) {
    // 需要根据任务执行状态决定promise的返回状态
    return new MyPromise((resolve, reject) => {
      this._pushHandlers(onFulFilled, FULFILLED, resolve, reject)
      this._pushHandlers(onRejected, REJECT, resolve, reject)
      // 调用then函数的promise已经是已决状态，也需要清空任务队列
      this._runHandlers()
    })
  }
  /**
 * 处理失败情况
 * @param {Function} onRejected
 */
  catch(onRejected) {
    this.then(null, onRejected)
  }
  /**
   * 无论成功失败都执行，并返回Promise
   * @param {Function} onSettled
   */
  finally(onSettled) {
    // finally接收不到上一个promise给到的值，不过还是会处理异常情况(自己throw用自己的错误信息，否则用上一个promise的错误信息)
    // 成功处理函数不处理传递值，失败处理函数返回失败原因
    this.then((data) => { onSettled(); return data }, (reason) => { onSettled(); throw reason })
  }
  /**
   * 全部任务都需要成功，否则返回第一个失败状态
   * @param {Iterable} proms
   * @returns
   */
  static all(proms) {
    return new MyPromise((resolve, reject) => {
      // 返回数组
      const results = []
      // 记录promise全部数量
      let count = 0
      // 记录成功的promise数量
      let fulfilledCount = 0
      for (const p of proms) {
        // 通过索引去使返回数组有序，否则如果存在宏任务中调用resolve会导致顺序错乱
        let i = count
        count++;
        // 通过Promise.resolve保证传入的数据一定是promise
        // 传入reject作为then中第二个参数保证数据异常后返回第一个失败状态
        MyPromise.resolve(p).then((data) => {
          fulfilledCount++
          results[i].push(data)
          if (fulfilledCount === count) {
            // 全部任务都成功
            resolve(results)
          }
        }, reject)
      }
    })
  }
  /**
   * 全部任务都处于已决状态
   * @param {Iterable} proms
   */
  static allSettled(proms) {
    const ps = []
    for (const p of proms) {
      ps.push(MyPromise.resolve(p).then(
        // 返回成功格式数据
        (value) => ({ status: FULFILLED, value }),
        // 返回失败格式数据
        (reason) => ({ status: REJECT, reason })
      ))
    }
    // ps数组中都是成功状态的promise
    return MyPromise.all(ps)
  }
  /**
   * 返回第一个完成的任务(不管失败还是成功)
   * @param {Iterable} proms
   */
  static race(proms) {
    return new MyPromise((resolve, reject) => {
      for (const p of proms) {
        // 与all相反，该执行语句会直接返回第一个完成的任务
        MyPromise.resolve(p).then(resolve, reject)
      }
    })
  }
  /**
   * 向处理队列中添加任务
   * @param {Function} executor 添加函数
   * @param {String} state 执行状态
   * @param {Function} resolve 将promise状态设为成功，用于then函数后续决定返回promise状态
   * @param {Function} reject 将promise状态设为失败，用于then函数后续决定返回promise状态
   */
  _pushHandlers(executor, state, resolve, reject) {
    this._handlers.push({
      executor,
      state,
      resolve,
      reject
    })
  }
  /**
   * 执行队列函数
   */
  _runHandlers() {
    if (this._state === PENDING) { return }
    // 避免for...of循环中使用shift导致bug
    // eg: const arr = [1,2,3]; for(item of arr){arr.shift()}    =>   expect: []  get: [3]
    while (this._handlers[0]) {
      // 执行promise后续函数
      this._runHandler(this._handlers[0])
      // 清空已经处理过的函数
      this._handlers.shift()
    }
  }
  /**
   * 处理一个传递函数
   * @param {any} executor
   * @param {String} executor
   * @param {Function} executor
   * @param {Function} executor
   */
  _runHandler({ executor, state, resolve, reject }) {
    runMicroTask(() => {
      // 处理函数的状态和当前promise状态不一致
      if (this._state !== state) { return }
      // 处理无效的executor，返回上一个Promise的数据和状态
      if (typeof executor !== 'function') {
        this._state === FULFILLED ? resolve(this._value) : reject(this._value)
      }
      // 执行handler中的executor
      try {
        // 解构参数避免this指向问题，也可以通过bind解决问题
        const result = executor(this._value)
        if (isPromise(result)) {
          // 如果返回数据是Promise，保持状态和数据和上一步一致
          result.then(resolve, reject)
        } else {
          // 返回executor返回值给后续promise
          resolve(result)
        }
      } catch (error) {
        // 执行过程中出错
        reject(error)
      }
    })
  }
  /**
   * 标记当前任务完成
   * @param {any} data 成功返回数据
   */
  _resolve(data) {
    this._changeState(FULFILLED, data)
  }
  /**
   * 标记当前任务失败
   * @param {any} reason 失败返回原因
   */
  _reject(reason) {
    this._changeState(REJECT, reason)
  }
  /**
   * 改变状态和数据
   * @param {String} state 状态
   * @param {any} value 数据
   */
  _changeState(state, value) {
    if (this._state !== PENDING) { return }
    this._state = state
    this._value = value
    // 延迟改变promise的已决状态，需要清空任务队列
    this._runHandlers()
  }
}

/**
 * 将任务放入微任务队列中
 * @param {Function} callback
 */
function runMicroTask(callback) {
  if (process.nextTick) {
    process.nextTick(callback)
  } else if (MutationObserver) {
    const p = document.createElement('p')
    const observer = new MutationObserver(callback)
    observer.observe(p, { childList: true })
    p.innerHTML = 1
  } else {
    setTimeout(callback, 0)
  }
}

/**
 * 判断是否为Promise
 * @param {*} obj
 * @returns
 */
function isPromise(obj) {
  return !!obj && typeof obj === 'function' && typeof obj.then === 'function'
}
```
