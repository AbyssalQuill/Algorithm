# 格式化输出与快速读入

> [!目标]
> - 会用 `setw`、`setfill`、`fixed`、`setprecision` 等控制 `cout` 的输出格式，会用 `printf` 的格式符对齐、补零、保留小数
> - 知道关闭同步和解除绑定为什么能让 `cin` 变快，以及这样做的代价
> - 会写一个用 `getchar` 读取整数的快速读入函数

## 控制 cout 的格式

输出课里学过，`cout` 默认按最自然的方式输出数据。如果要让数据对齐、补零或者固定位数，就要用到“操纵符”。它们大多定义在 `<iomanip>` 中，使用时直接用 `<<` 送给 `cout` 即可。

```cpp title="cout_format.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    cout<<setw(6)<<42<<"|"<<setw(6)<<left<<42<<"|"<<right<<endl;
    cout<<setfill('0')<<setw(5)<<42<<setfill(' ')<<endl;
    cout<<fixed<<setprecision(3)<<3.14159<<" "<<2.0<<endl;
    cout<<defaultfloat<<setprecision(6);
    cout<<hex<<255<<" "<<oct<<255<<" "<<dec<<255<<endl;
    cout<<boolalpha<<(3>2)<<" "<<noboolalpha<<(3>2)<<endl;
    return 0;
}
```

```output
    42|42    |
00042
3.142 2.000
ff 377 255
true 1
```

几点需要注意：`setw(n)` 设置下一个输出项的宽度（不足的部分补空格），而且只对紧接着的**一个**输出有效；`left` 和 `right` 控制对齐方式，会一直保持；`setfill` 设置补的字符；`fixed` 配合 `setprecision(n)` 表示固定保留 n 位小数，没有 `fixed` 时 `setprecision` 表示的是总的有效数字位数；`hex`、`oct`、`dec` 切换整数的进制。这些设置会一直保留到被改回去为止，所以格式用完之后要记得恢复。

## printf 的格式符

`printf` 用格式串控制输出，`%` 后面可以加上标志、宽度和精度，最后是类型字母。它写起来紧凑，在比赛里依然被广泛使用。

```cpp title="printf_format.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    printf("[%5d] [%-5d] [%05d]\n",42,42,42);
    printf("[%8.2f] [%-8.1f] [%.0f]\n",3.14159,2.5,7.0);
    printf("%x %X %o %c %s %%\n",255,255,8,'A',"text");
    long long big=1234567890123LL;
    printf("%lld %5.1f%%\n",big,99.5);
    printf("%s 的成绩是 %d\n","小明",95);
    return 0;
}
```

```output
[   42] [42   ] [00042]
[    3.14] [2.5     ] [7]
ff FF 10 A text %
1234567890123  99.5%
小明 的成绩是 95
```

常用的格式符有：`%d` 整数，`%lld` 长整数，`%f` 小数（`double`），`%c` 字符，`%s` 字符串，`%x` 十六进制，`%%` 输出一个百分号。`%5d` 表示至少占 5 个位置、右对齐，`%-5d` 左对齐，`%05d` 用 0 补足，`%.2f` 保留两位小数，`%8.2f` 是总宽度 8、保留两位小数。

> [!注意] `%lld` 对应 `long long`，写成 `%d` 会输出错误的数据；小数无论是 `float` 还是 `double`，`printf` 里都可以用 `%f`，而读入 `scanf` 时则要区分，`double` 用 `%lf`。

## 让 cin 变快

当输入的数据有几十万甚至上百万个时，`cin` 默认的速度就成了问题。原因在于，`cin` 默认与 C 语言的 `scanf` 保持同步，每次读入都要做额外的协调工作；另外 `cin` 与 `cout` 是绑定的，每次读入前都会先把 `cout` 里还没输出的内容输出出来。把这两件事关掉，速度可以提高很多。

```cpp title="fast_cin.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin>>n;
    long long sum=0;
    for (int i=0;i<n;i++){
        int x;
        cin>>x;
        sum+=x;
    }
    cout<<sum<<'\n';
    return 0;
}
```

```input
5
3 -1 4 -1 5
```

```output
10
```

`ios::sync_with_stdio(false)` 关闭同步，`cin.tie(nullptr)` 解除绑定。关闭同步之后，**不能再混用** `cin` 和 `scanf`（或者 `cout` 和 `printf`），否则输入输出的顺序可能错乱，整个程序要统一用一种。输出换行时用 `'\n'` 而不是 `endl`，因为 `endl` 每次都会强制刷新缓冲区，输出量大的时候会明显拖慢。

## 手写快速读入

读入的数据达到上百万个时，可以直接用 `getchar` 一个字符一个字符地读，自己把数字拼出来，通常比 `cin` 和 `scanf` 都快。思路是：先跳过数字前面的所有无关字符（空格、换行），遇到负号就记下来；然后只要是数字就一直累加，`x=x*10+(c-'0')`；遇到非数字字符就结束。

```cpp title="fast_read.cpp"
#include <bits/stdc++.h>
using namespace std;
int readInt(){
    int x=0,sign=1;
    int c=getchar();
    while (c!='-'&&(c<'0'||c>'9')){
        c=getchar();
    }
    if (c=='-'){
        sign=-1;
        c=getchar();
    }
    while (c>='0'&&c<='9'){
        x=x*10+(c-'0');
        c=getchar();
    }
    return x*sign;
}
int main(){
    int n=readInt();
    long long sum=0;
    for (int i=0;i<n;i++){
        sum+=readInt();
    }
    printf("%lld\n",sum);
    return 0;
}
```

```input
5
3 -1 4 -1 5
```

```output
10
```

有些评测机使用 Linux，可以用 `getchar_unlocked` 代替 `getchar`，它不加锁，更快；但这个函数在 Windows 上没有，写进代码后在本地编译不过，所以不要为了一点速度牺牲通用性。如果输入有读到文件结束的需求，`getchar` 在结束时返回 `EOF`（-1），上面的函数遇到 `EOF` 会陷入死循环，需要额外处理。

> [!竞赛] 数据量不超过十万时，`cin` 关闭同步就足够了，不需要手写读入。更大的数据，优先考虑 `scanf` 或者关闭同步的 `cin`，再不够才考虑 `getchar`。输出量大时，把结果先拼到一个 `string` 里，最后一次输出，也能节省不少时间。

> [!思考] 关闭同步之后，为什么不能再混用 `cin` 和 `scanf`？

> [!答案] 参考思路
> 默认情况下 C++ 的流与 C 的 `stdio` 共用同一套缓冲区，混用时顺序正确。关闭同步之后，两者各自缓冲，`cin` 可能先把后面的输入预读到自己的缓冲区里，`scanf` 就读不到它们了，输出也会出现顺序错乱。

> [!小结]
> `setw`、`setfill`、`fixed`、`setprecision` 等操纵符控制 `cout` 的格式；`printf` 用 `%5d`、`%05d`、`%.2f` 这类格式符。`ios::sync_with_stdio(false)` 和 `cin.tie(nullptr)` 让 `cin` 变快，代价是不能混用 C 风格的输入输出；更快的办法是用 `getchar` 自己读数字。
