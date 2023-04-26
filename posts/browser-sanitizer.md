---
title: "Browser Sanitizer API"
date: "2023-04-26"
category: "browser"
---

## Introduction

To build powerful processor, for safer insertion of arbitrary strings into HTML pages.

Specific implement: omit tags and attributes considered risky and keep the safe one.

## Usage

```
// 1. generate <div><em>hello world</em><img src=""></div>
$div.setHTML(`<em>hello world</em><img src="" onerror=alert(0)>`, new Sanitizer())

// 2. generate <div><em>hello world</em><img src=""></div>
new Sanitizer().sanitizeFor("div",`<em>hello world</em><img src="" onerror=alert(0)>`)
```
## Config

[Sanitizer Config](https://developer.mozilla.org/en-US/docs/Web/API/Sanitizer/Sanitizer)

## Tips

Pay attention to compatibility issues

- Chrome: 105+
- Edge: 105+
- Other Browser: none support
