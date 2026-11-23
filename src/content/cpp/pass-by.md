# 函数的参数传递

> [!目标]
> 读完这一课，你应该能分清传值和传引用，知道为什么交换两个数的函数必须使用引用，明白数组传进函数之后函数里的修改会作用到原数组，并且会用引用让函数“返回”多个结果。

## 传值：函数拿到的只是副本

上一课说过，调用函数时参数得到的是实参的副本。这意味着在函数里怎样修改参数，外面的变量都不会受到影响。

不妨写一个交换两个数的函数来验证这一点。下面的程序里有两个版本，区别仅仅是参数前面有没有一个 `&`：

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

`swapBad` 交换的是两个副本，函数一结束副本就消失了，`x` 和 `y` 毫发无损。`swapOk` 的参数前加了 `&`，结果就正确了，原因在下面说明。

## 传引用：给原来的变量起一个别名

把参数写成 `int &a`，意思是 `a` **不是一个新的变量，而是外面那个变量的别名**。别名和原来的变量指的是同一块内存，通过别名修改，就是在修改原来的变量。下面用演示来看看交换是怎样发生的：

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
s1 | x=1; y=2 |  | main 里有两个变量，x 是 1，y 是 2。
s6 | x=1; y=2 |  | 调用 swapOk(x,y)，程序转入函数内部。
s2 | x=1; y=2 |  | 参数 a 和 b 不是副本，而是 x 和 y 的别名：修改 a 就等于修改 x。
s3 | x=1; y=2; t=1 |  | t=a 先把 a，也就是 x 的值 1 暂存到临时变量 t 里。
s4 | x=2; y=2; t=1 |  | a=b 把 y 的值 2 放进 a，于是 x 也变成了 2。
s5 | x=2; y=1; t=1 |  | b=t 把暂存的 1 放进 b，于是 y 变成了 1。
s6 | x=2; y=1 |  | 函数结束，临时变量 t 消失，程序回到 main。
s7 | x=2; y=1 | 2 1 | 输出结果，x 和 y 已经完成了交换。
```

> [!提示] 标准库里本来就有 `swap`
> 实际写程序时，直接调用 `swap(x,y)` 就行，用不着自己再写。这里手写一遍，是为了把引用的作用讲清楚。

## 用引用返回多个结果

`return` 一次只能交回一个值。如果函数需要同时给出好几个结果，可以多放几个引用参数，让函数把结果“写进”这些变量里：

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

## 把数组传给函数

数组作为参数时，情况有些特别：为了避免复制一大批数据，传递的并不是整个数组的副本，函数拿到的就是数组本身。因此在函数里修改数组元素，外面的数组会被真正改掉。另外，函数里无法得知数组有多长，所以长度 `n` 需要作为一个单独的参数传进去。

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

## 常量引用：只读，也不复制

字符串、`vector` 这样的大对象，如果按值传递，每次调用都要把里面的内容完整复制一遍，既浪费时间又浪费空间。更好的做法是把参数写成 `const 类型 &名字`：传的是引用，所以不会复制；前面加了 `const`，函数里就不能修改它，也避免了误操作。

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

`vector` 会在后面的标准库部分专门讲，这里先把它看成一个能装很多数的容器。

## 几种传参方式的对比

| 写法 | 例子 | 函数里修改参数，外面是否改变 | 是否复制数据 |
| :-- | :-- | :-: | :-: |
| 传值 | `int a` | 不改变 | 复制（小类型无所谓） |
| 传引用 | `int &a` | **会改变** | 不复制 |
| 常量引用 | `const string &s` | 不允许修改 | 不复制 |
| 数组 | `int a[]` 加上长度 `n` | **会改变** | 不复制 |

> [!竞赛] 体积较大的参数，一律传引用
> 当参数是字符串、`vector` 或结构体时，只读用 `const 类型 &`，需要修改用 `类型 &`，可以避免因为反复复制而超时。像 `int`、`double`、`char` 这样的小类型，直接传值就可以了。

> [!思考] 写一个函数 `inc(x)`，让传进去的变量自增 1

> [!答案] 参考写法
> 参数必须写成引用，修改才会作用到外面的变量：
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
>```

> [!小结]
> 默认的传值方式给函数的是副本，函数里的修改不会影响外面。在参数前加 `&` 变成引用，就是给原变量起别名，修改会生效，常用来写 `swap` 以及让函数返回多个结果。数组传参时拿到的就是数组本身，长度要另外传；体积大的参数用 `const 类型 &`，既不复制，也不会被误改。
