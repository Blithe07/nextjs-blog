---
title: "Mobile Event"
date: "2023-06-06"
category: "mobile"
---

## Event Type

- touchstart
- touchmove
- touchend

## Event Object

- changedTouches: finger list that trigger current event
- targetTouches: finger list that located on the current DOM element
- touches: finger list that located on the current screen

## Click Event Delay

Click event will delay 300ms to execute if meta `viewport` doesn't exists.

trigger order: touchstart -> touchend -> mousedown -> click -> mouseup

## Event Penetration

concept: Triggering a touch event when the top-level overlapping element is bound to a touch event and the low-level overlapping element is bound to a click event will cause the click event to be triggered.

principle: Because of click event delay and trigger order.

solution: Cancel event default behavior.