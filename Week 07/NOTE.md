# 学习笔记


## 关于类型转换

js中双等号 == 经常带来类型转换的问题。常规的转换比如

'' 转布尔值 是false
'false' 转布尔值是 true 只要不是空字符串都是true

a+b 会优先调用 valueOf 方法

## 运行时相关概念

Completion Record

[[type]]  normal break continue return throw

[[value]] 基本类型

[[target]] label


## 简单语句和复杂语句

## 声明

变量声明 函数声明 类声明（函数声明的一种语法糖）


## 宏任务和微任务

宏任务一般指的是js引擎中的任务，微任务是js内部的任务。

在js中微任务只有promise（node不算）