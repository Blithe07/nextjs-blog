---
title: "Micro Front-end"
date: "2023-05-07"
category: "engineer"
---

## Introduction

Micro front-end is an architectural style that combines independently delivered front-end applications into a larger whole.
Ensure product experience while improving development experience.

Load sub applications through the `loader` in the main application, determine the loading time of sub applications through the `router`, and handle cross application data sharing through the `store`.
Split the front-end application into multiple sub applications that can be independently run and maintained without user awareness.

![Micro Structure](/images/micro-structure.png)

Advantage:
    - unlimit technology stack
    - independent developed and deployed
    - independent runtime 
    - incremental upgrade

Application:
    - compatible with legacy system
    - application aggregation
    - developed jointly by different teams

## Thought

1. Routing distributed. Through the reverse proxy function of the HTTP server, the request is routed to the corresponding application.
2. Front-end microserivces. 

## Implement

1. MPA
2. server side combination(insert template variables into page)
3. build combination
    1. build child application to npm package, import as dependency in main application
    2. webpack5 module federation
        - EMP: A microfront-end framework based on module federation capability
4. runtime combination
    1. iframe
    2. load child application by JS

        Each sub application exposes the corresponding lifecycle hooks according to the convention, and after loading, binds them to the window object for the main application to access. Then the main application determines which sub application to render and calls the relevant rendering function to pass it to the rendering node.

    3. qiankun

        Implement binding relationship between routing and sub applications based on single spa, load corresponding applications according to routing.

        The sub application register its own information with the main application, including entry file address, corresponding effective routing and namespace information.
        At the same time, the sub application needs to expose several key lifecycle hooks `bootstrap`, `mount`, and `unmount` for the main application to call at the appropriate time.

        CSS Isolation Scheme: Isolate by adding specific prefixes to each CSS rule.

        ![Micro qiankun](/images/micro-qiankun.png)

    4. wenjie

        Implement JS sandbox based on iframe and handle CSS isolation through WebComponent.

        Dynamically load sub application resources at runtime, and create a `shadowdom` node and an `iframe` in the main application.
        Inject JavaScript into the iframe and run it, placing the dom and CSS under the shadow dom node. Simultaneously hijack dom operations in JavaScript and point to shadowdom.

        In terms of routing status, the child application's `URL` is synchronized to the main application's `query` parameter by hijacking the `iframe`'s `history.pushState` and `history.replaceState`.
        When refreshing the browser to initialize the `iframe`, the child application's `URL` is read back and synchronized using the `iframe`'s `history.replaceState`.

        ![Micro wenjie](/images/micro-wenjie.png)
    
    5. micro-app

        Drawing inspiration from the idea of WebComponent, the micro front-end is encapsulated into a WebComponent like component through the combination of Custom Element and custom ShadowDom, thereby achieving componentized rendering of the micro front-end.
        And due to the isolation feature of custom ShadowDom, micro app does not require sub applications to modify rendering logic and expose methods like single spa and qiankun, nor does it require modification of webpack configuration, resulting in lower access costs.

        ![Micro app](/images/micro-app.png)