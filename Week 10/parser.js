const css = require('css');

const layout = require("./layout.js");

const EOF = Symbol('EOF'); // EOF: End Of File

let currentToken = null;
let currentAttribute = null;

let stack = [{ type: 'document', children: [] }];
let currentTextNode = null;

// 加入一个新的函数, addCSSRules, 把 CSS 规则暂存到一个数组里
let rules = [];
function addCSSRules(text) {
    var ast = css.parse(text);
    rules.push(...ast.stylesheet.rules);
}

/**
 * 
 * @param {string} element 
 * @param {string} selector 
 * 
 * 三种简单选择器： .a, #a, div
 */
function match(element, selector) {
    if (!selector || !element.attributes)
        return false;

    if (selector.charAt(0) === '#') {
        let attr = element.attributes.filter(attr => attr.name === 'id')[0];
        if (attr && attr.value === selector.replace('#', ''))
            return true;
    } else if (selector.charAt(0) === '.') {
        let attr = element.attributes.filter(attr => attr.name === 'class')[0];
        if (attr && attr.value === selector.replace('.', ''))
            return true;
    } else {
        if (element.tagName === selector) {
            return true;
        }
    }
    return false;
}

function specificity(selector) {
    let p = [0, 0, 0, 0];
    let selectorParts = selector.split(' ');
    for (let part of selectorParts) {
        if (part.charAt(0) === '#') {
            p[1] += 1;
        } else if (part.charAt(0) === '.') {
            p[2] += 1;
        } else {
            p[3] += 1;
        }
    }
    return p;
}

function compare(sp1, sp2) {
    if (sp1[0] - sp2[0])
        return sp1[0] - sp2[0];
    if (sp1[1] - sp2[1])
        return sp1[1] - sp2[1];
    if (sp1[2] - sp2[2])
        return sp1[2] - sp2[2];

    return sp1[3] - sp2[3];
}

function computeCSS(element) {
    // slice 没有参数的时候就是复制一遍 array
    // 标签匹配是从当前元素往外匹配，所以要进行 reverse
    let elements = stack.slice().reverse();

    if (!element.computedStyle)
        element.computedStyle = {};

    for (let rule of rules) {
        // rule.selector[0]: "body div #myid"
        // 为了和 elements 顺序一致，选择器也执行一次 reverse
        let selectorParts = rule.selectors[0].split(' ').reverse();

        if (!match(element, selectorParts[0]))
            continue;

        let matched = false;

        // j 表示当前选择器的位置
        let j = 1;
        // i 表示当前元素的位置
        for (let i = 0; i < elements.length; i++) {
            /**
             * element[0] 为刚入栈的元素，它要与 #myid 和 img 分别进行匹配
             * 如果匹配成功，elemnt 和 selecotr 都向外层延申并尝试匹配
             */
            if (match(elements[i], selectorParts[j])) {
                // 元素能够匹配选择器时，j 自增，去匹配 j 外层的选择器
                j++;
            }
        }
        // 如果所有的选择器都匹配到了，就认为只 matched
        if (j >= selectorParts.length)
            matched = true;

        if (matched) {
            // 如果匹配到，加入样式
            let sp = specificity(rule.selectors[0]);
            let computedStyle = element.computedStyle;
            for (let declaration of rule.declarations) {
                if (!computedStyle[declaration.property])
                    computedStyle[declaration.property] = {};

                // 如果还没有 computedStyle 添加属性和值
                if (!computedStyle[declaration.property].specificity) {
                    computedStyle[declaration.property].value = declaration.value;
                    console.log('computedStyle[declaration.property].value: ', computedStyle[declaration.property].value);
                    computedStyle[declaration.property].specificity = sp;
                    // 如果已经有 computedStyle，但新的 specificity 更大，覆盖之前的值
                } else if (compare(computedStyle[declaration.property].specificity, sp) < 0) {
                    computedStyle[declaration.property].value = declaration.value;
                    computedStyle[declaration.property].specificity = sp;
                }
            }
            // console.log('element: ', element, 'matched rule', rule);
            console.log('element.computedStyle: ', element.computedStyle);
        }
    }
}
function emit(token) {
    // console.log('token: ', JSON.stringify(token, null, 5));

    // 栈顶
    let top = stack[stack.length - 1];

    if (token.type === 'startTag') {
        let element = {
            type: 'element',
            children: [],
            attributes: [],
        };

        element.tagName = token.tagName;

        for (let p in token) {
            if (p !== 'type' && p !== 'tagName') {
                element.attributes.push({
                    name: p,
                    value: token[p],
                });
            }

        }

        // starTag 入栈时，计算 CSS 样式
        computeCSS(element);

        // 入栈前添加 parent & children 关系，对偶操作
        top.children.push(element);
        // element.parent = top;

        // 自封闭元素被添加对偶关系后不需要入栈，因为没有封闭标签给它出栈
        if (!token.isSelfClosing)
            // 非自封闭元素需要入栈
            stack.push(element);

        currentTextNode = null;

    } else if (token.type === 'endTag') {
        if (top.tagName !== token.tagName) {
            throw new Error("Tag start end dosen't match");
        } else {
            // ++++++++遇到 style 标签时，执行添加 CSS 规则的操作 ++++++++
            if (top.tagName === 'style') {
                addCSSRules(top.children[0].content);
            }

            // flex 布局要知道子元素是谁，所以要在结束标签（元素被出栈）之前确定 layout
            layout(top);

            // 找到了对应的关闭标签，就从栈顶取出
            stack.pop();
        }
        currentTextNode = null;
    } else if (token.type === 'text') {
        if (currentTextNode === null) {
            currentTextNode = {
                type: 'text',
                content: '',
            };
            // 在遇到新的文本时，创捷文本节点，并作为 children 添加给栈顶
            top.children.push(currentTextNode);
        }
        // 如果是连续的文本节点，就连接在一起
        currentTextNode.content += token.content;
    }
}

/**
 * 状态机的初始化方法，因为 HTML 标准里第 8.2.4 Tokenization 里用 data 来命名，这里也用 data 来命名
 * @param {string} c character
 */
function data(c) {
    // 标签开始，但还不知道是哪种标签
    if (c === '<') {
        return tagOpen;
    } else if (c === EOF) {
        emit({
            type: 'EOF',
        });
        return;
    } else {
        emit({
            type: 'text',
            content: c,
        });
        // console.log('return data in data: ', data);
        return data;
    }
}

/**
 * 解析 < 后的字符
 * @param {string} c character
 */
function tagOpen(c) {
    if (c === '/') {
        return endTagOpen;
    } else if (c.match(/^[a-zA-Z]$/)) {
        // 不是 / 说明是一个开始标签或者是自封闭标签的开始，初始化标签
        currentToken = {
            type: 'startTag',
            tagName: '',
        };
        return tagName(c);
    } else {
        return;
    }
}

/**
 * </
 * @param {string} c character
 */
function endTagOpen(c) {
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: 'endTag',
            tagName: '',
        };
        return tagName(c);
    } else if (c === '>') {
        // throw error
    } else if (c === EOF) {
        // throw error
    } else {

    }
}

/**
 * 解析标签名
 * @param {*} c 
 */
function tagName(c) {
    // 如果 tag 有属性，tagName 以空白符为结束 (<div prop)
    // 空白符有四种: tab符(\t), 换行符(\n), 禁止符(\f), 空格( )
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c === '/') {
        return selfClosingStartTag;
    } else if (c.match(/^[a-zA-Z]$/)) {
        currentToken.tagName += c;//.toLowerCase();
        return tagName;
    } else if (c === '>') {
        emit(currentToken);
        // 本标签解析完，开始解析下一个标签
        return data;
    } else {
        return tagName;
    }
}

/**
 * <html 
 * @param {*} c 
 */
function beforeAttributeName(c) {
    // 先都不做处理
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c === '/' || c === '>' || c === EOF) {
        return afterAttributeName(c);
    } else if (c === '=') {

    } else {
        currentAttribute = {
            name: '',
            value: "",
        };
        // console.log('currentAttribute: ', currentAttribute);
        return attributeName(c);
    }
}

function attributeName(c) {
    if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF) {
        return afterAttributeName(c);
    } else if (c === '=') {
        return beforeAttributeValue;
    } else if (c === '\u0000') {

    } else if (c === '\"' || c === "'" || c === '<') {

    } else {
        currentAttribute.name += c;
        return attributeName;
    }
}

function afterAttributeName(c) {
    if (c.match(/^\t\n\f ]$/)) {
        return afterAttributeName;
    } else if (c === '/') {
        return selfClosingStartTag;
    } else if (c === '=') {
        return beforeAttributeValue;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === EOF) {

    } else {
        currentToken[currentAttribute.name] = currentAttribute.value;
        currentAttribute = {
            name: '',
            value: '',
        };
        return attributeName(c);
    }
}

function beforeAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF) {
        return beforeAttributeName;
    } else if (c === '\"') {
        return doubleQuotedAttributeValue;
    } else if (c === "\'") {
        return singleQuotedAttributeValue;
    } else if (c === '>') {
        // return data;
    } else {
        return UnquotedAttributeValue(c);
    }
}

function doubleQuotedAttributeValue(c) {
    if (c === '\"') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === '\u0000') {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function singleQuotedAttributeValue(c) {
    if (c === "\'") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === '\u0000') {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return singleQuotedAttributeValue;
    }
}

function afterQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c === '/') {
        return selfClosingStartTag;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function UnquotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    } else if (c === '/') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === '\u0000') {

    } else if (c === '\"' || c === "'" || c === '<' || c === '=' || c === '`') {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return UnquotedAttributeValue;
    }
}

function selfClosingStartTag(c) {
    if (c === '>') {
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    } else if (c === 'EOF') {

    } else {

    }
}

module.exports.parseHTML = function parseHTML(html) {
    console.log(html);
    let state = data;
    for (let c of html) {
        state = state(c);
    }

    // 文本结束时可能没有结束符，所以在这里给定一个结束符。
    // 这里的结束符不能有任何意义，所以用来 Symbol
    state = state(EOF);
    return stack[0];

    console.log('stack[0]: ', stack[0]);
}