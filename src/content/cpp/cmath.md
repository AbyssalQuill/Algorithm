# 数学函数

> [!目标]
> - 会用 `fabs`、`ceil`、`floor`、`round` 等函数对小数取整，并清楚它们对负数的处理
> - 会用 `pow`、`sqrt`、`log` 一类的函数，知道 `pow` 为什么不适合做整数运算
> - 掌握浮点数比较要用误差范围，认识三角函数、特殊值和随机数

## 头文件 cmath

使用万能头文件 `<bits/stdc++.h>` 时，下面所有的数学函数都已经可以直接使用。它们来自标准头文件 `<cmath>`。多数函数以 `double` 为参数，返回 `double`。

## 绝对值与取整

小数取整有四种常见的方式，区别主要体现在对负数的处理上：`floor` 向下取整（取不大于它的最大整数），`ceil` 向上取整，`trunc` 直接舍去小数部分（向零取整），`round` 四舍五入（正好一半时远离零）。

```cpp title="round.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    double x=-3.7;
    cout<<fabs(x)<<" "<<ceil(x)<<" "<<floor(x)<<" "<<round(x)<<" "<<trunc(x)<<endl;
    cout<<round(2.5)<<" "<<round(-2.5)<<" "<<round(3.7)<<endl;
    cout<<fixed<<setprecision(1);
    cout<<fmod(5.3,2.1)<<" "<<fmod(-5,3)<<" "<<(-5)%3<<endl;
    return 0;
}
```

```output
3.7 -3 -4 -4 -3
3 -3 4
1.1 -2.0 -2
```

对于 -3.7：向上取整是 -3，向下取整是 -4，四舍五入是 -4，直接舍去小数部分是 -3。`fabs` 是求浮点数的绝对值，整数用 `abs`，`long long` 用 `llabs`。`fmod(x,y)` 是浮点数的取余，结果的符号与 `x` 相同，和整数的 `%` 一致，但 `%` 只能用于整数。

> [!竞赛] 整数相除后向上取整，不需要调用 `ceil`，写成 `(a+b-1)/b` 就可以了。用 `ceil(a/b)` 会先做整数除法，已经丢失了小数部分，结果是错的。

## 幂、平方根与对数

`pow(a,b)` 计算 a 的 b 次方，`sqrt` 开平方，`cbrt` 开立方，`hypot(x,y)` 计算 `sqrt(x*x+y*y)`，也就是直角三角形的斜边。`exp(x)` 是 e 的 x 次方，`log` 是以 e 为底的自然对数，`log2` 和 `log10` 是以 2 和 10 为底的对数。其他底数的对数用换底公式：`log(x)/log(b)`。

```cpp title="pow.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    cout<<pow(2,10)<<" "<<sqrt(144)<<" "<<cbrt(27)<<" "<<hypot(3,4)<<endl;
    cout<<log2(1024)<<" "<<log10(1000)<<" "<<log(exp(1))<<endl;
    cout<<fixed<<setprecision(4)<<log(81)/log(3)<<endl;
    int n=49;
    int r=round(sqrt(n));
    cout<<(r*r==n?"是完全平方数":"不是完全平方数")<<endl;
    return 0;
}
```

```output
1024 12 3 5
10 3 1
4.0000
是完全平方数
```

判断完全平方数时，`sqrt(n)` 是浮点数，直接转成整数有可能因为微小的误差少 1，所以先 `round` 再平方来核对更稳妥。

> [!注意] `pow` 的结果是 `double`，计算 `pow(10,18)` 一类大数时会有舍入误差，转成整数时可能得到比正确值小 1 的数。算整数的幂，应该用循环、快速幂，或者对 2 的幂直接写 `1<<k`。

## 浮点数的比较

小数在计算机里是用二进制近似保存的，所以经常有微小的误差。最典型的例子是 `0.1+0.2` 并不严格等于 `0.3`。判断两个小数是否相等，不应当直接用 `==`，而是看它们的差是不是足够小。

```cpp title="eps.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    double a=0.1+0.2,b=0.3;
    const double eps=1e-9;
    cout<<(a==b)<<" "<<(fabs(a-b)<eps)<<endl;
    cout<<isnan(sqrt(-1.0))<<" "<<isinf(1.0/0.0)<<endl;
    return 0;
}
```

```output
0 1
1 1
```

`eps` 取多大，要看题目所需要的精度，一般选 1e-8 或 1e-9。`sqrt(-1)` 得到的是“非数”（NaN），`1.0/0.0` 得到的是无穷大，可以分别用 `isnan` 和 `isinf` 判断。

## 三角函数

`sin`、`cos`、`tan` 的参数是弧度而不是角度，反函数 `asin`、`acos`、`atan` 返回的也是弧度。圆周率没有标准的常量名，最可靠的写法是 `acos(-1)`。`atan2(y,x)` 根据坐标 `(x,y)` 求出它与 x 轴正方向的夹角，会正确区分象限，比 `atan(y/x)` 好用。

```cpp title="trig.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    const double PI=acos(-1);
    cout<<fixed<<setprecision(4);
    cout<<PI<<endl;
    cout<<sin(30*PI/180)<<" "<<cos(60*PI/180)<<endl;
    cout<<atan2(1,1)*180/PI<<" "<<atan2(1,-1)*180/PI<<endl;
    return 0;
}
```

```output
3.1416
0.5000 0.5000
45.0000 135.0000
```

30 度要先乘以 `PI/180` 换成弧度，再交给 `sin`。`atan2(1,-1)` 对应第二象限，得到 135 度，而 `atan(1/-1)=atan(-1)` 只能给出 -45 度，会把象限弄混。

## 随机数

`rand()` 返回一个 0 到 `RAND_MAX` 之间的整数，`srand(seed)` 设置种子，常见的做法是 `srand(time(0))`，让每次运行的序列不同。不过 `rand()` 的质量一般，范围也只有 32767 左右（在某些环境），所以更推荐使用 C++11 的 `mt19937`。

```cpp frag
mt19937 rng(time(0));
int x=rng()%100;
uniform_int_distribution<int> dist(1,6);
int die=dist(rng);
```

随机数的具体数值每次运行都不同，所以没有固定的输出。比赛里想要“对拍”（用随机数据比较两个程序的输出）时，才会用到随机数，题目本身一般是确定性的。

> [!思考] 为什么判断两个小数是否相等要用 `fabs(a-b)<eps`，而不是 `a==b`？

> [!答案] 参考思路
> 小数在计算机里用有限位二进制表示，许多十进制小数（比如 0.1）无法被精确地存下，运算过程中还会累积舍入误差。两个理论上相等的数，实际保存的值可能有极小的差别，所以只能看它们是否“足够接近”。

> [!小结]
> `floor`、`ceil`、`trunc`、`round` 四种取整的区别在负数上最明显；整数向上取整用 `(a+b-1)/b`。`pow` 返回 `double`，不要用来算大的整数幂。比较小数要用 `fabs(a-b)<eps`。三角函数使用弧度，圆周率写作 `acos(-1)`，求角度用 `atan2`。
