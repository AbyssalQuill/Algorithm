export interface Topic {
  title: string
  /** 已上线的动画实验室 id */
  lab?: string
}

export interface Stage {
  no: number
  name: string
  blurb: string
  topics: Topic[]
}

export const STAGES: Stage[] = [
  {
    no: 0,
    name: '起步',
    blurb: '从最基础的输入输出开始，写出第一个能运行的程序。',
    topics: [{ title: '第一个程序' }, { title: '输入输出（cin / scanf / input / Scanner）' }, { title: '看懂编译报错' }],
  },
  {
    no: 1,
    name: '语法入门',
    blurb: '同一个概念，用 C、C++、Python、Java 四种语言并排对照着学。',
    topics: [
      { title: '变量与数据类型' },
      { title: '运算符与表达式' },
      { title: '分支：if / switch' },
      { title: '循环：for / while' },
      { title: '函数' },
      { title: '数组与字符串' },
      { title: '指针与引用' },
      { title: '结构体与类' },
      { title: '容器与集合' },
    ],
  },
  {
    no: 2,
    name: '数据结构',
    blurb: '每种数据结构都配有动画，可以直观地看到它如何存放数据、如何增删。',
    topics: [
      { title: '数组与顺序表' },
      { title: '链表' },
      { title: '栈：括号匹配', lab: 'bracket-stack' },
      { title: '队列与双端队列' },
      { title: '哈希表' },
      { title: '堆与优先队列' },
      { title: '二叉树与二叉搜索树' },
      { title: '并查集' },
      { title: '树状数组' },
      { title: '线段树' },
      { title: '字典树 Trie' },
      { title: '图的存储' },
      { title: 'ST 表' },
    ],
  },
  {
    no: 3,
    name: '算法',
    blurb: '从复杂度、排序、二分查找，一直到动态规划与图论。',
    topics: [
      { title: '时间复杂度' },
      { title: '冒泡排序', lab: 'bubble-sort' },
      { title: '选择 / 插入排序' },
      { title: '归并排序' },
      { title: '快速排序' },
      { title: '二分查找', lab: 'binary-search' },
      { title: '双指针' },
      { title: '前缀和与差分' },
      { title: '递归与分治' },
      { title: '枚举与模拟' },
      { title: 'DFS / BFS' },
      { title: '回溯' },
      { title: '贪心' },
      { title: '动态规划' },
      { title: '最短路' },
      { title: '最小生成树' },
      { title: '拓扑排序' },
      { title: '数论基础' },
      { title: '字符串算法' },
      { title: '位运算' },
      { title: '高精度' },
    ],
  },
  {
    no: 4,
    name: '算法竞赛冲刺',
    blurb: '把学过的内容串起来，针对比赛做综合训练。',
    topics: [{ title: '常见考点梳理' }, { title: '分类题单' }, { title: '模拟题与限时训练' }, { title: '比赛技巧与代码模板' }, { title: '易错点汇总' }],
  },
]

export const liveCount = (s: Stage) => s.topics.filter((t) => t.lab).length
