# while 与 do-while

> [!目标]
> 读完这一课，你应该能判断什么时候该用 `while` 而不是 `for`，会用 `while` 处理“事先不知道要循环几次”的问题，认识 `do-while`，并且能避免写出死循环。

## while 循环

`for` 适合已经知道循环次数的场合，比如“从 1 数到 100”。但很多时候我们并不知道要重复几次，只知道“做到什么时候为止”：比如不断把一个数除以 10 直到变成 0，或者不断读取数据直到遇到 0。这类问题用 `while` 来写更自然。

```cpp noverify
while (条件){
    循环体
}
```

`while` 每一轮开始前都先检查条件，成立才执行循环体，执行完再回来检查，直到条件不成立为止。

举个例子：求一个正整数各位数字之和。思路是每次取出个位加进总和，再把个位去掉，直到数字变成 0。一个数有几位，循环就执行几次，这是事先写不出来的，所以适合用 `while`。

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

用 `n=123` 来观察每一轮发生了什么：

```trace
int n=123,sum=0;      //@s1
while (n>0){          //@s2
    sum+=n%10;        //@s3
    n/=10;            //@s4
}
cout<<sum;            //@s5
---
s1 | n=123; sum=0 |  | 准备好两个变量，n 是要处理的数，sum 用来累加。
s2 | n=123; sum=0 |  | 检查条件 n>0，成立，进入循环体。
s3 | n=123; sum=3 |  | n%10 取出个位 3，加到 sum 里。
s4 | n=12; sum=3 |  | n/=10 把个位去掉，n 变成 12。
s2 | n=12; sum=3 |  | 回到条件，12>0 仍然成立。
s3 | n=12; sum=5 |  | 这一次个位是 2，sum 变成 5。
s4 | n=1; sum=5 |  | n 变成 1。
s2 | n=1; sum=5 |  | 1>0 成立。
s3 | n=1; sum=6 |  | 个位是 1，sum 变成 6。
s4 | n=0; sum=6 |  | n 变成 0。
s2 | n=0; sum=6 |  | 检查 0>0，不成立，循环结束。
s5 | n=0; sum=6 | 6 | 输出 sum。
```

## 几个典型的应用

**3n+1 问题。** 任取一个正整数，是偶数就除以 2，是奇数就乘 3 再加 1，不断重复，最终总会得到 1。问需要经过多少步。步数取决于起点，无法预先确定，正好适合 `while`：

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

从 6 开始依次得到 3、10、5、16、8、4、2、1，一共 8 步。

**求最大公约数。** 辗转相除法的做法是：用较大的数除以较小的数，把余数当作新的较小数，重复下去，直到余数为 0，这时剩下的那个数就是最大公约数。同样是“不知道要除几次”：

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

**读到某个特殊值就停止。** 题目常常约定“以 0 结束”，这也是 `while` 的用武之地：

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

## do-while：先执行一次，再判断

`while` 先检查条件，条件一开始就不成立的话，循环体连一次也不会执行。`do-while` 的顺序恰好相反：先执行一次循环体，再检查条件。

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

条件 `m<3` 一开始就是假的，所以 `while` 什么也没有输出，而 `do-while` 无论如何都执行了一次。需要注意的是，`do-while` 末尾的分号不能漏掉。它用得不算多，只有在“无论如何至少要做一次”的场合才会想到它。

## 利用 while(t--) 重复固定的次数

在输入一课里见过 `while(t--)`。它的含义是先用 `t` 当前的值做判断，再把 `t` 减 1，因此当 `t` 减到 0 时循环停止：

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

## 死循环

如果循环的条件永远成立，程序就会一直运行下去，这就是死循环。最常见的原因是循环体里忘了写那条让条件变化的语句：

```cpp noverify
int i=1;
while (i<=10){
    cout<<i<<" ";
    // 忘了写 i++，i 永远是 1，条件永远成立
}
```

所以每写一个 `while`，都应当问自己一句：循环体里有没有什么语句，能让这个条件迟早变为不成立？`for` 把更新部分写在括号里，不容易遗漏，`while` 就需要自己留意了。

另一方面，有时会故意写成死循环，再在内部用 `break` 跳出，这样可以把“什么时候该停”放在循环中间来判断：

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

`break` 的作用是立刻结束当前的循环，下一课会详细讲。

> [!竞赛] 死循环会让程序超时
> 评测系统发现程序运行时间过长，会判定为超时。在自己的电脑上调试时，如果程序卡住了，可以按 `Ctrl+C` 强行终止。

> [!思考] 一个正整数不断除以 2（取整），最多能除几次才变成 1？
> 比如 8 可以除 3 次：8→4→2→1。

> [!答案] 参考写法
> 用 `while` 反复除以 2，每除一次计一次数：
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
>```

> [!小结]
> 次数已知用 `for`，只知道结束条件用 `while`。`while` 先检查后执行，可能一次也不执行；`do-while` 先执行一次再检查。写 `while` 时要确保循环体里有语句能让条件最终不成立，否则就是死循环。
