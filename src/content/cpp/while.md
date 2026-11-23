# while 与 do-while

> [!目标]
> - 会写 `while`，知道它和 `for` 各自适合什么场合
> - 会用 `while` 处理“不知道要循环几次”的问题
> - 认识 `do-while`，知道它“至少执行一次”
> - 会避开死循环

## while：条件成立就一直做

```cpp noverify
while (条件){
    循环体
}
```

`for` 适合“明确知道要循环几次”（比如 1 到 100）。**不知道会循环几次，只知道什么时候该停**，就用 `while`。

比如：求一个数各位数字之和。每次取出个位加起来，再把个位去掉，直到数字变成 0。一共要几轮取决于数字有几位。

```cpp title="digits.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,sum=0;
    cin>>n;
    while (n>0){
        sum+=n%10;
        n/=10;
    }
    cout<<sum<<endl;
    return 0;
}
```

```input
12345
```

```output
15
```

用 `n=123` 看看每一轮发生了什么：

```trace
int n=123,sum=0;      //@s1
while (n>0){          //@s2
    sum+=n%10;        //@s3
    n/=10;            //@s4
}
cout<<sum;            //@s5
---
s1 | n=123; sum=0 |  | 准备两个变量。
s2 | n=123; sum=0 |  | 检查 n>0：成立，进入循环。
s3 | n=123; sum=3 |  | n%10 是个位 3，加进 sum。
s4 | n=12; sum=3 |  | n/=10：去掉个位，n 变成 12。
s2 | n=12; sum=3 |  | 回到条件：12>0，成立。
s3 | n=12; sum=5 |  | 个位是 2，sum 变成 5。
s4 | n=1; sum=5 |  | n 变成 1。
s2 | n=1; sum=5 |  | 1>0，成立。
s3 | n=1; sum=6 |  | 个位是 1，sum 变成 6。
s4 | n=0; sum=6 |  | n 变成 0。
s2 | n=0; sum=6 |  | 检查 0>0：不成立，循环结束。
s5 | n=0; sum=6 | 6 | 输出 sum。
```

## 更多“不知道次数”的例子

**例 1：猜猜走几步（3n+1 问题）。** 任取一个正整数：是偶数就除以 2，是奇数就乘 3 加 1，不断重复，最后总会变成 1。统计要走几步：

```cpp title="collatz.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    long long n;
    int step=0;
    cin>>n;
    while (n!=1){
        if (n%2==0){
            n/=2;
        }else{
            n=3*n+1;
        }
        step++;
    }
    cout<<step<<endl;
    return 0;
}
```

```input
6
```

```output
8
```

（6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1，一共 8 步。）

**例 2：求最大公约数（辗转相除法）。** 反复用“大数除以小数的余数”替换，直到余数为 0，剩下的那个数就是答案：

```cpp title="gcd.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int a,b;
    cin>>a>>b;
    while (b!=0){
        int t=a%b;
        a=b;
        b=t;
    }
    cout<<a<<endl;
    return 0;
}
```

```input
12 18
```

```output
6
```

**例 3：读到 0 就停。**

```cpp frag
int x,sum=0;
cin>>x;
while (x!=0){
    sum+=x;
    cin>>x;
}
cout<<sum<<endl;
```

```input
3 5 2 0
```

```output
10
```

## do-while：先做一次，再判断

`while` 是先检查再执行，条件一开始就不成立，循环体**一次都不会执行**。`do-while` 反过来：先执行一次循环体，再检查条件。

```cpp frag
int m=10;
while (m<3){
    cout<<"while 执行了"<<endl;
}
do{
    cout<<"do-while 执行了"<<endl;
}while (m<3);
```

```output
do-while 执行了
```

注意 `do-while` 结尾的 **分号** 不能漏。它用得不多，遇到“至少要做一次”的场合（比如先读一个数再判断）才会想到它。

## 用 `while (t--)` 重复 t 次

前面“多组数据”里见过 `while (t--)`。`t--` 的意思是“先用 `t` 的当前值做判断，再把它减 1”，所以当 `t` 变成 0 时循环停下：

```cpp frag
int t=3;
while (t--){
    cout<<t<<" ";
}
cout<<endl;
```

```output
2 1 0
```

## 死循环：永远停不下来

如果条件**永远成立**，循环就停不下来，这叫死循环：

```cpp noverify
int i=1;
while (i<=10){
    cout<<i<<" ";
    // 忘了写 i++，i 永远是 1，条件永远成立
}
```

写 `while` 之前先问自己：**循环体里有没有让条件“总有一天不成立”的语句？** 这个遗漏最常发生在 `while` 里（`for` 的更新部分是写在括号里的，反而不容易忘）。

有时候死循环是故意写的，配合 `break` 在里面某处跳出：

```cpp frag
int i=0;
while (true){
    i++;
    if (i*i>50){
        break;
    }
}
cout<<i<<endl;
```

```output
8
```

`break` 的作用是“立刻跳出当前循环”，下一课专门讲。

> [!竞赛] 循环写错了，程序会一直跑到“超时”
> 评测系统发现程序运行太久，就会判“超时”。如果自己的程序死循环了，在电脑上可以按 `Ctrl+C` 强行结束它。

> [!思考] 输入一个正整数，求它在“除以 2”的过程中，最多能除几次（直到变成 1）
> 比如 8 能除 3 次（8→4→2→1）。

> [!答案] 参考写法
> 用 `while`，每除一次就计一次数：
>
> ```cpp frag
> int n=8,cnt=0;
> while (n>1){
>     n/=2;
>     cnt++;
> }
> cout<<cnt<<endl;
> ```
>
> ```output
> 3
> ```

> [!小结]
> - 知道次数用 `for`，只知道“什么时候停”用 `while`。
> - `while` 先检查再执行，可能一次都不执行；`do-while` 先执行一次再检查。
> - 写 `while` 一定要让条件“总有一天不成立”，否则就是死循环。
