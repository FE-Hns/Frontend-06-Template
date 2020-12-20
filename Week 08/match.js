// 使用状态机的形式去处理代码

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
    if (c == 'c') {
        return findC
    } else {
        return start(c)
    }
}

function findC(c) {
    if (c == 'd') {
        return findD
    } else {
        return start(c)
    }
}

function findD(c) {
    if (c == 'e') {
        return findE
    } else {
        return start(c)
    }
}

function findE(c) {
    if (c == 'f') {
        return end
    } else {
        return start(c)
    }
}

function end(c) {
    return end
}

match('I abcdef groot')