# 参数怎么传

> [!目标]
> - 分清“传值”和“传引用”，知道为什么 `swap` 要加 `&`
> - 知道数组传进函数后，函数里的修改会影响原数组
> - 会用引用让函数“返回”多个结果
> - 认识 `const 引用`，知道它能省掉复制

## 传值：函数拿到的是复印件

上一课说过，调用函数时，参数是实参的“复印件”。所以在函数里改参数，**不会影响外面**。

想写一个交换两个数的函数：

```cpp title="swap.cpp"
#include <bits/stdc++.h>
using namespace std;
void swapBad(int a,int b){
    int t=a;
    a=b;
    b=t;
}
void swapOk(int &a,int &b){
    int t=a;
    a=b;
    b=t;
}
int main(){
    int x=1,y=2;
    swapBad(x,y);
    cout<<x<<" "<<y<<endl;
    swapOk(x,y);
    cout<<x<<" "<<y<<endl;
    return 0;
}
```

```output
1 2
2 1
```

`swapBad` 交换的是两份复印件，`x` 和 `y` 毫发无损。`swapOk` 的参数前多了一个 `&`，结果就对了。

## 传引用：给原来的变量起个“别名”

参数写成 `int &a`，意思是：**`a` 不是新盒子，而是外面那个变量的别名**。改 `a`，改的就是外面的那个变量本身。点播放，看看变量是怎么被交换的：

```trace
#include <bits/stdc++.h>
using namespace std;
void swapOk(int &a,int &b){     //@s2
    int t=a;                    //@s3
    a=b;                        //@s4
    b=t;                        //@s5
}
int main(){
    int x=1,y=2;                //@s1
    swapOk(x,y);                //@s6
    cout<<x<<" "<<y;            //@s7
    return 0;
}
---
s1 | x=1; y=2 |  | main 里有 x=1，y=2。
s6 | x=1; y=2 |  | 调用 swapOk(x,y)，跳进函数。
s2 | x=1; y=2 |  | 参数 a、b 不是复印件：a 就是 x 的别名，b 就是 y 的别名。改 a 就是改 x。
s3 | x=1; y=2; t=1 |  | t=a：先把 a（也就是 x）的值 1 存进临时变量 t。
s4 | x=2; y=2; t=1 |  | a=b：把 b（y）的值 2 放进 a，也就是 x 变成了 2。
s5 | x=2; y=1; t=1 |  | b=t：把 t 里存着的 1 放进 b，也就是 y 变成了 1。
s6 | x=2; y=1 |  | 函数结束，临时变量 t 消失，回到 main。
s7 | x=2; y=1 | 2 1 | 输出：x 和 y 已经被交换了。
```

> [!提示] 其实 C++ 自带 `swap(x,y)`
> 平时直接用标准库的 `swap`，不用自己写。这里是为了讲清楚“引用”是怎么回事。

## 用引用“返回”多个结果

`return` 只能带回一个值。想一次带回好几个结果，可以多传几个引用参数，让函数把结果“写进去”：

```cpp title="divmod.cpp"
#include <bits/stdc++.h>
using namespace std;
void divmod(int a,int b,int &q,int &r){
    q=a/b;
    r=a%b;
}
int main(){
    int q,r;
    divmod(17,5,q,r);
    cout<<q<<" "<<r<<endl;
    return 0;
}
```

```output
3 2
```

## 数组作为参数

把数组传给函数时，**不会复制整个数组**（那太慢了），函数拿到的是数组本身。所以在函数里修改数组元素，**外面的数组会真的被改**。数组的长度函数里并不知道，需要另外传一个 `n`：

```cpp title="arr.cpp"
#include <bits/stdc++.h>
using namespace std;
void doubleAll(int a[],int n){
    for (int i=0;i<n;i++){
        a[i]*=2;
    }
}
int main(){
    int a[3]={1,2,3};
    doubleAll(a,3);
    for (int i=0;i<3;i++){
        cout<<a[i]<<" ";
    }
    cout<<endl;
    return 0;
}
```

```output
2 4 6
```

## const 引用：只看不改，还不复制

字符串、`vector` 这类“比较大”的东西，如果按值传递，每次调用都要把整份内容复制一遍，既慢又浪费。**参数写成 `const 类型 &名字`**：既不复制，又保证函数里不会不小心改了它。

```cpp title="constref.cpp"
#include <bits/stdc++.h>
using namespace std;
int sumAll(const vector<int> &v){
    int s=0;
    for (int x:v){
        s+=x;
    }
    return s;
}
int main(){
    vector<int> v={1,2,3,4};
    cout<<sumAll(v)<<endl;
    return 0;
}
```

```output
10
```

（`vector` 在后面的 STL 部分会专门讲，这里先把它看成“能装很多数的盒子”。）

## 小结对比

| 写法 | 例子 | 函数里改参数，外面会变吗 | 会复制吗 |
| :-- | :-- | :-: | :-: |
| 传值 | `int a` | 不会 | 会（很小的类型无所谓） |
| 传引用 | `int &a` | **会** | 不会 |
| 常量引用 | `const string &s` | 不能改 | 不会 |
| 数组 | `int a[]` + `n` | **会** | 不会 |

> [!竞赛] 大的参数一律用引用
> 函数的参数是字符串、`vector`、结构体时，写成 `const 类型 &`（只读）或 `类型 &`（要改），可以避免因为反复复制而超时。`int`、`double`、`char` 这种小类型，直接传值就好。

> [!思考] 写一个函数 `inc(x)`，让传进去的变量自增 1

> [!答案] 参考写法
> 参数要写成引用：
>
> ```cpp title="inc.cpp"
> #include <bits/stdc++.h>
> using namespace std;
> void inc(int &x){
>     x++;
> }
> int main(){
>     int a=5;
>     inc(a);
>     cout<<a<<endl;
>     return 0;
> }
> ```
>
> ```output
> 6
> ```

> [!小结]
> - 默认传值：函数里改的是复印件，外面不变。
> - 参数前加 `&`：传引用，函数里改的就是外面的变量，常用来“返回多个结果”、写 `swap`。
> - 数组传进函数，修改会作用到原数组，长度要另外传。
> - 大的参数用 `const 类型 &`，不复制又安全。
