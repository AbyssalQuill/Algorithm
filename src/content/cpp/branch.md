# 分支：if 与 switch

> [!目标]
> - 会写 `if`、`if-else`、`else if` 多分支
> - 会写嵌套的 `if`，并知道 `else` 和哪个 `if` 配对
> - 会用三目运算符 `?:` 简写，会用 `switch`

## if：满足条件才做

```cpp noverify
if (条件){
    条件成立时执行的语句
}
```

条件是一个真假值（上一课学过），圆括号不能省，花括号里是条件成立时才执行的语句。

## if-else：二选一

输入一个年份，判断是不是闰年。闰年的规则是：能被 4 整除但不能被 100 整除，或者能被 400 整除。

```cpp title="leap.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int y;
    cin>>y;
    if ((y%4==0&&y%100!=0)||y%400==0){
        cout<<"闰年"<<endl;
    }else{
        cout<<"平年"<<endl;
    }
    return 0;
}
```

```input
2024
```

```output
闰年
```

## else if：多选一

分数换等级：90 以上是 A，80 以上是 B，60 以上是 C，其他是 D。条件**从上往下依次检查，遇到第一个成立的就执行它，后面的全部跳过**。

```cpp title="grade.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int score;
    cin>>score;
    if (score>=90){
        cout<<"A"<<endl;
    }else if (score>=80){
        cout<<"B"<<endl;
    }else if (score>=60){
        cout<<"C"<<endl;
    }else{
        cout<<"D"<<endl;
    }
    return 0;
}
```

```input
85
```

```output
B
```

看看 `score=75` 时，程序是怎么一路检查下来的：

```trace
int score=75;                    //@s1
if (score>=90){                  //@s2
    cout<<"A";
}else if (score>=60){            //@s3
    cout<<"C";                   //@s4
}else{
    cout<<"D";
}
---
s1 | score=75 |  | 变量 score 是 75。
s2 | score=75 |  | 第一个条件：75>=90？不成立，跳过这一支，去看下一个。
s3 | score=75 |  | 第二个条件：75>=60？成立，就进入这一支。
s4 | score=75 | C | 执行这一支里的输出。后面的 else 不用看了，整个 if 结束。
```

> [!注意] 多分支的顺序很重要
> 如果上面把 `score>=60` 写在最前面，那 85 分也会先满足它，输出 C。条件要**从严到宽**排列。

## 嵌套的 if，以及悬空的 else

`if` 里面可以再放 `if`。当 `else` 前面有好几个 `if` 时，**`else` 总是和离它最近的那个 `if` 配对**：

```cpp frag
int a=5,b=0;
if (a>0)
    if (b>0) cout<<"X"<<endl;
    else cout<<"Y"<<endl;
```

```output
Y
```

缩进看起来像是 `else` 跟着第一个 `if`，但编译器不看缩进，它让 `else` 跟了里面那个 `if (b>0)`。

> [!提示] 一律写花括号
> 就算只有一条语句，也加上 `{ }`。既不会写出“悬空 else”这种歧义，以后往里加语句也不会出错。

## 三目运算符：if-else 的缩写

格式是 `条件 ? 值1 : 值2`：条件成立就取值 1，否则取值 2。

```cpp frag
int a=7,b=3;
int m=a>b?a:b;
cout<<m<<endl;
cout<<(a%2==0?"偶数":"奇数")<<endl;
```

```output
7
奇数
```

求两个数里较大的那个，这样写最简洁。但条件复杂时还是 `if` 更清楚，别硬缩。

## switch：按“取值”分支

当要根据**一个整数（或字符）的具体取值**做不同的事时，`switch` 比一长串 `else if` 清楚：

```cpp title="switch.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int d;
    cin>>d;
    switch (d){
        case 1: cout<<"星期一"<<endl; break;
        case 2: cout<<"星期二"<<endl; break;
        case 3: cout<<"星期三"<<endl; break;
        default: cout<<"其他"<<endl;
    }
    return 0;
}
```

```input
3
```

```output
星期三
```

- 每个 `case` 后面的值必须是常量。
- 每一支的末尾要写 `break;`，表示“这一支做完了，跳出 switch”。**忘了 `break`，程序会继续往下执行下一个 `case`**（叫“贯穿”）。
- `default` 是“都不匹配时”的那一支。

“贯穿”有时是好事，可以让几个值共用一段代码。算某个月有几天（不考虑闰年）：

```cpp title="days.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int m,d;
    cin>>m;
    switch (m){
        case 2: d=28; break;
        case 4: case 6: case 9: case 11: d=30; break;
        default: d=31;
    }
    cout<<d<<endl;
    return 0;
}
```

```input
4
```

```output
30
```

> [!竞赛] 比较的东西多就用 if，值很规整就用 switch
> 两者能做的事一样。题目里要比较大小、判断区间，用 `if`；要根据月份、编号、字符做选择，`switch` 更利落。洛谷“月份天数”之类的题目，两种写法都能过。

> [!思考] 输入三个整数，输出最大的那个
> 只用 `if`，不排序。

> [!答案] 参考写法
> 先假设第一个最大，再依次和另外两个“打擂台”：
>
> ```cpp frag
> int a=3,b=9,c=5;
> int mx=a;
> if (b>mx){
>     mx=b;
> }
> if (c>mx){
>     mx=c;
> }
> cout<<mx<<endl;
> ```
>
> ```output
> 9
> ```

> [!小结]
> - `if / else if / else`：从上往下检查，第一个成立的执行，其余跳过。
> - `else` 和离它最近的 `if` 配对；一律写花括号最保险。
> - `条件?值1:值2` 是二选一的简写；`switch` 按取值分支，别忘了 `break`。
