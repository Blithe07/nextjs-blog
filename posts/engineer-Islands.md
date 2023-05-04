---
title: "Islands structure"
date: "2023-05-05"
category: "engineer"
---

## MPA VS SPA

1. performance: MPA is better than SPA(FP) and SPA is better than MPA(after FP)
2. SEO: MPA is more friendly than SPA
3. router: SPA manage front-end router by routing scheme and MPA doesn't require it
4. state manage: SPA manage state by store and MPA doesn't reuqire it

## Islands

For interactive components, we can perform the hydration process.For static components, we can make them not participate in the hydration process and directly reuse the HTML content sent by the server.

![Islands Implement](/images/islands-implement.png)

### SSR Runtime

```
// island-jsx-runtime.js
import * as jsxRuntime from 'react/jsx-runtime';

export const data = {
  // 存放 islands 组件的 props
  islandProps: [],
  // 存放 islands 组件的文件路径
  islandToPathMap: {}
};

const originJsx = jsxRuntime.jsx;
const originJsxs = jsxRuntime.jsxs;

const internalJsx = (jsx, type, props, ...args) => {
  if (props && props.__island) {
    data.islandProps.push(props || {});
    const id = type.name;
    // __island 的 prop 将在 SSR 构建阶段转换为 `__island: 文件路径`
    data.islandToPathMap[id] = props.__island;
    delete props.__island;

    return jsx('div', {
      __island: `${id}:${data.islandProps.length - 1}`,
      children: jsx(type, props, ...args)
    });
  }
  return jsx(type, props, ...args);
};

export const jsx = (...args) => internalJsx(originJsx, ...args);

export const jsxs = (...args) => internalJsx(originJsxs, ...args);

export const Fragment = jsxRuntime.Fragment;
```

### Build Time

It is divided into two stages: before renderToString and after renderToString.

Before renderToString will build two bundles:
- SSR bundle: use on `renderTostring`
- Client bundle: client runtime code, use on hydrate page

```
// Layout.jsx
function Layout() {
  return (
    <div>
      <Aside __island a={1} />
    </div>
  )
}
// convert by babel
<Aside __island="./Aside.tsx!!island!!Users/project/src/Layout.tsx" />

// after renderToString
const data = {
  islandProps: [ { a: 1 } ],
  islandToPathMap: {
    Aside: './Aside.tsx!!island!!Users/project/src/Layout.tsx'
  }
}

// build islands bundle and hydrate into HTML
import { Aside } from './Aside.tsx!!island!!Users/project/src/Layout.tsx';

window.islands = {
  Aside
};

window.ISLAND_PROPS = JSON.parse(
  // set islandProps data by <srcipt> 
  document.getElementById('island-props').textContent
);
```

### Client Runtime

Activate the Islands component

```
import { hydrateRoot, createRoot } from 'react-dom/client';

const islands = document.querySelectorAll('[__island]');
for (let i = 0; i < islands.length; i++) {
  const island = islands[i];
  const [id, index] = island.getAttribute('__island')!.split(':');
  const Element = window.ISLANDS[id];
  hydrateRoot(
    island,
    <Element {...window.ISLAND_PROPS[index]}></Element>
  );
}
```