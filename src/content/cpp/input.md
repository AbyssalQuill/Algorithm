# 输入：让程序听你说

> [!目标]
> - 会用 `cin` 读入整数、小数
> - 会用 `scanf`，知道 `%d`、`%lld`、`%lf` 怎么对应
> - 会读一整行，会读到输入结束为止，会处理“多组数据”
> - 知道怎么给输入提速

## cin：从键盘（输入）里读数据

题目里的数据，都是通过“标准输入”交给程序的。`cin>>变量` 的意思是：从输入里读一个值，放进这个变量。

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

下面的 **输入** 是我们给程序的数据，**输出** 是程序答的：

```input
3 4
```

```output
7
```

`cin` 读数据时，会**自动跳过空格和换行**。所以输入写成 `3 4`（一行）还是写成两行，程序都读得到 3 和 4。

点播放看看这三行的过程（假设输入是 `3 4`）：

```trace
int a,b;            //@s1
cin>>a>>b;          //@s2
cout<<a+b;          //@s3
---
s1 | a=?; b=? |  | 造了两个盒子 a 和 b，里面还没有放有意义的值。
s2 | a=3; b=4 |  | cin 从输入里先读到 3，放进 a；再读到 4，放进 b。
s3 | a=3; b=4 | 7 | 算出 a+b=7，输出。
```

读小数也一样，`cin` 会按变量的类型来读：

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

## scanf：C 风格的输入

`scanf` 和 `printf` 是一对，同样是“模板 + 填空”。注意变量前面要加一个 **`&`**（意思是“把值放到这个盒子里”，后面学指针会讲清楚）。

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

不同类型的占位符，**读和写不完全一样**，要记牢：

| 类型 | `scanf`（读） | `printf`（写） |
| :-- | :-: | :-: |
| `int` | `%d` | `%d` |
| `long long` | `%lld` | `%lld` |
| `double` | `%lf` | `%f` |
| `char` | `%c` | `%c` |

> [!注意] `scanf` 读 `double` 要写 `%lf`
> 写成 `%f` 会读出一堆乱七八糟的值，这是新手最常见的坑之一。`cin` 不用操心这些。

## 读一整行：getline

`cin>>` 遇到空格就停，读不了带空格的句子。想读**一整行**，用 `getline`：

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

为什么中间要写 `cin.ignore()`？因为 `cin>>n` 读完数字 `5` 之后，**换行符还留在输入里**，不处理的话，`getline` 一上来就读到这个换行，得到一个空行。`cin.ignore()` 的作用就是把这个多余的换行吃掉。

> [!提示] 一个规律
> “先用 `cin>>` 读数字，再用 `getline` 读整行”之间，就加一句 `cin.ignore();`。

## 读到输入结束为止

有时候题目不告诉你有多少个数，只说“输入若干个整数”。这时用 `while(cin>>x)`：`cin` 没数据可读时，条件就变成假，循环自然结束。

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

另一种常见写法是：第一行先给一个 `t`，表示接下来有 `t` 组数据。

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

`while(t--)` 的意思：每循环一次，`t` 减 1，减到 0 就停。先别深究，下一章讲循环时会细讲。

## 输入加速

数据量一大（比如十几万个数），`cin` 会明显比 `scanf` 慢。在 `main` 开头加上这两句，就能让它跑得一样快：

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

> [!竞赛] 加速的两条注意
> - 加了 `ios::sync_with_stdio(false);` 之后，**不要再混用** `cin/cout` 和 `scanf/printf`，顺序会乱。要么全用前者，要么全用后者。
> - 输出换行用 `'\n'`，别用 `endl`。数据量不大时，不加速也完全没问题，先保证答案对。

> [!思考] 想一想
> 输入的第一行是整数 `n`，第二行是 `n` 个数。要把这些数读进来，该怎么写？（先想想，下一章学了循环就能写出来。）

> [!小结]
> - `cin>>a>>b;` 读多个值，自动跳过空白；`scanf` 要写占位符和 `&`。
> - 整行用 `getline`；数字后面接 `getline` 之前，补一句 `cin.ignore();`。
> - 不知道有多少数：`while(cin>>x)`；多组数据：先读 `t` 再循环。
> - 数据量大时加两句输入加速，并且别混用 `cin` 和 `scanf`。
