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

[scheduler source url](https://github.com/facebook/react/blob/HEAD/packages/scheduler/src/forks/Scheduler.js)
