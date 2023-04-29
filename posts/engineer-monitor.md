---
title: "FrontEnd Monitor"
date: "2023-04-29"
category: "engineer"
---

## Purpose

1. imporve user experience
2. find error faster
3. understand business data and guide product upgrades

## Process

1. collect

   1. environment info
      1. url: window.location.href
      2. ua(userAgent): window.navigator.userAgent
      3. token
   2. performance info

      1. index(time)

         1. networkInfo(built in window.performance.timing)
            1. redirect: redirectEnd - redirectStart
            2. dns analysis: domainLookupEnd - domainLookupStart
            3. TCP connect: connectEnd - connectStart
            4. SSL connect: connectEnd - secureConnectionStart
            5. TTFB network(browser accept first byte): responseStart - requestStart
            6. data transmission: responseEnd - responseStart
            7. resource loaded: loadEventStart - domContentLoadedEventEnd
         2. pageInfo
            1. FP(first paint):
               ```
               window.performance.getEntriesByType('paint')[0].startTime
               ```
            2. FCP(first contentful paint):
               ```
               window.performance.getEntriesByType('paint')[1].startTime
               ```
            3. LCP(largest contentful paint):
               ```
               function getLCP() {
                  // 增加一个性能条目的观察者
                  new PerformanceObserver((entryList, observer) => {
                      let entries = entryList.getEntries();
                      const lastEntry = entries[entries.length - 1];
                      observer.disconnect();
                      console.log('LCP', lastEntry.renderTime || lastEntry.loadTime);
                  }).observe({entryTypes: ['largest-contentful-paint']});
               }
               ```
            4. FMP(first meaningful paint)
               ```
               function getFMP() {
                   let FMP;
                   new PerformanceObserver((entryList, observer) => {
                       let entries = entryList.getEntries();
                       observer.disconnect();
                       console.log('FMP', entries);
                   }).observe({entryTypes: ['element']});
               }
               ```
            5. DCL(dom content loaded)
               ```
               // built in window.performance.timing
               domContentLoadEventEnd – fetchStart
               ```
            6. L(onLoad)
               ```
               // built in window.performance.timing
               loadEventStart – fetchStart
               ```
            7. TTL(time to interactive)
               ```
               // built in window.performance.timing
               domInteractive – fetchStart
               ```
            8. FID(first input delay)
               ```
               function getFID() {
                   new PerformanceObserver((entryList, observer) => {
                       let firstInput = entryList.getEntries()[0];
                       if (firstInput) {
                           const FID = firstInput.processingStart - firstInput.startTime;
                           console.log('FID', FID);
                       }
                       observer.disconnect();
                   }).observe({type: 'first-input', buffered: true});
               }
               ```
         3. errorInfo

            1. runtime
               1. non promise
                  ```
                  function listenerError() {
                      window.addEventListener('error', (event) => {
                          if (event.target.localName) {
                              console.log('source error', event);
                          }
                          else {
                              console.log('code error', event);
                          }
                      }, true)
                  }
                  ```
               2. promise(if promise was rejected without a reject processor)
                  ```
                  function listenerPromiseError() {
                      window.addEventListener('unhandledrejection', (event) => {
                          console.log('promise error', event);
                      })
                  }
                  ```
            2. interface

               ```
               function newXHR() {
                   const XMLHttpRequest = window.XMLHttpRequest;
                   const oldXHROpen = XMLHttpRequest.prototype.open;
                   XMLHttpRequest.prototype.open = (method, url, async) => {
                       // Data reporting operation
                       // ...
                       return oldXHROpen.apply(this, arguments);
                   }

                   const oldXHRSend = XMLHttpRequest.prototype.send;
                   XMLHttpRequest.prototype.send = (body) => {
                       // Data reporting operation
                       // ...
                       return oldXHRSend.apply(this, arguments);
                   }
               }
               ```

         4. businessInfo:By obtaining this business information, we can have a clearer understanding of the current product situation, so that product managers can better plan the future direction of the product.

2. upload
    1. Ajax
    2. Image
        - Why use image to report?
            1. non cross domain issues.
            2. won't block page loading.(new Image())
        - Why gif?
            1. size small.
3. analysis
    1. stand-alone: Websites with low traffic and few logs.
    2. colony: Websites with high traffic and logs.
4. warning
    1. mail
    2. message
    3. telephone
