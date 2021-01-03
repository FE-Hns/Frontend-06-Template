function getStyle(element) {
    if (!element.style)
        element.style = {};

    // 把 computedStyle 转换格式，存入 style 属性。
    // 因为 toy-browser 里 style 属性并没有被占用，所以这里可以用 style，但最好换个属性名
    // console.log('---style---')
    for (let prop in element.computedStyle) {
        // console.log('prop: ', prop);
        let p = element.computedStyle.value;
        element.style[prop] = element.computedStyle[prop].value;

        // 带 px 的值只保留数字部分
        if (element.style[prop].toString().match(/px$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
        // string 数字转为 number
        if (element.style[prop].toString().match(/^[0-9\.]+$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
    }
    return element.style;
}

function layout(element) {
    // 没有 coputedStyle 的元素就跳过去
    if (!element.computedStyle)
        return;

    // 对 style 进行预处理

    let elementStyle = getStyle(element);
    // toy-browser 还只能处理 flex 布局
    if (elementStyle.display !== 'flex')
        return;

    // 过滤出文本节点
    let items = element.children.filter(e => e.type === 'element');

    // 支持 order 属性
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    // 取出 style
    let style = elementStyle;

    // 对主轴和交叉轴进行处理
    // 没有规定的 width 和 height 都先定义为 null, 方便代码同一判断
    ['width', 'height'].forEach((size) => {
        if (style[size] === 'auto' || style[size] === '') {
            style[size] = null;
        }
    });

    // 设置 flex 必要属性的默认值
    if (!style.flexDirection || style.flexDirection === 'auto')
        style.flexDirection = 'row';
    if (!style.alignItems || style.alignItems === 'auto')
        style.alignItems = 'stretch';
    if (!style.justifyContent || style.justifyContent === 'auto')
        style.justifyContent = 'flex-start';
    if (!style.flexWrap || style.flexWrap === 'auto')
        style.flexWrap = 'nowrap';
    if (!style.alignContent || style.alignContent === 'auto')
        style.alignContent = 'stretch';

    // 用抽象的属性变量，代替直接的属性
    let mainSize, mainStart, mainEnd, mainSign, mainBase,
        crossSize, crossStart, crossEnd, crossSign, crossBase;

    if (style.flexDirection === 'row') {
        // 主轴尺寸
        mainSize = 'width';
        // 开始边缘
        mainStart = 'left';
        // 结束边缘
        mainEnd = 'right';
        // 从左往右排列，属性 +1
        mainSign = +1;
        mainBase = 0;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }

    if (style.flexDirection === 'row-reverse') {
        // 主轴尺寸
        mainSize = 'width';
        // 开始边缘
        mainStart = 'right';
        // 结束边缘
        mainEnd = 'left';
        // 从左往右排列，属性 -1
        mainSign = -1;
        mainBase = style.width;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }

    if (style.flexDirection === 'column') {
        // 主轴尺寸
        mainSize = 'height';
        // 开始边缘
        mainStart = 'top';
        // 结束边缘
        mainEnd = 'bottom';
        // 从上往下排列，属性 +1
        mainSign = +1;
        mainBase = 0;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    if (style.flexDirection === 'column-reverse') {
        // 主轴尺寸
        mainSize = 'height';
        // 开始边缘
        mainStart = 'bottom';
        // 结束边缘
        mainEnd = 'top';
        // 从上往下排列，属性 -1
        mainSign = -1;
        mainBase = style.height;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    // 反向换行
    if (style.flexWrap === 'wrap-reverse') {
        let tmp = crossStart;
        crossStart = crossEnd;
        corssEnd = tmp;
        crossSign = -1;
    } else {
        crossBase = 0;
        crossSign = 1;
    }

    // 如果父元素没有设置主轴属性，则由子元素把父元素撑开，就没有 wrap 了
    let isAutoMainSize = false;
    if (!style[mainSize]) { // auto sizing
        elementStyle[mainSize] = 0;
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            // TODO: 确认这里是不是对的
            let itemStyle = getStyle(item);
            if (itemStyle[mainSize] !== null || itemStyle[mainSize] !== (void 0)) {
                elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize];
            }
        }
        // 所有元素都能排进同一行里
        isAutoMainSize = true;
        // style.flexWrap = 'nowrap';
    }

    // 把元素收进行
    // flexLine 是 flex 的一行
    let flexLine = [];
    // 至少要有一行
    let flexLines = [flexLine];

    // 剩余空间等于父元素的主轴尺寸 mainSize
    let mainSpace = elementStyle[mainSize];
    // 交叉轴剩余空间
    let crossSpace = 0;

    // 插入元素进 flexLines
    for (let i = 0; i < items.length; i += 1) {
        let item = items[i];
        let itemStyle = getStyle(item);

        // 没设主轴尺寸，默认值为 0
        if (itemStyle[mainSize] === null) {
            itemStyle[mainSize] = 0;
        }

        // 如果有 flex 属性，说明这个元素是可伸缩的
        if (itemStyle.flex) {
            // 一定可以加入到 flexLine 里面
            flexLine.push(item);
        } else if (style.flexWrap === 'nowrap' && isAutoMainSize) { // 如果不转行
            // 剩余空间被减去元素尺寸
            mainSpace -= itemStyle[mainSize];
            if (itemStyle[crossSize] !== null && itemStyle[crossSpace] !== (void 0)) {
                // 如果元素有行高，就取最高的那个值作为行高
                crossSpace = Math.max(crossSpace, itemStyle[crossSpace]);
            }
            flexLine.push(item);
        } else { // 换行的逻辑
            // 如果元素主轴尺寸大过父元素主轴尺寸，就把它压缩的和主轴尺寸一样大
            if (itemStyle[mainSize] > style[mainSize]) {
                itemStyle[mainSize] = style[mainSize];
            }
            // 如果主轴的空间不足以容纳每一个元素了，换行
            if (mainSpace < itemStyle[mainSize]) {
                // 把实际主轴剩余尺寸和交叉剩余尺寸的信息存到当前行上
                flexLine.mainSpace = mainSpace;
                flexLine.crossSpace = crossSpace;
                // 创建新的行,把当前元素放进去
                flexLine = [item];
                // 把新行插入行集
                flexLines.push(flexLine);
                // 重置 mainSpace 和 crossSpace
                mainSpace = style[mainSize];
                crossSpace = 0;
            } else { // 如果能放下，把当前元素加到当前行里
                flexLine.push(item);
            }

            // 计算主轴和交叉轴的尺寸
            if (itemStyle[crossSize] !== null && itemStyle[crossSpace] !== (void 0)) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSpace]);
            }
            // 从剩余空间中剪掉当前元素的大小
            mainSpace -= itemStyle[mainSize];
        }
    }

    // 最后一行的情况，没有元素了
    flexLine.mainSpace = mainSpace;

    if (style.flexWrap === 'nowrap' || isAutoMainSize) {
        flexLine.crossSpace = (style[crossSize] !== undefined) ? style[crossSize] : crossSpace;
    } else {
        flexLine.crossSpace = crossSpace;
    }

    // 计算主轴上元素的位置
    // 剩余空间小于 0，对所有元素进行等比压缩
    if (mainSpace < 0) {
        // 只发生在单行的情况
        // overflow (happens only if container is single line), scale every item

        // style[mainSize] 容器的主轴尺寸, (style[mainSize] - mainSpace) 为期望的尺寸
        // mainSpace < 0, 所以 scale 一定小于 1
        let scale = style[mainSize] / (style[mainSize] - mainSpace);
        let currentMain = mainBase;

        // 循环每一个元素
        for (let i = 0; i < items.length; i += 1) {
            let item = item[i];
            let itemStyle = getStyle(item);

            // flex 元素没有权利参加等比压缩，尺寸为 0
            if (itemStyle.flex) {
                itemStyle[mainSize] = 0;
            }

            // 元素主轴尺寸被压缩
            itemStyle[mainSize] = itemStyle[mainSize] * scale;

            // 根据当前主轴的位置 currentMain，算出元素被压缩后的位置
            // currentMain 所排到的当前位置
            itemStyle[mainsStart] = currentMain;
            // 完成主轴计算，如果主轴是 row， left，right，width 被计算出来了
            itemStyle[mainEnd] = itemStyle[mainsStart] + mainsSign * timeStyle[mainSize];
            // 下一个元素的 currentMain 是当前元素的 mainEnd
            currentMain = itemStyle[mainEnd];

        }
    } else {
        // process each flex line
        flexLines.forEach(function handleEachItemInFlexLine(items) {

            let mainSpace = items.mainSpace;
            // flex 的总值
            let flexTotal = 0;

            for (let i = 0; i < items.length; i += 1) {
                let item = items[i];
                let itemStyle = getStyle(item);

                if ((itemStyle.flex !== null) && (itemStyle.flex !== (void 0))) {
                    // 如果有 flex 属性，就给它加到 flex 的总值上去
                    flexTotal += itemStyle.flex;
                    continue;
                }
            }

            // 有 flex 元素，元素可以占满整个行，就不需要 justifyContent 来分配元素间的空隙
            if (flexTotal > 0) {
                // There is flexible flex items
                let currentMain = mainBase;
                for (let i = 0; i < items.length; i += 1) {
                    let item = items[i];
                    let itemStyle = getStyle(item);

                    if (itemStyle.flex) {
                        // 把主轴方向剩余空间 mainSpace 按 flex 值的比例分配给元素
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                    }
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd];
                }
            } else {
                // 没有 flex 元素，就要根据 justifyContent 的值来分配元素间的空隙
                // There is NO flexible flex items, which means, justifyContent should work

                // 上一个元素色结束位置，即当前元素的开始位置
                let currentMain;
                // 元素间的间隔空间
                let step;

                // 从左向右排
                if (style.justifyContent === 'flex-start') {
                    currentMain = mainBase;
                    step = 0;
                }
                // 从右向左排
                if (style.justifyContent === 'flex-end') {
                    currentMain = mainSpace * mainSign + mainBase;
                    step = 0;
                }
                // 左右各留一边
                if (style.justifyContent === 'center') {
                    currentMain = mainSpace / 2 * mainSign + mainBase;
                    step = 0;
                }
                // 元素间均匀间隔
                if (style.justifyContent === 'space-between') {
                    step = mainSpace / (items.length - 1) * mainSign;
                    currentMain = mainBase;
                }
                // 左右边和元素间均匀间隔
                if (style.justifyContent === 'space-around') {
                    step = mainSpace / items.length * mainSign;
                    currentMain = step / 2 + mainBase;
                }
                // 计算元素位置，如果是 row，就是左和右，宽是 mainSize
                for (let i = 0; i < items.length; i += 1) {
                    let item = items[i];
                    let itemStyle = getStyle(item);
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd] + step;
                }
            }
        })
    }

    // compute the cross axis sizes 计算行高 crossSpace
    // align-items (定义交叉轴上如何对齐), align-content (定义多根轴线的对齐方式), asign-self (允许单个项目与其他项目不一样的对齐方式，可覆盖 align-items)
    // 容器的纵轴空隙
    crossSpace = 0;

    // 如果没有定义容器的高，空隙为0，元素的高为 元素高 + 行空隙
    if (!style[crossSize]) { // auto sizing
        crossSpace = 0;
        elementStyle[crossSize] = 0;
        for (let i = 0; i < flexLines.length; i++) {
            elementStyle[crossSize] = elementStyle[crossSize] + flexLines[i].crossSpace
        }
    } else {
        // 如果定义了行高，用总的高度依次减去行的空隙，得到剩余的行高
        crossSpace = style[crossSize];
        for (let i = 0; i < flexLines.length; i += 1) {
            crossSpace -= flexLines[i].crossSpace;
        }
    }

    if (style.flexWrap === 'wrap-reverse') {
        crossBase = style[crossSize];
    } else {
        crossBase = 0;
    }

    // TODO: 没有被用到的变量，
    let lineSize = style[crossSize] / flexLines.length;

    let step;
    // 与交叉轴的起点对齐
    if (style.alignContent === 'flex-start') {
        crossBase += 0;
        step = 0;
    }
    // 与交叉轴的终点对齐
    if (style.alignContent === 'flex-end') {
        crossBase += crossSign * crossSpace;
        step = 0;
    }
    // 与交叉轴的中点对齐
    if (style.alignContent === 'center') {
        crossBase += crossSign * crossSpace / 2;
        step = 0;
    }
    // 与交叉轴两端对齐，轴线之间的间隔平均分布
    if (style.alignContent === 'space-between') {
        crossBase += 0;
        step = crossSpace / (flexLines.length - 1);
    }
    // 每根轴线两侧的间隔都相等。所以，轴线之间的间隔比轴线与边框的间隔大一倍
    if (style.alignContent === 'space-around') {
        step = crossSpace / (flexLines.length);
        // 边是间隙的一半儿大
        crossBase += crossSign * step / 2;
    }
    // 轴线占满整个交叉轴
    if (style.alignContent === 'stretch') {
        crossBase += 0;
        step = 0;
    }

    flexLines.forEach(function (items) {
        // 当前行真实的交叉轴尺寸
        let lineCrossSize = style.alignContent === 'stretch' ?
            items.crossSpace + crossSpace / flexLines.length :
            item.crossSpace;
        // 交叉轴的位置和尺寸需要计算每个元素的尺寸
        for (let i = 0; i < items.length; i += 1) {
            let item = items[i];
            let itemStyle = getStyle(item);

            let align = itemStyle.alignSelf || style.alignItems;

            // 如果 item 没有指定交叉轴尺寸, 给一个默认值
            if (itemStyle[crossSize] === null || itemStyle[crossSize] === undefined) {
                itemStyle[crossSize] = (align === 'stretch') ?
                    lineCrossSize : 0;
            }
            // 对齐行顶
            if (align === 'flex-start') {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            // 对齐行底
            if (align === 'flex-end') {
                itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
                itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize]
            }
            // 对齐行中线
            if (align === 'center') {
                itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            // 如果项目未设置高度或设为auto，将占满整个容器的高度
            if (align === 'stretch') {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = crossBase + crossSign * ((itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) ?
                    itemStyle[crossSize] : lineCrossSize);
                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart]);
            }
        }
        crossBase += crossSign * (lineCrossSize + step);
    });
    console.log('items: ', items);

}

module.exports = layout;