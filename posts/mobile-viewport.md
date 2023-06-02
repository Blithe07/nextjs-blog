---
title: "Mobile Viewport"
date: "2023-06-02"
category: "mobile"
---

## category

- layout viewport

        mobile browser default viewport(980px, window.innerWidth)

- visual viewport

        mobile browser visible area size(css pixels : device pixels = 1 : 1)

- ideal viewport

        mobile device perfectly adapted viewport(css pixels : device pixels = 1 : adapted)

## attributes

<meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-sacle=1.0,maximum-scale=1.0,user-scalable=no/yes">

**width=device-width** fixed iphone,ipad issue. `width` is to set viewport width.

**initial-scale=1** fixed ie issue. `initial-scale` is to set ideal viewport width.

The higher the value between `width` and `initial-scale`, the higher the priority

## about scale

Mobile browser scale page automatically by scale value.

scale value = ideal viewport width / layout viewport width
