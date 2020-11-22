# 学习笔记

> 写在前面。本节课主要学习的内容是字符串分析法，包括字典法，KMP字符串模式匹配算法，Wildcard

## 字典法

类似于查字典一样，树形结构。

代码如下

```javascript
let $ = Symbol("$")
class Trie {
    constructor() {
        this.root = Object.create(null)
    }
    insert(word) {
        let node = this.root
        for (let item of word) {
            if (!node[item]) {
                node[item] = Object.create(null)
            }
            // 指向下一个
            node = node[item]
        }
        // 此时指向最后一个字母
        // 在最后一个字母上打上标记来计数
        if (!($ in node)) {
            node[$] = 0
        }
        node[$]++
    }
    most() {
        let max = null
        let maxWord = null
        let visit = (node, word) => {
            if (node[$] && node[$] > max) {
                max = node[$]
                maxWord = word
            }
            for (const w in node) {
                visit(node[w], word + w)
            }
        }
        visit(this.root, "")
        console.log(maxWord,max)
    }
}

// 随机长度字符串
function randomWord(length) {
    let s = "";
    for (let index = 0; index < length; index++) {
        s += String.fromCharCode(Math.floor(Math.random() * 26) + "a".charCodeAt(0))
    }
    return s;
}
let trie = new Trie()
for (let index = 0; index < 1000; index++) {
    trie.insert(randomWord(4))            
}
```

## KMP

港真，这个名词我都是听的很少，这算是第二次听这个算法。主要在于从给定的字符串中找到对应的匹配项。

```javascript
function kmp(source, pattern) {
    if (source == pattern) {
        return 0;
    }

    //计算tabel
    let table = new Array(pattern.length).fill(0);
    {
        let i = 1, j = 0;
        while (i < pattern.length) {
            if (pattern[i] == pattern[j]) {
                ++j, ++i;
                table[i] = j;
            } else {
                if (j > 0) {
                    j = table[j];
                } else {
                    ++i;
                }
            }
        }
    }

    //查找
    {
        let i = 0, j = 0;
        while (i < source.length) {
            if (pattern[j] === source[i]) {
                ++i, ++j;
            } else {
                if (j > 0) {
                    j = table[j];
                } else {
                    ++i;
                }
            }
            if (j == pattern.length)
                return i - j;
        }
        return -1;
    }
}

//test
console.log(kmp("consosole", "sol"));

```

## Wildcard 

利用正则的形式去处理

```javascript

function find(source,pattern){
    let startCount = 0;
    // 找出星号的数量
    for(let i = 0;i<pattern.length;i++){
      if(pattern[i] === '*'){
        startCount++
      }
    }
    /**
     * 处理边缘，
     * 当没有星号时，
     * 则需要严格从头到尾匹配，
     * 不满足则返回false
     */
    if(startCount === 0){
      for(let i = 0;i<pattern.length;i++){
        if(pattern[i] !== source[i] && pattern[i] !== '?'){
          return false
        }
      }
      return 
    }

    // 第一个星号之前的部分
    let i = 0, // pattern的位置
        lastIndex = 0; // 原字符串的source的位置
    for(i = 0;pattern[i] !== '*';i++){
      if(pattern[i] !== source[i] && pattern[i] !== '?'){
        return false
      }
    }
    // 处理第二个星号
    lastIndex = i;
    
    for(let p = 0;p < startCount - 1;p++){
      i++;
      let subPattern = ''
      while(pattern[i] !== '*'){
        subPattern += pattern[i];
        i++;
      };
      // 处理问好成正常字符，就是给去掉
      let reg = new RegExp(subPattern.replace(/\?/g,"[\\s\\S]"),'g');
      reg.lastIndex = lastIndex;

      console.log(reg.exec(source));

      if(!reg.exec(source)){ // 当没匹配到直接false
        return false
      }

      lastIndex = reg.lastIndex;
    }
    //处理最后一个星号的,从后往前匹配
    for(let j = 0;j<= source.length - lastIndex && pattern[pattern.length - j] !== '*';j++){
      if(pattern[pattern.length - j] !== source[source.length - j] && pattern[pattern.length - j] !== '?') {
        return false
      }
    }
    return true;

  }
```