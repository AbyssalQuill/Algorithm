# 第一个程序

> [!目标]
> - 看懂一个最小的 C++ 程序，每一行在干什么
> - 认识 `main`、`#include`、`cout`、分号、花括号和注释
> - 自己动手改一改，让程序输出别的话

## 先看它长什么样

这是最经典的第一个程序，它只做一件事：在屏幕上输出一句话。

```cpp title="hello.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    cout<<"Hello, World!"<<endl;
    return 0;
}
```

运行之后，屏幕上会出现：

```output
Hello, World!
```

> [!提示] 现在不用装任何东西
> 这一课只需要“看懂”。等你开始做题的时候，洛谷的题目页面自带代码提交框，把代码贴进去就能测试，不需要先在自己电脑上配环境。

## 一行一行读

| 行 | 代码 | 它在做什么 |
| :-: | :-- | :-- |
| 1 | `#include <bits/stdc++.h>` | 把一大包现成的工具借过来（输入输出、数学、排序……都在里面），后面才能直接用 |
| 2 | `using namespace std;` | 告诉程序“这些工具都放在标准库里”，这样可以直接写 `cout`，不用每次写成 `std::cout` |
| 3 | `int main(){` | **程序的入口**：不管程序多长，都从 `main` 的第一行开始执行 |
| 4 | `cout<<"Hello, World!"<<endl;` | 把引号里的文字输出到屏幕；`endl` 表示换行 |
| 5 | `return 0;` | 告诉系统“程序正常结束了” |
| 6 | `}` | 和第 3 行的 `{` 配成一对，圈出 `main` 的范围 |

## 让它一步步跑给你看

点“播放”，看看程序是怎么从上往下执行的。右边的“屏幕输出”会同步变化。

```trace
#include <bits/stdc++.h>
using namespace std;
int main(){                          //@s1
    cout<<"Hello, World!"<<endl;     //@s2
    return 0;                        //@s3
}
---
s1 |  |  | 程序从 main 开始。花括号里的语句，从上往下，一句一句执行。
s2 |  | Hello, World!\n | 执行输出语句：屏幕上出现 Hello, World!，并且换了一行。
s3 |  |  | 遇到 return 0，程序结束。
```

## 三条小规矩

1. **每条语句以分号结尾**，而且是英文的分号 `;`。上面的 `cout…;` 和 `return 0;` 都是一条语句。
2. **花括号要成对**：有 `{` 就要有 `}`，漏了一个整个程序都过不了。
3. **大小写和符号都要对**：`Main` 不是 `main`；引号、括号、分号必须用英文输入法打出来，中文的 `“ ”`、`；`、`（ ）` 会报错。

## 注释：写给人看的话

程序里可以夹带一些“只给人看、机器直接跳过”的文字，叫**注释**。写代码时，用它记录这一段是干什么的，是个好习惯。

```cpp title="comment.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    // 这是单行注释：从两个斜杠到行尾，程序都会跳过
    cout<<"第一句"<<endl;   // 注释也可以写在一行代码的后面
    /* 这是多行注释，
       可以写很多行 */
    cout<<"第二句"<<endl;
    return 0;
}
```

```output
第一句
第二句
```

## 第一次看到报错，别慌

写错了，编译器会告诉你“哪一行附近有问题”。最常见的两种：

```text
error: expected ';' before 'return'
error: 'cout' was not declared in this scope
```

| 报错 | 通常是因为 | 怎么办 |
| :-- | :-- | :-- |
| `expected ';' before …` | 上一行的末尾漏了分号 | 看报错那一行的**上一行** |
| `'cout' was not declared` | 忘了写 `using namespace std;`，或者头文件那行 | 把前两行补上 |

> [!思考] 动手改一改
> 把程序改成：先输出你的名字，再换一行输出你想对自己说的一句话。

> [!答案] 参考写法
> 写两条 `cout` 语句，每条都以 `endl` 换行就行：
>
> ```cpp frag
> cout<<"我是小明"<<endl;
> cout<<"我一定能学会 C++"<<endl;
> ```

> [!小结]
> - 程序从 `main` 开始，按顺序一句一句执行。
> - 开头固定写 `#include <bits/stdc++.h>` 和 `using namespace std;`。
> - 语句以分号结尾，花括号成对，符号用英文。
> - `//` 和 `/* */` 是注释，不会被执行。
