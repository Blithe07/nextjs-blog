---
title: "Database Advanced(Incomplete)"
date: "2023-05-31"
category: "database"
---

## Paging

### skip + limit

```
db.user.find().skip(pageNum * (n-1)).limit(pageSize)
```

### find + limit

last_id is MongoDB ObjectId type data that composed of timestamp、machinid、processid、counter.

```
db.user.find({'_id' > last_id}).limit(pageSize)
```

## Associative Query

### aggregate function

count, sum, avg, min, max 

### aggregate pipe

In order to improve performance, the best strategy is to use indexes for filtering, exclude records that don't meet the conditions, and reduce the workload of subsequent processes.

```
db.orders.aggregate([
    { $match: { status: { $in: ['A', 'B', 'C'] } } },
    { $group: { _id: '$status' , totalAmount: { $sum: '$amount'} } }
])
```

### MapReduce

1. query
2. map
3. reduce
4. secondary handle(optional)
4. return result

### incidence relation

1. one-to-one
2. one-to-many
3. many-to-many

## Transaction

A series of operations performed by a single logical unit of work. It must meet 4 attributes.
    1. Atomicity
    2. Consistency
    3. Isolation
    4. Durability

## Performance Tuning

Locate slow queries through **profile** and then find reason by **explain**.

```
// 0: off profile
// 1: record slow queries. By default, queries that take more than 100ms are defined as slow queries.
// 2: record all queries
// 3: query sampling records

// open profile
db.setProfilingLevel(2, 20)

// determine if it is enabled
db['system.profile'].find()

// open global
mongod --profile 1 --slowms100
```

### Index Tuning

Index is like directory that can increasing query speed.

According to application layer requirements, indexes are divided into unique indexes, sparse indexes, multikey indexes, and other types.