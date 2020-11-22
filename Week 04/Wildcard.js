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