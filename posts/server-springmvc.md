---
title: 'Spring MVC'
date: '2023-10-13'
category: "server"
---

## Concept

Spring Web MVC is the original web framework built on the Servlet API and has been included in the Spring Framework from the very beginning.

## Section Summary

- [DispatcherServlet](#1)
- [Filters](#2)
- [Annotated&nbsp;Controllers](#3)
- [CORS](#4)

<p id="1">
  <h3>DispatcherServlet</h3>
</p>

It provides a shared algorithm for request processing, while actual work is performed by configurable delegate components. 
dou
The DispatcherServlet, as any Servlet, needs to be declared and mapped according to the Servlet specification by using Java configuration or in web.xml.

![mvc-context-hierarchy](/images/mvc-context-hierarchy.png)

<p id="2">
  <h3>Filters</h3>
</p>

1. `FormContentFilter`: Intercept http request with application/x-www-form-urlencoded,read form data from body,wrap ServletRequest instead of ServletRequest.getParameter*().
2. `ForwardedHeaderFilter`: Servlet filter that modifies the request in order to a) change the host, port, and scheme based on Forwarded headers, and b) to remove those headers to eliminate further impact.
3. `ShallowEtagHeaderFilter`: It creates a “shallow” ETag by caching the content written to the response and computing an MD5 hash from it.
4. `CorsFilter`: Spring MVC provides fine-grained support for CORS configuration through annotations on controllers. However, when used with Spring Security, we advise relying on the built-in CorsFilter that must be ordered ahead of Spring Security’s chain of filters.

<p id="3">
  <h3>Annotated Controllers</h3>
</p>

Spring MVC provides an annotation-based programming model where @Controller and @RestController components use annotations to express request mappings, request input, exception handling, and more.

- `@PathVariable`: path parameters.
- `@RequestParam`: query parameters or form data.
- `@RequestBody`: have the request body read and deserialized into an Object through an HttpMessageConverter.
- `@ResponseBody`: have the return serialized to the response body through an HttpMessageConverter.
- `@CookieValue`: bind the value of an HTTP cookie to a method argument in a controller.
- `@SessionAttributes`: store model attributes in the HTTP Servlet session between requests.(declares the session attributes used by a specific controller)
- `@SessionAttribute`: need access to pre-existing session attributes that are managed globally and may or may not be present.(on a method parameter)
- `@RequestHeader`: bind a request header to a method argument in a controller.

<p id="4">
  <h3>CORS</h3>
</p>

- `@CrossOrigin`: enables cross-origin requests on annotated controller methods.
