---
title: "HTTP"
date: "2023-04-26"
category: "browser"
---

## HTTP Message Structure

---

TCP: header + body   
http: start line + header + black row + entity

---

### Start line

In the starting line, each two parts should be separated by a space, and the last part should be followed by a new line, strictly following the ABNF syntax specification.

- request: method + path + http version  eg: GET /home HTTP/1.1
- response: http version + status code + reason  eg: HTTP/1.1 200 OK  

### Header

Field Name + ":" +Field Value + CRLF

### Black row

Used to distinguish between the header and the entity(!important)

### Entity

- request: request body
- response: response body

## HTTP Method

### Request Method(http/1.1)

- GET: get resource
- Head: get meta
- POST: commit data
- PUT: update data
- DELETE: delete data
- CONNECT: establish a connection tunnel for proxy server
- OPTIONS: used for cross domain requests
- TRACE: trace request-response transmission path

### Difference between GET and POST

- cache: GET will be cached by browser and leave a historical record. POST won't.
- encode: GET only encode URL and only accept ASCII character. POST none limit.
- param: GET put param in url, so it's unsafe. POST put param in body, so it's safe(relative)
- idempotent: GET is idempotent. POST isn't.(idempotent mean same input same output)
- TCP: GET send request message once. POST send two TCP data packet(send header first and after server response 100, send body).