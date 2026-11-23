# 输入

> [!目标]
> 读完这一课，你应该能用 `cin` 和 `scanf` 读入整数、小数和整行文字，能处理“读到输入结束”和“多组数据”这两种常见的输入形式，并知道数据量较大时怎样加速输入。

## 用 cin 读入数据

题目里的测试数据，是通过“标准输入”交给程序的。`cin>>变量` 的意思是：从输入中读取一个值，存进这个变量。下面是一个读入两个整数并输出它们之和的程序。

```cpp title="add.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int a,b;
    cin>>a>>b;
    cout<<a+b<<endl;
    return 0;
}
```

下面的“输入”是交给程序的数据，“输出”是程序给出的结果：

```input
3 4
```

```output
7
```

`cin` 在读取时会自动跳过空格和换行，所以输入的两个数无论是写在同一行，还是分成两行，程序读到的都是 3 和 4。可以点播放，看看这三条语句是怎样配合的（这里假设输入是 `3 4`）：

```trace
int a,b;            //@s1
cin>>a>>b;          //@s2
cout<<a+b;          //@s3
---
s1 | a=?; b=? |  | 创建变量 a 和 b，它们里面还没有有意义的值。
s2 | a=3; b=4 |  | cin 从输入里先读出 3，存进 a，再读出 4，存进 b。
s3 | a=3; b=4 | 7 | 计算 a+b 得 7，并输出。
```

`cin` 会根据变量的类型决定怎样解释输入，所以读入小数和读入整数的写法是一样的：

```cpp title="area.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n;
    double r;
    cin>>n>>r;
    cout<<n*r<<endl;
    return 0;
}
```

```input
3 2.5
```

```output
7.5
```

## 用 scanf 读入数据

`scanf` 与 `printf` 配套使用，同样是“模板加填空”的形式。需要注意变量前要加上取地址符 `&`，它表示把读到的值放进这个变量所在的位置，等学了指针就会明白它的来历。

```cpp title="scanf.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int a,b;
    scanf("%d%d",&a,&b);
    printf("%d\n",a+b);
    return 0;
}
```

```input
3 4
```

```output
7
```

不同类型对应的占位符，读和写并不完全相同，需要分别记住：

| 类型 | `scanf`（读入） | `printf`（输出） |
| :-- | :-: | :-: |
| `int` | `%d` | `%d` |
| `long long` | `%lld` | `%lld` |
| `double` | `%lf` | `%f` |
| `char` | `%c` | `%c` |

> [!注意] 用 `scanf` 读 `double` 必须写 `%lf`
> 写成 `%f` 不会报错，但读进来的是一个错误的值，这是初学者最容易踩的坑之一。`cin` 会自动按类型处理，没有这个问题。

## 读入一整行

`cin>>` 读到空格就会停下，所以没法读入带空格的句子。想读一整行，要用 `getline`：

```cpp title="line.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n;
    string s;
    cin>>n;
    cin.ignore();
    getline(cin,s);
    cout<<n<<"|"<<s<<endl;
    return 0;
}
```

```input
5
hello world
```

```output
5|hello world
```

程序中间那句 `cin.ignore()` 是有原因的。`cin>>n` 读完数字 5 之后，数字后面的换行符还留在输入里，如果不处理，`getline` 一开始就会读到这个换行符，得到一个空行。`cin.ignore()` 的作用，就是把这个多余的换行符丢掉。凡是先用 `cin>>` 读数字、紧接着要用 `getline` 读整行的地方，都需要这一句。

## 读到输入结束为止

有的题目不会告诉你一共有多少个数，只说“输入若干个整数”。这时可以把 `cin>>x` 直接写在循环条件里：当输入已经读完，再读取就会失败，条件随之变为假，循环就自然结束了。

```cpp frag
int x,sum=0;
while(cin>>x){
    sum+=x;
}
cout<<sum<<endl;
```

```input
1 2 3 4
```

```output
10
```

## 多组数据

另一种常见的格式是，第一个数 `t` 说明后面一共有多少组数据，然后依次给出每一组：

```cpp frag
int t;
cin>>t;
while(t--){
    int a,b;
    cin>>a>>b;
    cout<<a+b<<endl;
}
```

```input
3
1 2
10 20
-5 5
```

```output
3
30
0
```

`while(t--)` 的意思是每循环一次让 `t` 减 1，减到 0 时停止，这个写法在循环那一章还会详细解释。

## 加速输入

当数据量很大，比如有十几万个数需要读入时，默认的 `cin` 会比 `scanf` 慢不少。只要在 `main` 的开头加上下面两句，就能让它的速度接近 `scanf`：

```cpp title="fast.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int a,b;
    cin>>a>>b;
    cout<<a+b<<'\n';
    return 0;
}
```

```input
3 4
```

```output
7
```

> [!竞赛] 使用输入加速的两点约定
> 一旦写了 `ios::sync_with_stdio(false);`，就不要再把 `cin/cout` 和 `scanf/printf` 混着用，否则输入输出的顺序可能错乱，要么全用前者，要么全用后者。另外加速之后，输出换行建议用 `'\n'`，不要用 `endl`。数据量不大时完全不需要加速，先保证答案正确更重要。

> [!思考] 输入的第一行是整数 `n`，第二行是 `n` 个整数。要把它们都读进来，应该怎么写？
> 这个问题需要用到循环，等下一章学完之后，你就能自己写出来。

> [!小结]
> 读入数据用 `cin>>变量` 或 `scanf`，前者按变量类型自动处理，后者要写对占位符并加 `&`。整行文字用 `getline`，并且在它之前要用 `cin.ignore()` 清掉残留的换行符。输入长度不确定时用 `while(cin>>x)`，有多组数据时先读 `t` 再循环；数据量很大时，加上两句输入加速的设置。
