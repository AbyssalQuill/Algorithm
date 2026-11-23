# 递归入门

> [!目标]
> - 理解递归：函数调用它自己
> - 掌握递归的三个要素：终止条件、缩小规模、调用自己
> - 会写阶乘、求和、斐波那契这几个经典例子
> - 知道递归有“调用栈”，也有深度限制

## 函数调用自己

函数里面，可以再调用别的函数，**也可以调用它自己**，这叫**递归**。先看一个最简单的：倒着数数。

```cpp title="down.cpp"
#include <bits/stdc++.h>
using namespace std;
void down(int n){
    if (n==0){
        return;
    }
    cout<<n<<" ";
    down(n-1);
}
int main(){
    down(3);
    cout<<endl;
    return 0;
}
```

```output
3 2 1
```

`down(3)` 输出 3，然后让 `down(2)` 去处理剩下的；`down(2)` 输出 2，再叫 `down(1)`……直到 `n` 变成 0，什么也不做就返回，一层层结束。

## 递归的三个要素

1. **终止条件**：什么时候停？没有它，就会一直调用下去，直到程序崩溃。上例中是 `n==0`。
2. **缩小规模**：每次调用，问题要变得**更小**（上例中 `n` 减 1），才能越来越接近终止条件。
3. **调用自己**：把“大问题”交给“同样的小问题”去做，**并且相信小问题的答案是对的**。

## 经典例子：阶乘

`n! = n × (n-1)!`，而 `1! = 1`。大问题（`n!`）可以交给小问题（`(n-1)!`）：

```cpp title="fact.cpp"
#include <bits/stdc++.h>
using namespace std;
int fact(int n){
    if (n<=1){
        return 1;
    }
    return n*fact(n-1);
}
int main(){
    cout<<fact(5)<<endl;
    return 0;
}
```

```output
120
```

用 `fact(3)` 看看里面发生了什么。右边的“栈”是**还没做完、正在等结果的函数**，最新的一层放在最右边：

```trace
#include <bits/stdc++.h>
using namespace std;
int fact(int n){
    if (n==1) return 1;           //@s3
    return n*fact(n-1);           //@s4
}
int main(){
    cout<<fact(3);                //@s1
    return 0;
}
---
s1 | 栈=fact(3) |  | main 调用 fact(3)，进入第一层。
s3 | 栈=fact(3); n=3 |  | 第一层：n 是 3，不等于 1，不能直接得到答案。
s4 | 栈=fact(3); n=3 |  | 需要 3*fact(2)。第一层先等着，去调用 fact(2)。
s3 | 栈=fact(3) ▸ fact(2); n=2 |  | 第二层：n 是 2，还是不等于 1。
s4 | 栈=fact(3) ▸ fact(2); n=2 |  | 需要 2*fact(1)。第二层也等着，去调用 fact(1)。
s3 | 栈=fact(3) ▸ fact(2) ▸ fact(1); n=1 |  | 第三层：n 是 1，满足终止条件，直接 return 1，不再往下调用。
s4 | 栈=fact(3) ▸ fact(2); n=2; 得到=2 |  | 回到第二层：2*1=2，return 2。第三层结束。
s4 | 栈=fact(3); n=3; 得到=6 |  | 回到第一层：3*2=6，return 6。第二层结束。
s1 | 栈=空; 得到=6 | 6 | 回到 main，拿到 6，输出。
```

“一层层往里调用，到头了再一层层往外带着结果返回”，就是递归的完整过程。这些等待中的函数叠在一起，叫**调用栈**，后面学“栈”这种数据结构时还会再见到它。

## 再看几个例子

**1 + 2 + … + n**：`sum(n) = n + sum(n-1)`，`sum(1)=1`。

**最大公约数**：辗转相除法本身就是递归的：`gcd(a,b) = gcd(b, a%b)`，当 `b==0` 时答案是 `a`。

```cpp title="gcd.cpp"
#include <bits/stdc++.h>
using namespace std;
int gcd(int a,int b){
    return b==0?a:gcd(b,a%b);
}
int main(){
    cout<<gcd(12,18)<<endl;
    return 0;
}
```

```output
6
```

**汉诺塔**需要的步数：搬 `n` 个盘子，要先搬走上面的 `n-1` 个，搬最大的一个（1 步），再把 `n-1` 个搬回来，即 `h(n)=2*h(n-1)+1`：

```cpp title="hanoi.cpp"
#include <bits/stdc++.h>
using namespace std;
int hanoi(int n){
    if (n==0){
        return 0;
    }
    return 2*hanoi(n-1)+1;
}
int main(){
    cout<<hanoi(3)<<endl;
    return 0;
}
```

```output
7
```

## 斐波那契：递归的“陷阱”

斐波那契数列：1, 1, 2, 3, 5, 8, …，每一项是前两项之和。写成递归几乎是照抄定义：

```cpp title="fib.cpp"
#include <bits/stdc++.h>
using namespace std;
int fib(int n){
    if (n<=2){
        return 1;
    }
    return fib(n-1)+fib(n-2);
}
int main(){
    cout<<fib(10)<<endl;
    return 0;
}
```

```output
55
```

但它有个大问题：`fib(5)` 会调用 `fib(4)` 和 `fib(3)`，而 `fib(4)` 又会去调用 `fib(3)`……**同一个值被算了无数遍**。`fib(40)` 要调用大约 3 亿次，程序会慢到超时。

> [!竞赛] 解决办法：记住算过的（记忆化 / 动态规划）
> 把算过的 `fib(k)` 存进数组，下次直接用，就能把指数级的时间降成线性。这个思想就是以后要学的**动态规划**的雏形，现在只要记住：递归写起来简单，但要想想会不会有大量重复计算。

## 递归的深度限制

每一层递归都要占用一小块内存。层数太多（比如递归十几万层），会**栈溢出**，程序直接崩溃（常见报错：运行错误 / Segmentation fault）。所以：

- 递归层数大概能到几万层，不是无限的。
- 能用循环轻松写出来的（比如求 1 加到 n），优先用循环；递归适合“天然就是大问题套小问题”的场合（以后的搜索、分治、树）。

> [!思考] 用递归求 1+2+…+n，写出 `sum(10)`

> [!答案] 参考写法
> `sum(n)=n+sum(n-1)`，终止条件是 `n==0`：
>
> ```cpp title="sum.cpp"
> #include <bits/stdc++.h>
> using namespace std;
> int sum(int n){
>     if (n==0){
>         return 0;
>     }
>     return n+sum(n-1);
> }
> int main(){
>     cout<<sum(10)<<endl;
>     return 0;
> }
> ```
>
> ```output
> 55
> ```

> [!小结]
> - 递归 = 函数调用自己；写递归先想清楚三件事：终止条件、怎么缩小、怎么调用。
> - 调用时一层层向里，到达终止条件后，一层层带着结果返回；等待中的函数叠成“调用栈”。
> - 递归太深会栈溢出；像斐波那契这样有大量重复计算的，要记住算过的结果。
