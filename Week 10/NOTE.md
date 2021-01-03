# 学习笔记 Week 10

## 排版

### 第一步 根据浏览器属性进行排版

* 预处理
* 处理掉了 flexDirection 和 wrap 相关的属性
* 把具体的 width，height，left，right，top，bottom 等属性抽象成 main，cross 相关的属性

#### flex 布局

CSS 三代排版技术：

* 正常流
  * position
  * display
  * float
  * ...
* Flex
* Grid
* Houdini ？？

```js
/**
            Main Axsis
        |- - - - - - - - - - >
        |
Cross   |
Axis    |
        |
        v
            flex-direction: row
            Main: width x left right
            Cross: height y top
            bottom


            Cross Axsis
        |- - - - - - - - - - >
        |
Main    |
Axis    |
        |
        v
            flex-direction: column
            Main: height y top
            bottom
            Cross: width x left right
 * /

```

### 第二步 收集元素进行（放置到行里）

* 分行
  * 根据主轴尺寸(元素尺寸超过主轴)，把元素分进行
  * 若设置了 no-wrap，则强行分配进第一行

```js
/**
            Main Axsis
        |- - - - - - - - - - >
        |^^^^^$$$$$$$$$^^^^$$$$$$$
Cross   |
Axis    |
        |
        v

=>

            Main Axsis
        |- - - - - - - - - - >
        |^^^^^$$$$$$$$$^^^^
Cross   |$$$$$$$
Axis    |
        |
        v

 * /
```

### 第三步 计算主轴

* 计算主轴方向
  * 找出所有 Flex 元素
  * 把主轴方向的剩余尺寸按 flex 值的比例分为给这些元素
  * 若剩余空间为负数，所有 flex 元素为 0，等比压缩剩余空间

```js
/**
            Main Axsis
        |- - - - - - - - - - >
        |^^?^^$$$$$$$$$^^^^
Cross   |
Axis    |
        |
        v

=> ? 为带 flex 属性的元素，在所在行还有剩余空间的情况下，就用 flex 元素给他填满 (剩余的空间就是变量 mainSpace 记录的空间)

            Main Axsis
        |- - - - - - - - - - >
        |^^^^^^^^$$$$$$$$$^^^^
Cross   |
Axis    |
        |
        v

 * /
```

### 第四步 计算交叉轴

* 计算交叉轴方向
  * 根据每一行中最大元素尺寸计算行高
  * 根据行高 flex-align 和 item-align，确定元素具体位置

```js
/**
            Main Axsis
        |- - - - - - - - - - >
        |^^^^^^^^$$$$$$$$$....
Cross   |
Axis    |
        |
        v
**/

// 根据 computedStyle 和 flex 计算出 style

// flexLine: #container
 "computedStyle": {
        "width": {
                "value": "500px",
                "specificity": [
                        0,
                        1,
                        0,
                        0
                ]
        },
        "height": {
                "value": "300px",
                "specificity": [
                        0,
                        1,
                        0,
                        0
                ]
        },
        "display": {
                "value": "flex",
                "specificity": [
                        0,
                        1,
                        0,
                        0
                ]
        }
},
"style": {
        "width": 500,
        "height": 300,
        "display": "flex",
        "flexDirection": "row",
        "alignItems": "stretch",
        "justifyContent": "flex-start",
        "flexWrap": "nowrap",
        "alignContent": "stretch"
}

// item in flexLine: #myid
"computedStyle": {
        "width": {
        "value": "200px",
        "specificity": [
                0,
                2,
                0,
                0
        ]
        }
},
"style": {
        "width": 200,
        "left": 0,
        "right": 200,
        "height": 300,
        "top": 0,
        "bottom": 300
}

// item in flexLine: .c1
"computedStyle": {
        "flex": {
        "value": "1",
        "specificity": [
                0,
                1,
                1,
                0
        ]
        }
},
"style": {
        "flex": 1,
        "width": 300,
        "left": 200,
        "right": 500,
        "height": 300,
        "top": 0,
        "bottom": 300
}

```

## 渲染

### 第一步 绘制单个元素

* 绘制需要依赖一个图形环境
* 我们这里采用了 npm 包 images
* 绘制在一个 viewport 上进行
* 与绘制相关的属性： background-color, border, background-image 等

### 第二步 绘制 DOM 树

* 递归调用子元素的绘制方法完成 DOM 树的绘制
* 忽略一些不需要绘制的节点
* 实际的浏览器中，文字绘制是难点，需要依赖字体库，我们这里忽略
* 实际的浏览器中，还会对一些图层左 compositing， 我们这里也忽略了