---
title: "Deploy"
date: "2023-05-07"
category: "engineer"
---

## Static resource organization

1. Set the page (`HTML`) to negotiate cache, and set `JavaScript`, `CSS`, and so on to permanent strong cache.
2. To address the issue of strong cache updates, the file digest (hash) is included as part of the resource path (URL).
3. To address the issues caused by overlay publishing, a **name hash** organization method is adopted instead of **query hash**. Specifically, it is necessary to configure the `output.filename` of webpack as a content hash method.
4. In order to solve the problem of too large Nginx directory storage and improve access speed with CDN, **Nginx reverse proxy** and **upload static resources to CDN** is adopted.
5. To upload CDN, we need to dynamically construct a publicPath according to the environment and construct a CDN upload directory according to the environment and then upload it.
6. In order to dynamically construct publicPath and insert it into HTML during the construction process, plugins such as Webpack HTML plugin are used to insert compiled static resources with `hash` and `publicPath` into HTML.
7. To ensure the security of uploading CDN, we need a mechanism to control the uploading of CDN keys, rather than simply writing the keys to plaintext files such as code/Dockerfile.

```
// webpack.config.js
const CDN_HOST = process.env.CDN_HOST;
const CDN_PATH = process.env.CDN_PATH;
const ENV = process.env.ENV;
const VERSION = process.env.VERSION;

const getPublicPath = () => {
    // Some code here
    return `${CDN_HOST}/${CDN_PATH}/${ENV}/${VERSION}/`;// dynamically construct publicPath
}

module.exports = {
    output: {
        filename: 'bundle.[name][contenthash].js',
        publicPath: getPublicPath(),
    },
    plugins: [
        new HtmlWebpackPlugin()
    ]
}
```

## Automated deployment

Docker and others are used to ensure the consistency of the environment, while Jenkins and others are used to ensure the concatenation of the construction process. Using es build and other methods to improve construction efficiency.

## Front-end deployment principle

1. After the build is released, it should not be overwritten.(name hash implement version)
2. After the build is released, static resource should be save in server or CDN permanently.
3. On the organization of static resource, every version should store by folder to implement resource convergence.
4. The publishing process should be automated.
5. Version switching should be automated.
6. Version switching can take effect in seconds.(Page Config Web, a server that can operate management version, adjust of small traffic and other information)
7. Multiple versions need to be able to take effect simultaneously online.(`publicPath` generate multiple output file and assign different versions based on environment and user information)