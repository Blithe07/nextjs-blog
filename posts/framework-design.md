---
title: "The core elements of framework design"
date: "2023-04-23"
category: "framework"
---

## Framework Design

1. Improve ux(user experience). Provide warn message friendly make user locate the problem quickly.
2. Control the size of framework code. Use plugin like Wepack `DefinePlugin` to control code whether is exist in production environment.
3. Tree shaking. Remove code that will never be used.(premise: ESM) Also can using `/*#__ PURE__*/` notes mark code to achieve tree shaking.
4. Output build product type. iife/esm/cjs. And then we can use build product at various scenarios.
5. Switch of feature. This mechanism provides flexibility for framework. We can close the feature which don't need like option Api or legacy Api.
6. Error boundary. Excellent frameworks provide default error handling interfaces and also can give the control to user.(Vue3 `callWithErrorHanling`)
7. Type support of typescript. Improve code maintainability and avoid low-level bugs.
