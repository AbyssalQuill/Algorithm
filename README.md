# 算法笔记本

从零基础到蓝桥杯：动画演示 + 四种语言（C / C++ / Python / Java）逐行同步高亮的代码 + 洛谷例题。

## 运行

```powershell
pnpm install      # 第一次需要（本项目的 .npmrc 已指定官方源）
pnpm dev          # 本地预览：http://localhost:5173
pnpm test         # 引擎测试 + 把 12 份示例程序真的编译运行一遍（需要 gcc / g++ / python / javac）
pnpm build        # 打包到 dist/，是纯静态文件，可放到任何静态托管
```

## 目录

```
src/engine/    帧模型（Recorder）、播放器（usePlayer）、代码标记解析（source）、Shiki 高亮
src/components 数组 / 栈可视化、播放器、代码面板、例题卡片
src/algos/     每个演示 = 一个 AlgoDef：算法（生成帧）+ 画面 + 四种语言的完整程序
src/data/      学习路线、洛谷例题库
src/pages/     首页 / 学习路线 / 动画实验室 / 演示页
tests/         引擎测试、四种语言程序的编译运行测试
```

## 怎么加一个新演示

1. 在 `src/algos/` 新建一个文件，导出一个 `AlgoDef`（参考 `bubbleSort.tsx`）。
2. 算法用 `Recorder.push(步骤标签, 状态, 一句中文讲解)` 每走一步记一帧。
3. 四种语言的程序里，在对应行尾写 `//@步骤标签`（Python 写 `#@步骤标签`），显示时会自动去掉，动画走到哪一步就高亮哪几行。
4. 在 `src/algos/index.ts` 的 `ALGOS` 里加上它；需要的话在 `src/data/roadmap.ts` 把对应主题标上 `lab: 'id'`。
5. `pnpm test` 会检查：每个步骤标签在四种语言里都有对应行，并且四种语言的程序结果和动画一致。

## 注意

- `src/data/problems.ts` 里的洛谷题号和标题，开发时无法联网核对，上线前请逐题点开确认。
- 还没有部署上线；上线前请先确认。
