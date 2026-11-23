# 算法笔记本

一个面向零基础读者的算法学习网站：从第一行代码开始，系统地学习 C++ 语法，再用动画理解数据结构与算法，最终为算法竞赛打好基础。

线上地址：<https://algo-notebook.pages.dev>

## 有什么

- **学习中心**：C++ 语法基础共 7 章 22 节，每一节是独立的一份文档，可以按目录或思维导图选择。课文里的程序都配有输入输出，其中的“逐步演示”会让代码一行一行高亮，同时显示变量和屏幕输出。
- **动画实验室**：数据结构与算法的可视化演示（目前有栈、冒泡排序、二分查找），可以修改输入数据、单步前进或后退，右侧的代码在 C、C++、Python、Java 之间切换，并随动画同步高亮。
- **洛谷练习**：每一节课后附有只用到本课知识的题目，点击后在洛谷原站打开。

## 本地运行

```powershell
pnpm install
pnpm dev        # 开发，默认 http://localhost:5173
pnpm build      # 构建到 dist/
pnpm test       # 测试
```

技术栈：Vite、React、TypeScript、react-router（HashRouter）、motion。样式是手写的 CSS，字体为霞鹜文楷，没有使用 UI 框架。网站完全是静态的，`dist` 可以放到任意静态托管上。

## 目录结构

```text
src/
  content/cpp/      课文，一节一个 Markdown 文件
  learn/            课程引擎：目录数据（curriculum.ts）、Markdown 渲染、代码块、逐步演示、思维导图
  pages/            页面：首页、学习中心、课文页、动画实验室
  algos/            动画实验室里的算法：运行过程（帧）、画面、四种语言的源码
  engine/           帧模型、播放器、代码高亮
  components/       通用组件
  styles/           global.css（主题与组件）、learn.css（学习中心）、fonts.css（生成）
  assets/           背景图（WebP）与裁剪后的字体
docs/               写作规范
tools/              生成背景图与字体的脚本
tests/              测试
```

## 写一节新课

1. 在 `src/content/cpp/` 里新建 `<slug>.md`，第一行是 `# 标题`。课文遵循 [docs/写作规范.md](docs/写作规范.md)。
2. 在 `src/learn/curriculum.ts` 的对应章节里加一行：标题、简介、预计时间、要点、配套的洛谷题号。
3. 运行 `pnpm test`。测试会把课文里的每个 C++ 程序**真的编译并运行**，并与紧跟着的输出块逐字对比；逐步演示的每个标签也会被检查。需要本机装有 `g++`。

课文里的代码块可以写：

- ` ```cpp `：完整程序。后面紧跟 ` ```input `（可选）和 ` ```output ` 时，测试会据此核对。
- ` ```cpp frag `：放在 `main` 里的片段；` ```cpp top `：放在 `main` 外的定义；` ```cpp noverify `：故意写错的反例。
- ` ```trace `：逐步演示。分隔线 `---` 之前是代码（行尾 `//@标签` 表示这一行属于哪一步），之后每行是 `标签 | 变量 | 新增的输出 | 讲解`。
- 提示框写成 `> [!提示]`、`> [!注意]`、`> [!竞赛]`、`> [!目标]`、`> [!小结]`、`> [!思考]`、`> [!答案]`。

## 生成的资源

- 背景图：`python tools/gen_bg.py` 生成矢量图，`python tools/bake_bg.py` 烘焙成 WebP。烘焙成位图后，浏览器滚动时不必再为背景做任何计算。
- 字体：`python tools/subset_fonts.py` 把霞鹜文楷裁成站点用到的字（一个字重一个文件）。课文或界面里出现了字库没有的汉字时，`pnpm test` 会提醒重新运行它。

## 部署

```powershell
pnpm build
wrangler pages deploy dist --project-name=algo-notebook --branch=main
```

## 说明

课文里引用的洛谷题号和标题是凭记忆整理的，使用前请在洛谷上逐题核对。
