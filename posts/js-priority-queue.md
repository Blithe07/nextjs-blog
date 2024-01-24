---
title: "Algorithm Priority Queue"
date: "2024-01-24"
category: "javascript"
---

## step

- pop. use the last instead of the top of heap and then adjust to heap.
- push. push new elemnent to the end and then adjust to heap.
- query. query the top of heap.

## implement

```
// arr: container of value
// n: number of node
// swap: a function which can complete swap node
function sink(k){
    while(2 * k <= n){
        // define swap node index
        let j = 2 * k
        // right > left
        if(j < n && arr[j] < arr[j+1]){
            j++
        }
        // parent >= child
        if(arr[k] >= arr[j]){
            break
        }
        // child > parent
        else{
            swap(arr, j, k)
        }
        // parent sink
        k = j
    }
}

function swim(k){
    // k/2 = Math.floor(k/2)
    while(k > 1 && arr[k] > arr[k/2]){
        swap(arr, k, k/2)
        k = k/2
    }
}
```

## analysis(Time Complexity)

search: n nodes => O(1)
operate: n nodes => O(logn)