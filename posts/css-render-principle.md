---
title: "CSS render principle"
date: "2023-05-06"
category: "css"
---

## Browser structure

- User Interface: feature option like url input、bookmark、history
- Browser engine: transfer directive between user interface and rendering engine or operate data in local cache. The core of communication.
- Rendering engine: analysis DOM and CSS, then compose them in page
- Networking: module of send request and download resource
- Javascript interpreter: analysis and execute js script
- UI Backend: paint base component like select、button、input
- Data Persistence: Cookie、Storage. call them through browser engine api

## CSS property

1. priority

  <table>
    <tr>
      <th>selector</th>
      <th>priority</th>
    </tr>
    <tr>
      <td>!important</td>
      <td>+infinity</td>
    </tr>
    <tr>
      <td>inline style</td>
      <td>1000</td>
    </tr>
    <tr>
      <td>inline style</td>
      <td>1000</td>
    </tr>
    <tr>
      <td>id</td>
      <td>100</td>
    </tr>
    <tr>
      <td>class/pseudo class/attribute</td>
      <td>10</td>
    </tr>
    <tr>
      <td>element/pseudo element</td>
      <td>1</td>
    </tr>
    <tr>
      <td>*/child selector/adjacent selector</td>
      <td>0</td>
    </tr>
  </table>

2. inheritance attribute   
    1. font-family、font-size、font-weight and so on that startWith `f` style
    2. text-align、text-indent and so on that startWith `t` style
    3. color、visibility

## CSS execute order

> The rule of browser CSS matching core algorithm is to match nodes from right to left.

## Efficient ComputedStyle

1. TagName and class attribute must be same.
2. Cannot have a `style` attribute. Even if the style are equal.
3. Cannot use sibling selector.
4. mappedAttribute must be same.

## CSS writing order

The browser doesn't parse the CSS style immediately when get it, but depend on the structure of DOM tree and then start to traverse the CSS style of each tree node to enter the parsing. At this time, the CSS style traversal order is completely in accordance with the previous order.

> During the parsing process, once the browser finds that the positioning change of an element affects the layout, it needs to go back and re-render.

The suggested order is roughly as follows:
  1. position attribute
  2. self attribute
  3. font style
  4. text attribute
  5. css3 attribute

> Best practices: CSSLint

## Optimization Strategy

1. use id selector efficient, don't specify both id and tagName
2. avoid deep level node
3. don't use attribute selector
4. put browser prefix first and standard style attribute last
5. follow CSSLint rule
6. less css document size
7. css will change
8. don't use @import
9. avoid reflow/rearrange too much time
10. use `computedStyle` efficient
11. less expensive attribute like `box-shadow`, `border-radius`, `filter`, `:nth-child`
12. dependency inheritance
13. follow css order rule
