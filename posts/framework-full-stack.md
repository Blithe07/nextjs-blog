---
title: "Full Stack Framework Granularity"
date: "2023-07-08"
category: "framework"
---

## Why Full Stack ?

In **web**, one of the base and most important performance index is FCP(First Content Paint) 
which measured the time it takes for any part of the page to complete rendering on the screen 
from the beginning of loading to the content of the page.

For traditional front-end framework, there are four steps to finish page rendering:

1. loading HTML
2. loading framework runtime code
3. loading bussiness code
4. render page(measure FCP)

The optimization of front-end framework can do only step 2 and 3.

The emergence of SSR has improved this situation. It can measure FCP at step 1 as follow:

1. loading HTML with content(measure FCP)
2. loading framework runtime code
3. loading bussiness code
4. hydrate page

Except for FCP, SSR have another advantage such as SEO. 
This is one of the main reasons why full stack framework has become popular in recent years.

## Difference Of Full Stack Framework(Granularity)

The granularity of logical splitting:

1. Coarse-Grained(File)   
    File path corresponds to back-end routing one by one. 
    Define `getStaticProps` method which execute at back-end and then pass result as `props` to component.
2. Medium-Grained(Method)   
    Using compilation techniques and Tree Shaking(mark /*#__PURE__*/) functionality to separate front-end and back-end code.
3. Fine-grained(State)   
    The medium granularity approach has a drawback - the separation method cann't have client state present.   
    In the following example, because of tree shaking and then the backend cannot obtain the `id`:
    ```
    export function Button() {
        const [id] = useStore();
        return (
            <button onClick={async () => {
                const post = await db.posts.find(id);
                // ...后续处理
            }}>
            click
            </button>
        );
    }
    ```
    To solve this problem, we need to further reduce the granularity of logical separation to reach the state level.   
    Extract server code to new file.