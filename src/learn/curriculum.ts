/**
 * 课程总目录：一课一份文档（src/content/<语言>/<slug>.md），这里只放“目录信息”。
 * 目录页、思维导图、课程页左边的目录树、上一课 / 下一课，全部从这一份数据生成。
 * 想加一课：先在 content 里写好 <slug>.md，再在对应章节里加一行。
 */

export type Tone = 'blue' | 'green' | 'yellow' | 'red'

export interface LessonMeta {
  slug: string
  title: string
  /** 一句话讲这课学什么（目录页显示） */
  summary: string
  /** 预计阅读 + 动手的分钟数 */
  minutes: number
  /** 这课的知识点关键词（思维导图悬停时显示） */
  points: string[]
  /** 配套洛谷例题（题号，详情见 data/problems.ts） */
  problems: string[]
}

export interface Chapter {
  id: string
  title: string
  blurb: string
  tone: Tone
  lessons: LessonMeta[]
}

export interface Track {
  id: string
  title: string
  short: string
  tagline: string
  ready: boolean
  chapters: Chapter[]
}

const cpp: Chapter[] = [
  {
    id: 'start',
    title: '起步：写出第一个程序',
    blurb: '先弄清一个程序由哪几部分组成，再学会输出、变量和输入。这一章学完，你已经能写出会和用户交互的小程序了。',
    tone: 'blue',
    lessons: [
      { slug: 'hello', title: '第一个程序', summary: '拆开一个最小的 C++ 程序，看看 main、头文件、cout、分号和注释各自负责什么。', minutes: 10, points: ['main 函数', '#include', 'cout 输出', '分号与花括号', '注释'], problems: ['P1000'] },
      { slug: 'output', title: '输出', summary: '说明 cout 和 printf 的区别，如何换行、输出特殊字符，以及怎样控制小数位数。', minutes: 12, points: ['cout 与 <<', '换行 \\n 与 endl', '转义字符', 'printf 格式', '保留小数'], problems: ['P1000'] },
      { slug: 'variable', title: '变量与数据类型', summary: '变量如何保存数据，int、long long、double、char、bool 分别适合什么场合。', minutes: 15, points: ['变量 = 带标签的盒子', 'int 与 long long', 'double 小数', 'char 与 bool', '赋值与命名'], problems: ['P5703'] },
      { slug: 'input', title: '输入', summary: '用 cin 和 scanf 读入数据；怎样读一整行、读到输入结束，以及在数据量大时加速输入。', minutes: 15, points: ['cin >>', 'scanf', 'getline 读一行', '读到文件结束', '输入加速'], problems: ['P1001', 'P1421'] },
    ],
  },
  {
    id: 'logic',
    title: '运算与判断',
    blurb: '程序要做的事，归根结底是计算和选择。这一章讲清整数除法、取余和条件判断，它们几乎出现在每一道题里。',
    tone: 'green',
    lessons: [
      { slug: 'arithmetic', title: '算术运算', summary: '四则运算与取余，整数除法容易出错的地方，自增自减、类型转换，以及什么情况下会溢出。', minutes: 15, points: ['整数除法', '取余 %', '++ 与 --', '类型转换', '溢出'], problems: ['P5706', 'P5707'] },
      { slug: 'logic', title: '比较与逻辑', summary: '比较运算和逻辑运算怎么组合，为什么 = 和 == 不能混用，短路求值与运算优先级。', minutes: 12, points: ['关系运算', '逻辑运算', '短路求值', '运算优先级', '区间判断'], problems: ['P5710'] },
      { slug: 'branch', title: '条件分支', summary: 'if、else if、else 的执行顺序，嵌套与 else 的配对规则，三目运算符和 switch。', minutes: 18, points: ['if / else', 'else if 链', '嵌套与悬空 else', '?: 三目', 'switch'], problems: ['P5711', 'P5715', 'P5716', 'P1422'] },
    ],
  },
  {
    id: 'loop',
    title: '循环',
    blurb: '把重复的工作交给程序。先学 for 和 while，再学 break、continue 和循环嵌套。',
    tone: 'yellow',
    lessons: [
      { slug: 'for', title: 'for 循环', summary: '拆解 for 循环的四个部分，学习正序、倒序、固定步长，以及累加累乘的写法。', minutes: 18, points: ['初值 / 条件 / 更新', '正序与倒序', '累加累乘', '循环变量作用域', 'rep 宏'], problems: ['P5722', 'P5719', 'P1424'] },
      { slug: 'while', title: 'while 与 do-while', summary: '次数不确定时怎么写循环：读到 0 结束、读到输入结尾、先做一次再判断的 do-while。', minutes: 15, points: ['while', 'do-while', '不知道次数', '死循环', '输入到文件结束'], problems: ['P1035', 'P1425'] },
      { slug: 'loop-control', title: '循环的控制与嵌套', summary: '提前结束、跳过一轮和循环嵌套，用它们打印图形、输出乘法表并判断素数。', minutes: 20, points: ['break', 'continue', '嵌套循环', '打印图形', '素数判断'], problems: ['P5721', 'P5723', 'P1075'] },
    ],
  },
  {
    id: 'data',
    title: '数组与字符串',
    blurb: '一次处理很多数据。数组负责数，字符串负责文字，两者几乎撑起了入门阶段的全部题目。',
    tone: 'red',
    lessons: [
      { slug: 'array', title: '一维数组', summary: '数组的下标从 0 开始，如何遍历、统计最大最小值、用下标做计数，以及越界为什么危险。', minutes: 20, points: ['声明与下标', '遍历', '越界', '全局数组', '最值 / 计数'], problems: ['P5718', 'P1428', 'P1046', 'P1047'] },
      { slug: 'array2d', title: '二维数组', summary: '像表格一样组织数据：二维数组的遍历、对角线，以及用方向数组处理上下左右。', minutes: 15, points: ['行与列', '双重循环遍历', '矩阵转置', '蛇形填数', '方向数组'], problems: ['P5731', 'P5732'] },
      { slug: 'string', title: '字符与字符串', summary: '字符和 ASCII 码的关系，string 的常用操作：长度、拼接、截取、查找、遍历和反转。', minutes: 22, points: ['char 与 ASCII', 'string 拼接比较', 'substr / find', '遍历字符', 'getline'], problems: ['P5704', 'P5705', 'P1308', 'P1055'] },
    ],
  },
  {
    id: 'func',
    title: '函数',
    blurb: '把一段功能封装起来反复使用。这一章讲函数的写法、参数的传递方式，以及递归。',
    tone: 'blue',
    lessons: [
      { slug: 'function', title: '函数的定义与调用', summary: '函数的定义与调用，返回值和 void，函数的声明顺序，局部变量与全局变量。', minutes: 18, points: ['定义与调用', '返回值', '参数', '声明与定义', '作用域'], problems: ['P5736', 'P5737'] },
      { slug: 'pass-by', title: '函数的参数传递', summary: '传值与传引用的区别，为什么交换两个数的函数必须用引用，数组和大对象怎样传参。', minutes: 15, points: ['传值', '传引用 &', '传数组', 'const 引用', '返回多个结果'], problems: [] },
      { slug: 'recursion', title: '递归入门', summary: '递归的三个要素，阶乘与斐波那契两个经典例子，以及调用栈和递归深度的限制。', minutes: 20, points: ['递归三要素', '阶乘', '斐波那契', '调用栈', '递归与循环'], problems: ['P5739', 'P1028'] },
    ],
  },
  {
    id: 'struct',
    title: '结构体与指针',
    blurb: '用结构体把相关的数据组织在一起，再认识指针和引用这两个 C++ 里最容易让人犯怵的概念。',
    tone: 'green',
    lessons: [
      { slug: 'struct', title: '结构体', summary: '用结构体描述一个学生、一个点，结构体数组，以及给结构体定义比较规则。', minutes: 20, points: ['定义与成员', '初始化', '结构体数组', 'operator<', '构造函数'], problems: ['P5740', 'P5741'] },
      { slug: 'pointer', title: '指针与引用入门', summary: '地址、指针和引用的关系，指针与数组的联系，以及 new 和 delete 的基本用法。', minutes: 18, points: ['地址 &', '指针 *', '指针与数组', '引用', 'new / delete'], problems: [] },
    ],
  },
  {
    id: 'stl',
    title: 'STL',
    blurb: '标准库提供了许多现成的容器和函数。熟练使用它们，代码会更短，也更不容易出错。',
    tone: 'yellow',
    lessons: [
      { slug: 'vector', title: 'vector 动态数组', summary: '可以自动扩容的数组：增删改查、遍历、二维 vector，以及使用时要留意的细节。', minutes: 20, points: ['push_back', '下标与遍历', 'size / empty', 'insert / erase', '二维 vector'], problems: ['P3156'] },
      { slug: 'sort', title: 'sort 与 pair', summary: '用 sort 排序，从大到小、按多个条件排序、自定义比较函数，以及严格弱序的含义。', minutes: 22, points: ['sort 基本用法', '从大到小', 'pair', 'lambda 比较', '严格弱序'], problems: ['P1177', 'P1012'] },
      { slug: 'algo-funcs', title: '常用函数速查', summary: '一次看全最常用的标准库函数：min、max、swap、reverse、unique、lower_bound、gcd、accumulate 等。', minutes: 15, points: ['min max swap', 'reverse / unique', 'lower_bound', '__gcd', 'accumulate'], problems: [] },
      { slug: 'set-map', title: 'set 与 map', summary: 'set 自动去重并排序，map 保存键值对；用它们统计次数、判断元素是否出现过。', minutes: 20, points: ['set 去重排序', 'map 键值对', '统计次数', 'count / find', '遍历'], problems: ['P1059', 'P5266'] },
    ],
  },
  {
    id: 'oop-class',
    title: '类与对象',
    blurb: '回头看结构体，会发现它只管存数据。类把数据和处理数据的函数放在一起，并且可以保护数据、在创建和销毁时自动做一些事。',
    tone: 'red',
    lessons: [
      { slug: 'class-basic', title: '类与对象', summary: '把数据和处理数据的函数放进同一个类里：定义类、创建对象、调用成员函数，并认识到 string 与 vector 其实就是类。', minutes: 18, points: ['class 与对象', '成员变量与成员函数', '点号访问', '类外定义 ::', 'string / vector 是类'], problems: ['P5740'] },
      { slug: 'encapsulation', title: '封装与访问控制', summary: '用 private 和 public 保护数据，通过取值、设值函数让类自己保证数据合理，并弄清 class 与 struct 的区别。', minutes: 15, points: ['private / public', '取值与设值函数', '合法性检查', 'class 与 struct'], problems: [] },
      { slug: 'constructor', title: '构造函数与析构函数', summary: '对象创建时自动执行的构造函数、默认参数与初始化列表，对象销毁时自动执行的析构函数，以及它们的调用顺序。', minutes: 20, points: ['构造函数', '默认参数', '初始化列表', '析构函数', '构造与析构的顺序'], problems: [] },
      { slug: 'member-more', title: 'this、const 与 static', summary: '用 this 指针区分同名成员并写出连续调用，用 const 保护只读对象，用 static 让所有对象共享数据，并学会通过指针访问对象。', minutes: 20, points: ['this 指针', '链式调用', 'const 成员函数', 'static 成员', '-> 与 new / delete'], problems: [] },
    ],
  },
  {
    id: 'oop-inherit',
    title: '继承与多态',
    blurb: '用继承复用已有的类，再用虚函数让同一句调用在不同的对象上产生不同的行为。',
    tone: 'blue',
    lessons: [
      { slug: 'inherit', title: '继承', summary: '让派生类直接获得基类的成员，学习 protected、派生类构造函数的写法，以及基类与派生类的构造和析构顺序。', minutes: 18, points: ['基类与派生类', 'protected', '调用基类构造函数', '构造与析构顺序', '同名函数的隐藏'], problems: [] },
      { slug: 'polymorphism', title: '多态与虚函数', summary: '通过基类的指针调用到对象真实类型的函数：virtual 与 override、对象切片、纯虚函数与抽象类，以及虚析构函数。', minutes: 22, points: ['virtual', 'override', '对象切片', '纯虚函数与抽象类', '虚析构函数'], problems: [] },
    ],
  },
  {
    id: 'oop-more',
    title: '进阶与实战',
    blurb: '运算符重载、拷贝与资源管理、模板，最后把它们用在算法竞赛里：把并查集、矩阵写成可以复用的类。',
    tone: 'green',
    lessons: [
      { slug: 'operator', title: '运算符重载', summary: '为自定义类型重载 +、==、<<，为排序规则重载 <，以及重载 () 得到的仿函数；弄清成员函数与友元函数的区别。', minutes: 22, points: ['operator+', '友元与 <<', '重载 < 用于排序', '仿函数', '重载的规则'], problems: ['P1177'] },
      { slug: 'copy-raii', title: '拷贝与资源管理', summary: '浅拷贝为什么会出错，如何写拷贝构造函数与赋值运算符，什么是 RAII，以及怎样用 vector 和智能指针避免手动管理内存。', minutes: 25, points: ['浅拷贝与深拷贝', '三法则', 'RAII', 'unique_ptr', 'shared_ptr'], problems: [] },
      { slug: 'template', title: '模板入门', summary: '让同一份代码适用于多种类型：函数模板、类模板、多个类型参数，并看清 vector、pair、map 其实都是类模板。', minutes: 18, points: ['函数模板', '类模板', '实例化', '多个类型参数', '模板报错'], problems: [] },
      { slug: 'oop-contest', title: '用类封装数据结构', summary: '在算法竞赛里把数据结构写成类：并查集的路径压缩与按大小合并，矩阵类配合快速幂求斐波那契数。', minutes: 25, points: ['并查集类', '路径压缩', '按大小合并', '矩阵与快速幂', '何时写成类'], problems: ['P3367', 'P1962'] },
    ],
  },
]

export const TRACKS: Track[] = [
  { id: 'cpp', title: 'C++ 语法基础', short: 'C++', tagline: '从零开始，系统地学习 C++ 语法，为后面的数据结构与算法竞赛打下基础。不需要先配置开发环境，直接从语法讲起。', ready: true, chapters: cpp },
  { id: 'c', title: 'C 语法基础', short: 'C', tagline: '', ready: false, chapters: [] },
  { id: 'python', title: 'Python 语法基础', short: 'Python', tagline: '', ready: false, chapters: [] },
  { id: 'java', title: 'Java 语法基础', short: 'Java', tagline: '', ready: false, chapters: [] },
]

export function findTrack(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id)
}

export interface FlatLesson extends LessonMeta {
  track: Track
  chapter: Chapter
  chapterNo: number
  /** 在章内的序号（从 1 开始） */
  no: number
  /** 在整个教程里的序号（从 0 开始） */
  index: number
}

export function flatten(track: Track): FlatLesson[] {
  const out: FlatLesson[] = []
  track.chapters.forEach((chapter, ci) =>
    chapter.lessons.forEach((l, li) => out.push({ ...l, track, chapter, chapterNo: ci + 1, no: li + 1, index: out.length })),
  )
  return out
}

export function findLesson(trackId: string, slug: string) {
  const track = findTrack(trackId)
  if (!track) return undefined
  const all = flatten(track)
  const i = all.findIndex((l) => l.slug === slug)
  if (i < 0) return undefined
  return { lesson: all[i], prev: all[i - 1], next: all[i + 1], all }
}
