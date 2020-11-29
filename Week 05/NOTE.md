# 学习笔记

> 写在前面：本周的课主要讲解proxy的用法以及通过创建一个简易版的vue3.0的reactive去学习如何应用proxy。

## 第一节课

通过一个小demo来入门proxy对象的使用方法

```javascript
let obj = {
    a:1,
    b:2
}
let proxy = new Proxy(obj, {
    set(obj,prop,val) {
        console.log(obj,prop,val)
    }
})
// 通过设置代理的对象来看一下set函数是否被执行，以及参数
proxy.a = 10
// {a:1,b:2} 'a' 10
```
并且你会发现，即使你设置了一个不存在的属性，set方法依然会被调用。

proxy对象功能很强大，但同时也很“危险”，这种危险表现为你在用一个对象的时候，并不知道其实背后是在利用代理进行操作的，可能会出乎你的意料，这是一种不可预期的行为。

## 第二课

接着上堂课的代码，封装一个reactive函数，对obj对象进行代理，并且在改变代理对象的时候，同时也会改变obj对象（其实本质上因为，reactive函数的参数在内存中的地址和obj指针一样）

```javascript
let obj = {
    a: 1,
    b: 2
}

let proxy = reactive(obj)

// reactive函数，讲对象作为参数传递给方法
function reactive(obj) {
    return new Proxy(obj, {
        set(obj,prop,val){
            obj[prop] = val
            console.log(obj, prop, val)
            return obj[prop]
        },
        get(prop) {
            return obj[prop]
        }
    })
}
```

## 第三课 

创建effect函数，来达到监听属性的作用，而不是使用addEventListener，模拟Vue中的effect函数。
纠正一个自己代码的问题，原来get函数只传了一个prop，而每次我们po.a的时候得到确实undefined，其实get函数第一个参数也是obj即代理的对象，漏写了。


```javascript
let obj = {
    a: 1,
    b: 2
}

let callbacks = []

function effect(callback) {
    callbacks.push(callback)
}

function reactive(obj) {
    return new Proxy(obj, {
        set(obj, prop, val) {
            obj[prop] = val
            for (const callback of callbacks) {
                callback()
            }
            return obj[prop]
        },
        get(obj, prop) {
            return obj[prop]
        }
    })
}

let po = reactive(obj)

effect(() => {
    console.log(po.a,'effect 触发')
})

```

## 第四课

第一次听的时候，有点绕，没太理解和明白，因为不知道这么写要做什么，或者说为什么要这么写？

写过一次demo之后，顿悟。将思路整理一下，捋顺一下。

1. 首先通过reactive函数创建了一个proxy对象
2. 接着调用了effect函数，并且effect函数内获取了proxy对象的一个属性，那么此时get函数会被执行
3. 事先声明好一个usedReactivities用来存放已经使用过的对象和属性
4. 由于get函数被执行了，所以我们每次在usedReactivities数组中push进去obj和prop
5. 现在关键点就在于effect函数怎么写了
6. effect函数中，进来之后的第一步，先清空usedReactivities，在执行callback（callback中是执行了po.a）所以，get函数被执行，于是usedReactivities就有了数据，接下来就是利用map存储了
7. 为了验证是否生效，我们在set函数中，对刚才对callbacks遍历执行，看看是否生效

```javascript
// 被代理的对象
let obj = {
    a: 1,
    b: 2
}
// 回调函数map集合
let callbacks = new Map()
// 存放使用过的响应的集合
let usedReactivities = []
// 监听函数
function effect(callback) {
    usedReactivities = []
    // 这一步执行effect函数中的箭头函数
    callback()
    console.log(usedReactivities)
    // 解构赋值，获取变量
    const [obj, prop] = usedReactivities[0]
    console.log(obj,prop)
    // 先看第一层map是否有值存在
    // 没有的话，给obj => 映射一个map
    if (!callbacks.has(obj)) {
        callbacks.set(obj, new Map())
    }
    // 接下来再看第二层map是否有值存在
    // 如果第二层map不存在，就映射一个数组
    if (!callbacks.get(obj).has(prop)) {
        callbacks.get(obj).set(prop, [])
    }
    // 如果找到对应的obj且对应的属性，就把callback函数push到数组中
    callbacks.get(obj).get(prop).push(callback)
}

function reactive(obj) {
    return new Proxy(obj, {
        set(obj, prop, val) {
            obj[prop] = val
            if (callbacks.has(obj)) {
                if (callbacks.get(obj).has(prop)) {
                    for (const callback of callbacks.get(obj).get(prop)) {
                        callback()
                    }
                }

            }
            return obj[prop]
        },
        get(obj, prop) {
            // usedReactivities = []
            usedReactivities.push([obj, prop])
            return obj[prop]
        }
    })
}

let po = reactive(obj)
// 调用effect函数，监听属性a
// 之后再次改变po中a属性的值，就会触发set中callbacks中对于a属性监听的回调函数
effect(() => {
    console.log(po.a)
})
```

## 第五课

如果是对象嵌套的情况，那么上述代码将无法做到更深层次的监听。
所以
1. 我们先是想到利用递归的方式，在get的时候，判断如果监听的是一个对象，我们就把该对象利用递归的方式继续reactive
2. 但最终返回的proxy需要作进一步的判断了，因为得把之前代理的存一份
3. 相应的effect函数也需要做修改

吐槽一点，winter老师在第五课时候着重讲了get时候判断修改以及需要存储一份proxy，窃以为effect函数没有做修改，其实effect函数也做了相应的修改。好处在于可以让学生自行思考，坏处在于有点浪费时间了，没有表达到位。

```javascript
// 被代理的对象
let obj = {
    a: {
        b: 3
    },
    b: 2
}
// 回调函数map集合
let callbacks = new Map()
// 存放使用过的响应的集合
let usedReactivities = []
// 存储一下reactive函数创建的创建的状态
let reactivities = new Map()
// 监听函数
function effect(callback) {
    usedReactivities = []
    // 这一步执行effect函数中的箭头函数
    callback()
    // console.log(usedReactivities)
    // // 解构赋值，获取变量
    // const [obj, prop] = usedReactivities[0]
    // // console.log(obj, prop)
    // // 先看第一层map是否有值存在
    // // 没有的话，给obj => 映射一个map
    // if (!callbacks.has(obj)) {
    //     callbacks.set(obj, new Map())
    // }
    // // 接下来再看第二层map是否有值存在
    // // 如果第二层map不存在，就映射一个数组
    // if (!callbacks.get(obj).has(prop)) {
    //     callbacks.get(obj).set(prop, [])
    // }
    // // 如果找到对应的obj且对应的属性，就把callback函数push到数组中
    // callbacks.get(obj).get(prop).push(callback)

    
    console.log(usedReactivities)

    for (const reactivity of usedReactivities) {
        const [obj, prop] = reactivity
        if (!callbacks.has(obj)) {
            callbacks.set(obj, new Map())
        }
        if (!callbacks.get(obj).has(prop)) {
            callbacks.get(obj).set(prop, [])
        }
        callbacks.get(obj).get(prop).push(callback)
    }
}

function reactive(obj) {
    if (reactivities.has(obj)) {
        return reactivities.get(obj)
    }
    let proxy = new Proxy(obj, {
        set(obj, prop, val) {
            obj[prop] = val
            console.log(obj)
            if (callbacks.has(obj)) {
                console.log(123)
                if (callbacks.get(obj).has(prop)) {
                    for (const callback of callbacks.get(obj).get(prop)) {
                        console.log(1111)
                        callback()
                    }
                }

            }
            return obj[prop]
        },
        get(obj, prop) {
            // usedReactivities = []
            usedReactivities.push([obj, prop])
            if (typeof obj[prop] === "object") {
                return reactive(obj[prop])
            }
            return obj[prop]
        }
    })

    reactivities.set(obj, proxy)
    return proxy
}

let po = reactive(obj)
// 调用effect函数，监听属性a
// 之后再次改变po中a属性的值，就会触发set中callbacks中对于a属性监听的回调函数
effect(() => {
    console.log(po.a.b)
})
```

## 第六课

本节课通过input实现简单的双向绑定，然后将绑定的值回显到dom结构中。每次都需要触发effect函数，最后一步起初忘了在effect函数中去触发更新dom的background导致失效。

```html
<input type="range" id="r" min="1" max="255">
<input type="range" id="g" min="1" max="255">
<input type="range" id="b" min="1" max="255">

<div style="width:400px;height:400px;" id="color"></div>

<script>
    // 被代理的对象
    let obj = {
        r: 1,
        g: 1,
        b: 1
    }
    // 回调函数map集合
    let callbacks = new Map()
    // 存放使用过的响应的集合
    let usedReactivities = []
    // 存储一下reactive函数创建的创建的状态
    let reactivities = new Map()
    // 监听函数
    function effect(callback) {
        usedReactivities = []
        // 这一步执行effect函数中的箭头函数
        callback()
        console.log(usedReactivities)

        for (const reactivity of usedReactivities) {
            const [obj, prop] = reactivity
            if (!callbacks.has(obj)) {
                callbacks.set(obj, new Map())
            }
            if (!callbacks.get(obj).has(prop)) {
                callbacks.get(obj).set(prop, [])
            }
            callbacks.get(obj).get(prop).push(callback)
        }
    }

    function reactive(obj) {
        if (reactivities.has(obj)) {
            return reactivities.get(obj)
        }
        let proxy = new Proxy(obj, {
            set(obj, prop, val) {
                obj[prop] = val
                // console.log(obj)
                if (callbacks.has(obj)) {
                    // console.log(123)
                    if (callbacks.get(obj).has(prop)) {
                        for (const callback of callbacks.get(obj).get(prop)) {
                            console.log(1111)
                            callback()
                        }
                    }

                }
                return obj[prop]
            },
            get(obj, prop) {
                // usedReactivities = []
                usedReactivities.push([obj, prop])
                if (typeof obj[prop] === "object") {
                    return reactive(obj[prop])
                }
                return obj[prop]
            }
        })

        reactivities.set(obj, proxy)
        return proxy
    }

    let po = reactive(obj)
    // 调用effect函数，监听属性a
    // 之后再次改变po中a属性的值，就会触发set中callbacks中对于a属性监听的回调函数

    effect(() => {
        // console.log(po.a.b)
        document.getElementById("r").value = po.r
    })
    effect(() => {
        // console.log(po.a.b)
        document.getElementById("g").value = po.g
    })
    effect(() => {
        // console.log(po.a.b)
        document.getElementById("b").value = po.b
    })

    document.getElementById("r").addEventListener("input", event => {
        po.r = event.target.value
    })
    document.getElementById("g").addEventListener("input", event => {
        po.g = event.target.value
    })
    document.getElementById("b").addEventListener("input", event => {
        po.b = event.target.value
    })
    effect(() => {
        document.getElementById("color").style.backgroundColor = `rgb(${po.r},${po.g},${po.b})`
    })
</script>

```
## 第七课

拖拽。在最开始接触前端的时候，第一个入门的demo就是拖拽。
拖拽的核心在于通过事件来获取到鼠标的坐标，将鼠标的坐标值给到拖拽元素的坐标值。其中需要注意的点在于，需要记录一下在mousedown的一瞬间的点位坐标，需要将其去掉，不然每次都会回到元素的起点。

```html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        body {
            position: relative;
        }
    </style>
</head>
<body>
    <div id="dragble" style="width: 100px;height: 100px;background-color: palevioletred;position: absolute;"></div>
<script>
    let dragble = document.getElementById("dragble")
    let baseX = 0, baseY = 0;
    // mousedown事件放在元素上监听
    dragble.addEventListener("mousedown",function (event) {
        let startX = event.clientX, startY = event.clientY;
        // mouseup回调函数
        // mouseup函数只用来去掉监听
        let upHandler = () => {
            baseX = baseX + event.clientX - startX;
            baseY = baseY + event.clientY - startY;
            document.removeEventListener("mousemove",moveHandler)
            document.removeEventListener("mouseup",upHandler)
        }
        // mousemove回调函数
        let moveHandler = (event) => {
            // console.log(event)
            // dragble.style.transform = `translate(${baseX + event.clientX - startX}px, ${baseY + event.clientY - startY}px)`
            dragble.style.left = `${baseX + event.clientX - startX}px`
            dragble.style.top = `${baseY + event.clientY - startY}px`
        }

        document.addEventListener("mousemove",moveHandler)
        document.addEventListener("mouseup",upHandler)
    })
</script>
</body>
</html>
```


## 第八课

今天的这节课，恰好是我使用的比较少的CSSROM这部分。其中有几个比较有意思的api需要我好好的了解一下


### document.createRange()

Range对象代表页面上一段连续的区域，通过Range对象可以获取或者修改页面上任何区域的内容。也可以通过Range的方法进行复制和移动页面任何区域的元素。


### range.setStart(startNode, startoffset)

Range.setStart() 方法用于设置 Range的开始位置。

如果起始节点类型是 Text， Comment, or CDATASection之一, 那么 startOffset指的是从起始节点算起字符的偏移量。 对于其他 Node 类型节点， startOffset 是指从起始结点开始算起子节点的偏移量。


### range.setEnd(endNode, endoffset)

Range.setEnd()方法用于设置 Range的结束位置。

如果结束节点类型是 Text， Comment, or CDATASection之一, 那么 endOffset指的是从结束节点算起字符的偏移量。 对于其他 Node 类型节点， endOffset是指从结束结点开始算起子节点的偏移量。

原理，将所有的节点塞入到range对象里，并且设置一个求距离最小的方法，于是每次移动鼠标都可以找到最小的range，利用range.insertNode将拖拽的元素插入到range里。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <div id="container">
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
        文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字文字
    </div>
    <div id="dragble" style="display:inline-block;width: 100px;height: 100px;background-color: palevioletred;"></div>
<script>
    let dragble = document.getElementById("dragble")
    let baseX = 0, baseY = 0;
    // mousedown事件放在元素上监听
    dragble.addEventListener("mousedown",function (event) {
        let startX = event.clientX, startY = event.clientY;
        // mouseup回调函数
        // mouseup函数只用来去掉监听
        let upHandler = () => {
            baseX = baseX + event.clientX - startX;
            baseY = baseY + event.clientY - startY;
            document.removeEventListener("mousemove",moveHandler)
            document.removeEventListener("mouseup",upHandler)
        }
        // mousemove回调函数
        let moveHandler = (event) => {
            // dragble.style.transform = `translate(${baseX + event.clientX - startX}px, ${baseY + event.clientY - startY}px)`
            let range = getNearest(event.clientX, event.clientY)
            range.insertNode(dragble)
        }
        document.addEventListener("mousemove",moveHandler)
        document.addEventListener("mouseup",upHandler)
    })

    let ranges = [];
    let container = document.getElementById("container");
    for (let i = 0; i < container.childNodes[0].textContent.length; i++) {
        let range = document.createRange()        
        range.setStart(container.childNodes[0], i)
        range.setEnd(container.childNodes[0], i)

        console.log(range.getBoundingClientRect())

        ranges.push(range)
    }


    function getNearest(x,y) {
        let min = Infinity
        let nearest = null

        for (const range of ranges) {
            let rect = range.getBoundingClientRect()
            // 勾股定理求距离
            let distance = (rect.x - x) ** 2 + (rect.y - y) ** 2
            if (distance < min) {
                min = distance
                nearest = range
            }
        }
        
        return nearest
    }

    document.addEventListener("selectstart",e => e.preventDefault())
</script>
</body>
</html>

```