# 函数的定义与调用

> [!目标]
> - 理解函数：把一段功能打包起来，起个名字，反复使用
> - 会写有返回值的函数和没有返回值的函数（`void`）
> - 知道函数要先声明（或先定义）再使用
> - 分清局部变量和全局变量

## 函数是什么

到现在为止，所有代码都挤在 `main` 里。写的程序一长，就会遇到：同样的功能要写好几遍、`main` 又长又乱。**函数**就是把一段代码打包，起个名字，需要时“呼叫”它。

其实你早就用过函数了：`sqrt(16)`、`max(3,8)`、`s.size()`，都是别人写好的函数。现在学自己写。

```cpp title="add.cpp"
#include <bits/stdc++.h>
using namespace std;
int add(int a,int b){
    return a+b;
}
int main(){
    int x=3,y=4;
    cout<<add(x,y)<<endl;
    cout<<add(10,20)<<endl;
    return 0;
}
```

```output
7
30
```

函数的写法：

```cpp noverify
返回值类型 函数名(参数列表){
    函数体
    return 结果;
}
```

对照 `int add(int a,int b)`：

- **`int`**：这个函数算出来的结果是 `int`。
- **`add`**：函数名，起得有意义一点。
- **`(int a,int b)`**：参数，就是“调用时需要你交给它的东西”，每个都要写清类型。
- **`return a+b;`**：把结果交还给调用的人，同时**立刻结束**这个函数。

## 一次调用，发生了什么

点播放，看看 `add(x,y)` 这一行是怎么“跳进去再跳回来”的：

```trace
#include <bits/stdc++.h>
using namespace std;
int add(int a,int b){        //@s2
    return a+b;              //@s3
}
int main(){
    int x=3,y=4;             //@s1
    int s=add(x,y);          //@s4
    cout<<s;                 //@s5
    return 0;
}
---
s1 | x=3; y=4 |  | 程序从 main 开始。先有两个变量 x 和 y。
s4 | x=3; y=4 |  | 执行到 add(x,y)：main 先暂停，程序跳去执行函数 add。
s2 | x=3; y=4; a=3; b=4 |  | 进入函数。参数 a、b 是 x、y 的“复印件”：3 和 4 被复制了进来。
s3 | x=3; y=4; a=3; b=4 |  | return a+b：算出 7，带着 7 回到刚才暂停的地方。
s4 | x=3; y=4; s=7 |  | add(x,y) 这个式子的值就是 7，放进 s。函数里的 a、b 随着函数结束消失了。
s5 | x=3; y=4; s=7 | 7 | 继续执行 main 的下一句，输出 7。
```

## 没有返回值：void

有的函数只是“做一件事”（比如输出一行线），不需要交还结果，返回值类型写 `void`，也不用 `return 结果`：

```cpp title="line.cpp"
#include <bits/stdc++.h>
using namespace std;
void line(int n){
    for (int i=0;i<n;i++){
        cout<<"-";
    }
    cout<<endl;
}
int main(){
    line(5);
    cout<<"hi"<<endl;
    line(3);
    return 0;
}
```

```output
-----
hi
---
```

## 先声明，再使用

C++ 是**从上往下读**代码的，调用一个函数时，编译器必须已经“认识”它。有两种办法：

1. 把函数写在 `main` **上面**（前面的例子都是这样）。
2. 函数写在 `main` 下面，但在上面先写一行**声明**（只写头，不写体，末尾有分号）：

```cpp title="proto.cpp"
#include <bits/stdc++.h>
using namespace std;
int add(int a,int b);
int main(){
    cout<<add(1,2)<<endl;
    return 0;
}
int add(int a,int b){
    return a+b;
}
```

```output
3
```

## 实战：判断素数的函数

之前判断素数的代码写在 `main` 里，每次判断都要重写一遍。打包成函数，用起来就清爽多了（函数名习惯用“动词+名词”，如 `isPrime`）：

```cpp title="isprime.cpp"
#include <bits/stdc++.h>
using namespace std;
bool isPrime(int n){
    if (n<2){
        return false;
    }
    for (int i=2;i*i<=n;i++){
        if (n%i==0){
            return false;
        }
    }
    return true;
}
int main(){
    for (int i=1;i<=20;i++){
        if (isPrime(i)){
            cout<<i<<" ";
        }
    }
    cout<<endl;
    return 0;
}
```

```output
2 3 5 7 11 13 17 19
```

`return` 会让函数**当场结束**，所以函数里“发现不是素数就 `return false`”，后面的代码都不会再执行。

## 局部变量与全局变量

- **局部变量**：声明在函数内部，只在这个函数里能用，函数结束就消失。
- **全局变量**：声明在所有函数外面，所有函数都能用。

如果局部变量和全局变量**重名**，在函数里“局部的优先”，全局的被遮住了：

```cpp title="scope.cpp"
#include <bits/stdc++.h>
using namespace std;
int x=10;
void f(){
    int x=1;
    x++;
    cout<<x<<endl;
}
int main(){
    f();
    cout<<x<<endl;
    return 0;
}
```

```output
2
10
```

`f` 里的 `x` 是它自己的局部变量，改它不影响全局的 `x`。

> [!提示] 变量用多大的范围，就声明在多大的范围
> 只在一个函数里用的变量就写在函数里，别随手都放全局，不然多个函数改来改去，很难查错。数组这种“又大又要共用”的才放全局。

> [!思考] 写一个函数 `sq(x)`，返回 x 的平方，在 main 里输出 `sq(5)`

> [!答案] 参考写法
> ```cpp title="sq.cpp"
> #include <bits/stdc++.h>
> using namespace std;
> int sq(int x){
>     return x*x;
> }
> int main(){
>     cout<<sq(5)<<endl;
>     return 0;
> }
> ```
>
> ```output
> 25
> ```

> [!小结]
> - 函数 = 返回值类型 + 名字 + 参数 + 函数体；`return` 交回结果并结束函数。
> - 不需要结果就用 `void`；函数要先声明（或先定义）再调用。
> - 调用时，参数是“复印件”；局部变量只在函数内有效，重名时局部优先。
