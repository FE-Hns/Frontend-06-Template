// abababx 的解析
function match(str) {
    let state = start
    for (let c of str) {
        state = state(c)
    }
    return state === end
}

function start(c) {
    if (c == 'a') {
        return findA
    } else {
        return start
    }
}

function findA(c) {
    if (c == 'b') {
        return findB
    } else {
        return start(c)
    }
}

function findB(c) {
    if (c == 'a') {
        return findA2
    } else {
        return start(c)
    }
}

function findA2(c) {
   if (c == 'b') {
       return findB2
   }  else {
       return start(c)
   }
}

function findB2(c) {
    if (c == 'x') {
        return end
    } else {
        return findB(c)
    }
}

function end(c) {
    return end
}
