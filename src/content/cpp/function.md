# 函数的定义与调用

> [!目标]
> 读完这一课，你应该理解函数是把一段功能打包起来重复使用的方式，会写有返回值和没有返回值的函数，知道函数要先声明或定义再使用，并且能分清局部变量与全局变量。

## 为什么需要函数

到目前为止，所有的代码都挤在 `main` 里。程序一长，问题就来了：同样的功能得重复写好几遍，`main` 又长又乱，改一处还得处处改。**函数**的作用，是把一段完成特定功能的代码打包起来，起一个名字，需要时通过名字“调用”它。

其实你早就在用函数了：`sqrt(16)`、`max(3,8)`、`s.size()` 都是别人写好的函数。现在要学的，是怎样写自己的函数。

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

函数的一般形式是：

```cpp noverify
返回值类型 函数名(参数列表){
    函数体
    return 结果;
}
```

对照 `int add(int a,int b)` 来看：开头的 `int` 表示这个函数算出来的结果是一个整数；`add` 是函数的名字，应当起得能说明用途；括号里的 `int a,int b` 是参数，也就是调用时需要交给函数的数据，每个参数都要写明类型；函数体里的 `return a+b;` 把结果交还给调用它的地方，同时立刻结束这个函数。

## 调用函数时发生了什么

调用函数的那一刻，程序会暂停当前的工作，跳进函数里执行，执行完以后再回到刚才暂停的地方继续。下面的演示展示了 `add(x,y)` 这一行是怎样“跳进去、再跳回来”的：

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
s1 | x=3; y=4 |  | 程序从 main 开始，先创建两个变量 x 和 y。
s4 | x=3; y=4 |  | 执行到 add(x,y) 时，main 暂停，程序转去执行函数 add。
s2 | x=3; y=4; a=3; b=4 |  | 进入函数后，参数 a 和 b 是 x 和 y 的“副本”，3 和 4 被复制了进来。
s3 | x=3; y=4; a=3; b=4 |  | 执行 return a+b，算出 7，并带着这个结果回到刚才暂停的位置。
s4 | x=3; y=4; s=7 |  | add(x,y) 这个式子现在的值就是 7，被存进变量 s；函数里的 a 和 b 随着函数结束而消失。
s5 | x=3; y=4; s=7 | 7 | 继续执行 main 的下一条语句，输出 7。
```

## 没有返回值的函数

有些函数只是要“做一件事”，比如输出一行分隔线，并不需要把结果交给谁。这时返回值类型写 `void`，函数里也不需要 `return 结果`。

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

## 函数需要先声明再使用

C++ 编译器是从上到下读代码的，当它读到一次函数调用时，必须已经“认识”这个函数。因此有两种常见的做法：一是把函数写在 `main` 的上面，前面的例子都是如此；二是把函数写在 `main` 下面，但在上面先写一行**函数声明**，也就是只写函数头部、不写函数体，并以分号结尾。

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

## 一个实用的例子：判断素数

之前判断素数的代码写在 `main` 里，每判断一个数就要把它重写一遍。把这段逻辑封装成函数，调用时只需一行。函数名习惯用“动词加名词”的形式，比如 `isPrime`，一看就知道它的用途。

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

留意函数里的 `return`：它会让函数当场结束，所以一旦发现 `n` 能被某个数整除，直接 `return false`，后面的代码都不用再执行了。

## 局部变量与全局变量

在函数内部声明的变量是**局部变量**，只能在这个函数里使用，函数一结束它就消失了。在所有函数外面声明的是**全局变量**，整个程序里的函数都可以使用它。

如果局部变量和全局变量重名，在函数内部起作用的是局部的那个，全局的被暂时遮住了：

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

`f` 里的 `x` 是它自己的局部变量，对它做的修改不会影响全局的 `x`。

> [!提示] 变量的作用范围越小越好
> 只在一个函数里用的变量，就声明在那个函数里面，不要随手都放到全局。变量放得越“公开”，就越容易被多个函数改来改去，出了问题也越难查。数组这类体积大又需要共用的数据，才有必要放在全局。

> [!思考] 写一个函数 `sq(x)`，返回 `x` 的平方，并在 `main` 中输出 `sq(5)`

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
> 函数由返回值类型、名字、参数和函数体组成，用 `return` 交回结果并结束函数；不需要结果时返回类型写 `void`。函数必须先声明或定义，才能被调用。调用时参数是实参的副本，局部变量只在函数内部有效，与全局变量重名时局部变量优先。
