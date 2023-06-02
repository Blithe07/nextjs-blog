---
title: "Mobile rem"
date: "2023-06-02"
category: "mobile"
---

```
(function(doc, win, designWidth){
    const html = doc.documentElement;
    function setAdaptedRem(){
        const clientWidth = win.clientWidth;
        if(clientWidth >= designWidth){
            html.style.fontSize = '100px';
        }else{
            html.style.fontSize = 100 * (clientWidth / designWidth) + 'px';
        }
    }
    win.addEventListener('DOMContentLoaded', setAdaptedRem)
})(document, window, 750)
```

Tips: Divide the design draft size (px) by 100 to obtain the corresponding rem value
