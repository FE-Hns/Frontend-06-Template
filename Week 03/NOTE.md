# 学习笔记

> 写在前面，本周的课程有些抽象。抽象到有点不知道如何下笔去写这篇总结。之所以觉得抽象，恐怕在于对LL算法和AST这种概念性比较强的东西了解甚少，那末正好可以查缺补漏，作为记录。

## 1.何为LL LR 算法（或者说解析更好，本人并不赞同算法的称呼）

    LL解析是左到右，最左推导。也就是说，我们考虑输入符号从左侧到右侧，并试图建立一个最左推导。这是由开始的开始符号，并多次扩大了最左边的非终结，直到我们的目标字符串来完成。
    LR语法分析是左到右，最右推导，这意味着我们从左至右扫描并尝试构建最右推导。解析器连续采输入的字符串，并试图扭转回一个非终端。

## 2. AST what are you？

如果说我们写的代码，比如说是函数，那末AST可以理解为最底层的一张树形表。

**举个栗子**

    function add(a,b) {
        return a+b
    }

如上所示，我们定义了一个函数，学名叫FunctionDeclaration定义的对象，把这个函数打散，分为三部分。

1. 函数名 id
2. 参数 a b
3. {} 代码块

函数名和参数没办法在继续往下分了，但是代码块可以继续拆分。

于是就有了 

1. return
2. a+b

再继续拆分呢

1. a(left)
2. +号(operator)
3. b(right)

这个拆分成一小块一小块的最终会形成一个类似于树状表，叫AST（抽象语法树）

## 3.课堂学到的内容

课堂里印象最深的是一个正则表达式的exec语法（汗），这个函数在实际开发过程中真的几乎没用到过，我发现winter是一个比较喜欢剑走偏锋的人，经常喜欢用一些比较奇怪的api。。。

总结一下

```javascript
let r = /123/g
let num = 12345123
console.log(r.lastIndex)
let result = r.exec(num)
console.log(result)
console.log(r.lastIndex)
// 打印结果如下
// 0 
// [123,...]
// 3
```
lastIndex 属性 一个整数，标示开始下一次匹配的字符位置。

exec函数是一个比较有意思的函数。返回结果是一个数组，第一个位置放的是当前匹配到的内容，然后依次放着捕获到的内容，后边还有些内容不复述，用的时候查就好。

之所以说它是个有意思的函数，原因在于，在调用过依次exec之后，你还可以继续r.exec(num)，而它是从lastIndex位置开始匹配的，然后可以继续调用，直到匹配不到任何东西，这时候结果是null，lastIndex是0。

winter老师课堂的例子就是非常巧妙的利用了exec函数的特性，通过while循环不断反复调用它，直到匹配不到内容，break。





