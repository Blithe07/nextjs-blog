---
title: "CDN Introduction"
date: "2023-04-24"
category: "browser"
---

# CDN(Content Delivery Network) 加速原理

**介绍**
CND 即内容分发网络，目的是通过在现有的 Internet 中增加一层缓存，将网站的内容发布到最接近用户的网络”边缘“的节点，使用户可以就近取得所需的内容，提高用户访问网站的响应速度。  
![](/images/cdn.jpg)

1. 用户输入访问的域名,操作系统向 LocalDns 查询域名的 ip 地址.
2. LocalDns 向 ROOT DNS 查询域名的授权服务器(这里假设 LocalDns 缓存过期)
3. ROOT DNS 将域名授权 dns 记录回应给 LocalDns
4. LocalDns 得到域名的授权 dns 记录后,继续向域名授权 dns 查询域名的 ip 地址
5. 域名授权 dns 查询域名记录后(一般是 CNAME)，回应给 LocalDns
6. LocalDns 得到域名记录后,向智能调度 DNS 查询域名的 ip 地址
7. 智能调度 DNS 根据一定的算法和策略(比如静态拓扑，容量等),将最适合的 CDN 节点 ip 地址回应给 LocalDns
8. LocalDns 将得到的域名 ip 地址，回应给 用户端
9. 用户得到域名 ip 地址后，访问站点服务器
10. CDN 节点服务器应答请求，将内容返回给客户端.(缓存服务器一方面在本地进行保存，以备以后使用，二方面把获取的数据返回给客户端，完成数据服务过程)
