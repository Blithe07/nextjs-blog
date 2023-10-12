---
title: 'Spring'
date: '2023-10-12'
category: "server"
---

## IOC(Inversion of Control)

The container then injects those dependencies when it creates the bean. This process is fundamentally the inverse, hence the name Inversion of Control (IoC), of the bean itself controlling the instantiation or location of its dependencies by using direct construction of classes, or a mechanism such as the Service Locator pattern.

![IOC](/images/spring-ioc.jpg)

## DI(Dependency Injection)

A process whereby objects define their dependencies, that is, the other objects they work with, only through constructor arguments, arguments to a factory method, or properties that are set on the object instance after it is constructed or returned from a factory method.

## AOP(Aspect-oriented Programming)

Aspect-oriented Programming complements Object-oriented Programming by providing another way of thinking about program structure.

The key unit of modularity in OOP is the class, whereas in AOP the unit of modularity is the aspect.

some central AOP concepts and terminology:
  - Aspect: A modularization of a concern that cuts across multiple classes.
  - Join point: A point during the execution of a program, such as the execution of a method or the handling of an exception.
  - Advice: Action taken by an aspect at a particular join point.
  - Pointcut: A predicate that matches join points.
  - Introduction: Declaring additional methods or fields on behalf of a type.
  - Target object: An object being advised by one or more aspects.
  - AOP proxy: An object created by the AOP framework in order to implement the aspect contracts (advise method executions and so on). In the Spring Framework, an AOP proxy is a JDK dynamic proxy or a CGLIB proxy.
  - Weaving: linking aspects with other application types or objects to create an advised object.