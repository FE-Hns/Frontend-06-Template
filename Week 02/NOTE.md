# 学习笔记

> 写在前面，本章主要学习了广度优先搜索和A*算法，配合布局形成地图来寻找最优的路径问题。

## 1.构建地图编辑器

    构建地图编辑是利用上一章学习的内容，采用一维数组作为地图的坐标系（一维数组性能比较好）。双层循环，外层循环当y坐标，内层循环当做x坐标，每次动态创建cell，append到父容器节点中。

    这里有个小问题需要记录一下，关于css样式的问题。当给每个cell添加display:inline-block的时候，会发现每一行之间的缝隙很大。需要设置font-size:0，而且也需要设置垂直方向对齐方式。

    由于没有存入数据库，故而采用localstorage本地存储。


## 2.广度优先搜索

    在设定完起点和终点之后，分析得知，每次能走8个点位，即上下左右和对角线对应的4个点，再从这个8个点位依次使用这种方式去走。
    所以采用广度优先搜索。

    广度优先搜索的核心在于队列，所谓队列先进先出。

    固定代码套路是

    let queue = [start]

    while(queue.length){
        // 每次取出第一项
        let d = queue.shift()
        // 判断是否满足条件
        if(condition) {
            // 逻辑
        }
        // 否则继续把数据推入到queue中
        //
        queue.push()
    }

## 3.启发式寻路

    A*算法告诉我们，估值小于当前点到终点的路径，那就一定会找到最优的路径。

    所以会创建一种数据结构，粗糙来看可以简单定义为这种

    class SortData {
        constructor(data, compare) {
            this.data = data.slice()
            this.compare = compare || ((a, b) => a - b)
        }
        take() {
            if (!this.data.length) {
                return;
            }
            let minNum = this.data[0]
            let minIndex = 0
            for (let i = 1; i < this.data.length; i++) {
                if (this.compare(this.data[i],minNum) < 0) {
                    minNum = this.data[i]
                    minIndex = i
                }                    
            }
            // 把最后一位的值，赋值给当前最小值的位置
            // 这样只交换一次，多出一个最后一位的值，所以需要pop掉
            this.data[minIndex] = this.data[this.data.length - 1]
            this.data.pop()
            return minNum;
        }
        give(v) {
            this.data.push(v)
        }
        get length() {
            return this.data.length;
        }
    }

    但如果说想将性能提升一下，就需要使用到二叉堆。创建一个二叉堆的类

    // 采用二叉堆的方式
    class BinaryHeapSorted {
        constructor(arr,compare) {
            this.data = [...arr]
            this.compare = compare || ((a,b) => a - b)
            this.len = arr.length
            // 构建堆
            this.buildHeap()
        }
        // 获取节点i的父节点
        parent(i) {
            return Math.floor((i - 1) / 2)
        }
        // 获取节点i的左儿子节点
        left(i) {
            return 2*i+1
        }
        // 获取节点i右儿子节点
        right(i) {
            return 2*i+2
        }
        // 根据数组元素索引进行交换
        swap(i,j) {
            let tmp = this.data[j]
            this.data[j] = this.data[i]
            this.data[i] = tmp
        }
        // 堆化操作
        heapify(i) {
            let left = this.left(i)
            let right = this.right(i)
            let small = i
            // 如果左节点比较小
            if (left < this.length && this.compare(this.data[left], this.data[small]) < 0) {
                small = left
            }
            // 如果右节点比较小
            if (right < this.length && this.compare(this.data[right], this.data[small]) < 0) {
                small = right
            }
            if (small !== i) {
                this.swap(i, small)
                this.heapify(small)
            }
        }
        // 构建
        buildHeap() {
            let middle = Math.floor(this.len / 2)
            for (let i = middle - 1; i >= 0; i--) {
                this.heapify(i)
            }
        }
        // 取值
        take() {
            if (!this.data.length) {
                return;
            }
            if (this.length == 1) {
                this.len = 0;
                return this.data[0]
            }
            let v = this.data[0]
            this.data[0] = this.data[this.length - 1];
            this.len--
            this.heapify(0)
            return v;
        }
        // 插入值
        give(v) {
            this.data[this.length] = v
            this.len++;
            this.buildHeap()
            return v;
        }
        get length() {
            return this.len
        }
    }
