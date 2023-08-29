---
title: "Redis"
date: "2023-08-29"
category: "database"
---

## Redis Cache

### Cache Avalanche

Concept: Old cache expired and then before the new cache is set. During this time, all requests that should access the cache go to the database 
will give huge pressure to CPU and memory. Seriously, it will cause database downtime and system crash.

Solution: 
  1. add lock or control the number of thread to read database and write cache by queue when cache expired.
  2. analysis user behavior. set different expire time for different key to make cache expire time as average as possible.


### Cache Penetrate

Concept: The data of user query isn't exist. So the request will go to the database without through cache.

Solution: 
  1. Set default value into cache when query null data from database.
  2. Cache null data.(preview the key)

### Cache Breakdown

Concept: Like `Cache Avalanche`, but for a certain key(hot key) which is accessed very concurrently.

Solution: 
  1. add lock.
  2. set expire time null.

<hr/>

## Distributed Lock

### Conditions

1. Distributed System
2. Share Resource
3. Synchronize Access

### Lock Concept

1. Thread Lock
2. Process Lock
3. Distributed Lock

### Scene

Multiple Process Concurrency.

### Realization

Use a state value to represent the lock, and the occupation and release of the lock are identified by the state value. For example, redis、zookeeper...

The realization base on redis

```
/** add */
// return -> 1: no lock 
// return -> 0: locked 
setnx key value<current Unix time + lock timeout + 1>

/** update */
// return old value
getset key value

/** delete */
del key
```

![redis-lock](/images/redis-lock.jpg)