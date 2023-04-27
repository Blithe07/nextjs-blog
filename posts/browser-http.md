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

## URI

> structure: `scheme + :// + user:passwd@(optional,unsafe) + host:post + path + ?query + #hash`

## HTTP Status Code

RFC stipulates that HTTP status codes are three digits and be divided to five items.

- 1xx: intermediate state of protocol processing
- 2xx: success
- 3xx: redirection
- 4xx: request message error
- 5xx: server error

### 1xx

- 101: Switching Protocols. When HTTP upgrade to WebSocket and server allow.

### 2xx

- 200: OK. Success with data
- 204: No Content. Success without data
- 206: Partial Content. The usage scenarios are HTTP chunk download and resumable upload.

### 3xx

- 301: Moved Permanently. Browser will cache new web site and access redirect address next time automatically.
- 302: Found/Moved Temporarily. Redirect to new address temporarily.
- 304: Not Modified. Negotiation cache.

### 4xx

- 400: Bad Request. Request error. 
- 401: Unauthorized. 
- 403: Forbidden. Server no access.
- 404: Not Found. Resource none found.
- 405: Method Not Allowed.

### 5xx

- 500: Internal Server Error.
- 502: Bad Gateway.
- 503: Service Unavailable.

## HTTP Feature And Defect

### Feature

- flexible and expandable
- reliable transmission
- requset-response
- none state

### Defect

- none state: This is a flaw in long lived connection scenarios if the context need to be saved to avoid redundant message.
- clear text transmission: Use text but no binary data in protocol message. Convenient to debug, but messages are exposed.
- head of line blocking: When http opens a long connection, share a TCP connection.

## Accept Series

### Content-Type/Accept

- text: text/html , text/plain , text/css ...
- image: image/gif , image/png , image/jpeg ...
- audio/video: audio/mpeg , video/mp4 ...
- application: application/json , application/javascript , application/pdf ...

### Content-Encoding/Accept-Encoding

- gzip(default)
- defalte
- br

### Charset(special)

- send site: Content-Type: text/html; charset=utf-8
- accept site: Accept-Charset: charset=utf-8

## HTTP2

feature:   
- Binary: Meaning commands use 1s and 0s and not text.
- Multiplex: Permits multiple requests and responses to be sent at the same time.
- Compression: Compresses headers that have been requested previously to make things more efficient.
- Stream prioritization: This allows for the exchange of successive streams at one time.
- Server push: The server can send additional information needed for a request before it is requested.
- Increased security: HTTP/2 is supported through encrypted connections.
