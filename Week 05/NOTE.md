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


