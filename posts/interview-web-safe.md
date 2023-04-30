---
title: "Web Safe"
date: "2023-04-29"
category: "interview"
---

## SQL Inject

The core is to enable the web server to execute the SQL statements expected by the attacker.

## XSS Attack(Cross Site Scripting)

The core is insert executable script code into page. There are two XSS type as follows:

1. Reflect  
   ![XSS Reflect](/images/xss-reflect.png)
2. Storage  
   ![XSS Storage](/images/xss-storage.png)

## CSRF Attack(Cross Site Request Forgery)

![CSRF](/images/csrf.png)

## DDoS Attack(Distributed Denial of Service)

Attackers constantly make service requests, preventing legitimate user requests from being processed in a timely manner.

## DNS hijacking

![DNS hijacking](/images/dns-hijacking.png)

## JSON hijacking

Malicious attackers intercept JSON data that should have been returned to the user through certain specific means, and instead send the data back to the malicious attacker.

## HTTP header trace bug

HTTP/1.1 specification define HTTP TRACE method.  The response from server will contain header info like token or cookie which is danger.