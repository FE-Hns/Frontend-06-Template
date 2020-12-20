# 学习笔记

> 写在前面，本周的课程主要讲解浏览器的工作原理

## 第一课 浏览器工作原理总结

通过课程得知，原来浏览器最终打开的其实是一张图片，计算机术语叫Bitmap 而从手输入url到最后获得这个Bitmap的过程就是浏览器工作原理


大体过程如下

url =》 （http请求） =》 html =》 （parse） =》 css =》 （css computing） =》 dom with css =》 （layout） =》 dom with position =》 render =》 Bitmap


## 状态机 有限状态机

状态机重点在机而不在 状态

机是指处理状态的函数

课程中的例子： 在玩游戏的过程中 主人公如果跑到了敌人的视线内，也就是触发了敌人的攻击状态，很通俗易懂。


js代码说明如下

```javascript

function state(input) {
    return next
}

while(input) {
    state = state(input)
}

```

## 状态机 不适用状态机处理字符串（一）


```javascript

// 找到字符串中是否含有 a

function match(str) {
    for(let w of str) {
        if(w == 'a') {
            return true
        }
    }
    return false
}

```

## 状态机 不适用状态机处理字符串（二）


不用正则表达式 找到字符 ab

```javascript

function match(str) {
    for(let i=0; i<str.length-1; i++) {
        console.log(str[i] + str[i+1])
        if(str[i] + str[i+1] == 'ab') {
            return true
        }
    }
    return false
}

```

## 状态机 不使用转太急处理字符串（三）

不使用正则 找到 字符 abcdef


```javascript

function match(str) {
    let findA = false
    let findB = false
    let findC = false
    let findD = false
    let findE = false

    for(let c of str) {
        if(c == 'a') {
            findA = true
        } else if(findA && c == 'b') {
            findB = true
        } else if(findB && c == 'c') {
            findC = true
        } else if(findC && c == 'd') {
            findD = true
        } else if(findD && c == 'e') {
            findE = true
        } else if(findE && c == 'f') {
            return true
        } else {
            findA = false
            findB = false
            findC = false
            findD = false
            findE = false
        }
    }
    return false
}

```

## 状态机 使用状态机处理字符串（一） 



## HTTP 协议解析 

七层架构

应用层
表示层
会话层        HTTP
传输层        TCP 
网络层        Internet
数据链路层     4G 5G Wi-Fi
物理层

## 搭建一个简单的服务端
