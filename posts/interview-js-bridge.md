---
title: "JS Bridge"
date: "2023-05-07"
category: "interview"
---

## Introduction

JSBridge, as a bridge between JavaScript and Native, appears to allow JavaScript to call Native functions, but it's core is to establish a bidirectional communication channel for messages between Native and non Native.

There are two ways for JSBridge to implement JavaScript calls:

    - JavaScript calling Native
    - Native calling JavaScript

## What's WebView 

WebView is a native system technology used for embedding mobile apps into the web, which is achieved by incorporating a high-performance webkit kernel browser that is typically encapsulated as a WebView component in the SDK.

The advantage of WebView is that it can provide more convenient app updates when page layout or business logic needs to be updated.

## JavaScript calling Native

- inject API
    import js-sdk
- hijack URL Scheme
    URL Scheme:
        The format of the URL Scheme is similar to that of a regular URL, with the main difference being that the `protocol` and `host` are generally customized for the corresponding APP.
    hijack principle(like jsonp):
        The web end sends a URL Scheme request through some means (such as iframe.src), and then Native intercepts the request and performs corresponding operations based on the URL Scheme and the parameters carried.
- popup interception
    Using popup like prompt、confirm、alert, to trigger WebView corresponding events to achieve

## Native calling JavaScript

The essence is to perform concatenation of JavaScript String (like `eval`). Different systems have corresponding methods for executing JavaScript scripts.