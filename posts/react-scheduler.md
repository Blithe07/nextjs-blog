---
title: "Scheduler(React)"
date: "2023-04-11"
---

## Principle

### unstable_scheduleCallback(Main Function)

divided into delayed task and normal task by startTime and then push into timerQueue or taskQueue. Finally execute corresponding function(delayed: `requestHostTimeout`,normal: `requestHostCallback`).

```
function unstable_scheduleCallback(priorityLevel,callback,options?:{delay:number}){
  var currentTime = performance.now();
  var startTime = options?.delay ? currentTime + delay : currentTime
  var timeout;
  switch (priorityLevel) {
    // According to priorityLevel, set timeout value(number)
  }
  var newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: startTime > currentTime ? startTime : expirationTime(startTime+timeout),
  }
  if(startTime > currentTime){
    // delay
    push(timerQueue,newTask);
    // peek: get minHeap top
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // All tasks are delayed, and this is the task with the earliest delay.
      if (isHostTimeoutScheduled) {
        // Cancel an existing timeout.
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      // Schedule a timeout.
      // handleTimeout: if taskQueue.length > 0, execute `requestHostCallback` otherwise peek timerQueue execute `requestHostTimeout`
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  }else{
    // normal
    push(taskQueue, newTask);
    // Schedule a host callback, if needed.
    if (!isHostCallbackScheduled) {
      isHostCallbackScheduled = true;
      // flushWork: callback which return boolean meaning if there are more tasks
      requestHostCallback(flushWork);
    }
  }
  return newTask
}
```

### requestHostCallback

set scheduledHostCallback(global variable) to flushWork and then startup a macro task(setImmediate,messageChannel,setTimeout) execute `performWorkUntilDeadline`

### performWorkUntilDeadline

If scheduledHostCallback(flushWork) isn't null, keep track of startTime(global variable) so we can measure how long the main thread has been blocked. execute `scheduledHostCallback` , determine whether to create a macro task based on the return value

```
function performWorkUntilDeadline(){
    if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    startTime = currentTime;
    const hasTimeRemaining = true;
    // If a scheduler task throws, exit the current browser task so the
    // error can be observed.
    // Intentionally not using a try-catch, since that makes some debugging
    // techniques harder. Instead, if `scheduledHostCallback` errors, then
    // `hasMoreWork` will remain true, and we'll continue the work loop.
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        // If there's more work, schedule the next message event at the end of the preceding one.
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      }
    }
  } else {
    isMessageLoopRunning = false;
  }
  // Yielding to the browser will give it a chance to paint, so we can reset this.
  // needsPaint: if true, give control to main thread
  needsPaint = false;
}
```

### flushWork

Control global variable and return `workLoop`.

### workLoop

A while loop ensure get task from taskQueue or timerQueue, but will break with some limit.

```
function workLoop(hasTimeRemaining: boolean, initialTime: number) {
  let currentTime = initialTime;
  // pop timerQueue and push into taskQueue which aren't expired
  advanceTimers(currentTime);
  currentTask = peek(taskQueue);
  while (currentTask !== null && !isSchedulerPaused) {
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      // This currentTask hasn't expired, and we've reached the deadline.
      break;
    }
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      // pass boolean to executor
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (typeof continuationCallback === 'function') {
        // If a continuation is returned, immediately yield to the main thread
        // regardless of how much time is left in the current time slice.
        currentTask.callback = continuationCallback;
        advanceTimers(currentTime);
        return true;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  // Return whether there's additional work
  if (currentTask !== null) {
    return true;
  } else {
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}
```

### advanceTimers

Pop timerQueue and push into taskQueue and with limit.

```
function advanceTimers(currentTime: number) {
  // Check for tasks that are no longer delayed and add them to the queue.
  let timer = peek(timerQueue);
  while (timer !== null) {
    if (timer.callback === null) {
      // Timer was cancelled.
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // Timer fired. Transfer to the task queue.
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      // Remaining timers are pending.
      return;
    }
    timer = peek(timerQueue);
  }
}
```

### shouldYieldToHost

Determine whether to yield control of the main thread.

```
function shouldYieldToHost(): boolean {
  // startTime(global variable)
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    // The main thread has only been blocked for a really short amount of time;
    // smaller than a single frame. Don't yield yet.
    return false;
  }

  // The main thread has been blocked for a non-negligible amount of time. We
  // may want to yield control of the main thread, so the browser can perform
  // high priority tasks. The main ones are painting and user input. If there's
  // a pending paint or a pending input, then we should yield. But if there's
  // neither, then we can yield less often while remaining responsive. We'll
  // eventually yield regardless, since there could be a pending paint that
  // wasn't accompanied by a call to `requestPaint`, or other main thread tasks
  // like network events.
  if (enableIsInputPending) {
    if (needsPaint) {
      // There's a pending paint (signaled by `requestPaint`). Yield now.
      return true;
    }
    if (timeElapsed < continuousInputInterval) {
      // We haven't blocked the thread for that long. Only yield if there's a
      // pending discrete input (e.g. click). It's OK if there's pending
      // continuous input (e.g. mouseover).
      if (isInputPending !== null) {
        return isInputPending();
      }
    } else if (timeElapsed < maxInterval) {
      // Yield if there's either a pending discrete or continuous input.
      if (isInputPending !== null) {
        return isInputPending(continuousOptions);
      }
    } else {
      // We've blocked the thread for a long time. Even if there's no pending
      // input, there may be some other scheduled work that we don't know about,
      // like a network event. Yield now.
      return true;
    }
  }
  // `isInputPending` isn't available. Yield now.
  return true;
}
```

### requestHostTimeout

Startup a timeout function and pass execute function `handleTimeout`.

```
function requestHostTimeout(
  callback: (currentTime: number) => void,
  ms: number,
) {
  taskTimeoutID = localSetTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}
```

### handleTimeout

Put due tasks in the taskQueue. When taskQueue is empty, handle timerQueue if timerQueue isn't empty.

```
function handleTimeout(currentTime: number) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);
  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}
```
 
[scheduler source url](https://github.com/facebook/react/blob/HEAD/packages/scheduler/src/forks/Scheduler.js)
