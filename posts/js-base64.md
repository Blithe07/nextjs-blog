---
title: "Implement Base64"
date: "2023-04-25"
category: "javascript"
---

# Introduction

One of encoding method used to transmit 8 Bit bytecode. Method for representing binary data based on 64 printable characters.

All url can be replaced by base64. In node, use `toString('base64')` method of `buffer` object to implement directly.

# Principle

1. `Buffer.from` get buffer, and transfrom to binary data.
2. concat all,  split to group of six and padStart '0' to eight
3. transfrom to decimal data
4. Take subscript value in base64 Map and concat

# Implement

```
const buf = Buffer.from('哈');  // log: e5 93 88 (hexadecimal data)
// transfrom to binary data
(0xe5).toString(2); // 11100101
(0x93).toString(2); // 10010011
(0x88).toString(2); // 10001000
// concat 111001011001001110001000
// split to group of six
// padStart '0' to eight
// transfrom to decimal data
parseInt('00111001', 2); // 57
parseInt('00011001', 2); // 25
parseInt('00001110', 2); // 14
parseInt('00001000', 2); // 8

// According to base64 composition(A~Za~z0~9+/), take the corresponding subscript value
const base64 = str[57] + str[25] + str[14] + str[8]; // 5ZOI
```
