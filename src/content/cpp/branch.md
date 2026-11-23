# 条件分支：if 与 switch

> [!目标]
> 读完这一课，你应该能根据条件让程序走不同的路径：会写 `if`、`if-else` 和 `else if`，明白嵌套时 `else` 与哪个 `if` 配对，并且会使用三目运算符和 `switch`。

## 单分支：if

程序不可能永远按固定的顺序往下执行，很多时候需要“看情况”：成绩够了就通过，下雨就带伞。`if` 语句就是用来表达这种“如果……就……”的：

```cpp noverify
if (条件){
    条件成立时执行的语句
}
```

圆括号里是一个真假条件（上一课已经学过），不能省略。条件成立时，花括号里的语句才会执行；不成立就直接跳过去。

## if-else：二选一

很多时候条件不成立也要做点什么，这时在 `if` 后面接上 `else`。下面的程序读入一个年份，判断它是不是闰年。闰年的规则是：能被 4 整除但不能被 100 整除，或者能被 400 整除。

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

## else if：在多个条件中选择

当有三种以上的情况时，可以把 `if` 和 `else if` 串起来。下面把百分制成绩转换成等级：90 分以上是 A，80 分以上是 B，60 分以上是 C，其余是 D。

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

程序会从上到下依次检查每个条件，遇到第一个成立的就执行它对应的语句，后面的条件就不再检查了。用 `score=75` 来看看这个过程：

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
s1 | score=75 |  | 变量 score 的值是 75。
s2 | score=75 |  | 检查第一个条件，75>=90 不成立，于是跳过这一支，去检查下一个。
s3 | score=75 |  | 检查第二个条件，75>=60 成立，进入这一支。
s4 | score=75 | C | 执行这一支里的输出语句。至此整个 if 结构已经完成，后面的 else 不会再被检查。
```

> [!注意] 条件的排列顺序会影响结果
> 因为程序只执行第一个成立的分支，所以条件应当按照从严格到宽松的顺序排列。如果把 `score>=60` 放在最前面，那么 85 分也会先满足它，输出的就成了 C。

## 嵌套的 if 与 else 的配对

`if` 的里面还可以再放 `if`。当 `else` 前面有多个 `if` 时，规则是：**`else` 总是和离它最近的、还没有配对的那个 `if` 配对**。

```cpp frag
int a=5,b=0;
if (a>0)
    if (b>0) cout<<"X"<<endl;
    else cout<<"Y"<<endl;
```

```output
Y
```

从缩进看，`else` 好像属于第一个 `if`，可编译器并不关心缩进，它把 `else` 配给了离得最近的 `if (b>0)`，所以这里 `a>0` 成立之后，又因为 `b>0` 不成立而输出了 Y。

> [!提示] 即使只有一条语句，也建议写上花括号
> 加上花括号之后，每个 `else` 属于哪个 `if` 一目了然，不会出现上面这种需要仔细推敲才能看明白的情况，以后往里面添加语句时也不会出错。

## 三目运算符

`条件 ? 值1 : 值2` 是 `if-else` 的一种简写形式：条件成立时取值 1，否则取值 2。

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

求两个数中较大的一个，用它写起来非常简洁。不过一旦条件比较复杂，还是用 `if` 更容易看清楚。

## switch：根据具体的取值分支

如果要根据**某个整数或字符的具体取值**来决定做什么，用 `switch` 比一长串 `else if` 更清楚：

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

使用 `switch` 要注意三点：每个 `case` 后面的值必须是常量；每个分支的末尾通常要写 `break;`，表示这一支执行完毕、跳出整个 `switch`，如果漏了，程序会接着执行下一个 `case` 里的语句（称为“贯穿”）；`default` 处理所有没有被列出的取值。

“贯穿”有时反而是有用的，它可以让多个取值共用同一段代码。比如下面这个程序根据月份给出天数（暂不考虑闰年）：

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

> [!竞赛] 怎样在 if 和 switch 之间选择
> 两者能完成的事情是一样的。需要比较大小、判断区间时用 `if`；需要根据月份、编号、字符这类规整的取值做选择时，`switch` 会更利落。洛谷上“月份天数”之类的题目，两种写法都能通过。

> [!思考] 输入三个整数，输出其中最大的一个
> 只使用 `if`，不要排序。

> [!答案] 参考写法
> 先假设第一个数最大，再依次与另外两个比较，遇到更大的就更新：
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
>```

> [!小结]
> `if` 在条件成立时执行，`else` 处理不成立的情况，`else if` 把多个条件串起来依次检查，只会执行第一个成立的分支。`else` 总是配给最近的 `if`，所以建议总是写上花括号。三目运算符适合简单的二选一，`switch` 适合按具体取值分支，每一支别忘了 `break`。
