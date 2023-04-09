---
title: "Virtual DOM"
date: "2023-04-09"
---

## Diff for vdom and js object

vdom is a coding thought, usve it to desribe real dom. js object is a specific implementation.

## superiority of virtual dom 

1.compare with dom's size and speed(fast for update,not for create,create is slower)
<table border=1>
    <thead>
        <th>create</th>
        <th>innerHTML</th>
        <th>virtual dom</th>
    </thead>
    <tbody>
        <tr>
            <td>js</td>
            <td>parse string</td>
            <td>create object</td>
        </tr>
        <tr>
            <td>dom</td>
            <td>create node</td>
            <td>create node</td>
        </tr>
    </tbody>
</table>
<table border=1>
    <thead>
        <th>update</th>
        <th>innerHTML</th>
        <th>virtual dom</th>
    </thead>
    <tbody>
        <tr>
            <td>js</td>
            <td>parse string</td>
            <td>create object</td>
        </tr>
        <tr>
            <td>dom</td>
            <td>delete node</td>
            <td>update designated node</td>
        </tr>
          <tr>
            <td>dom</td>
            <td>create node</td>
            <td></td>
        </tr>
    </tbody>
</table>

2.multi platform rendering abstraction capability          
- browser、nodejs(ReactDOM)         
- native(ReactNative)   
- canvas、svg(ReactArt)
- testing(ReactTest)