# 模板入门

> [!目标]
> - 理解模板解决的问题：同一份逻辑适用于多种类型，不必为每种类型重写
> - 会写函数模板和类模板，并用它们创建不同类型的版本
> - 认识到 `vector<int>`、`pair<int,int>`、`map<string,int>` 都是类模板

## 一份代码，多种类型

假设需要一个求两个数中较大者的函数。写成 `int` 版本，用到 `double` 时就得再写一个，用到 `string` 时又要写一个，三个函数的逻辑完全一样，只是类型不同。**模板**让我们把类型也当作参数：只写一份代码，类型留到使用时再确定。

```cpp title="func_template.cpp"
#include <bits/stdc++.h>
using namespace std;
template<typename T>
T maxOf(T a,T b){
    return a>b?a:b;
}
template<typename T>
void show(const vector<T> &v){
    for (const T &x:v){
        cout<<x<<" ";
    }
    cout<<endl;
}
int main(){
    cout<<maxOf(3,5)<<" "<<maxOf(2.5,1.5)<<" "<<maxOf(string("abc"),string("abd"))<<endl;
    show(vector<int>{1,2,3});
    show(vector<string>{"a","b"});
    return 0;
}
```

```output
5 2.5 abd
1 2 3
a b
```

`template<typename T>` 声明接下来的函数里有一个类型参数 `T`，函数里的 `T` 在使用时会被替换为具体的类型。调用 `maxOf(3,5)` 时，编译器看到两个参数是 `int`，就推出 `T` 是 `int`，并据此生成一份 `int` 版本的函数；`maxOf(2.5,1.5)` 则会另外生成 `double` 版本。这个过程叫模板的**实例化**，由编译器自动完成，运行时没有任何额外的开销。

`typename` 也可以写成 `class`，在这里两者含义相同，竞赛里 `template<class T>` 更常见。

> [!注意] 同一个类型参数在一次调用里只能对应一种类型。`maxOf(3,2.5)` 的第一个参数是 `int`，第二个是 `double`，编译器无法决定 `T` 到底是什么，会直接报错。可以显式写出类型 `maxOf<double>(3,2.5)`，或者使用两个类型参数。

## 类模板

类同样可以带类型参数。下面用 `vector` 实现一个简单的栈，它可以保存任意类型的元素。

```cpp title="stack_template.cpp"
#include <bits/stdc++.h>
using namespace std;
template<typename T>
class Stack{
    vector<T> a;
public:
    void push(const T &x){
        a.push_back(x);
    }
    void pop(){
        a.pop_back();
    }
    T& top(){
        return a.back();
    }
    bool empty() const{
        return a.empty();
    }
    int size() const{
        return a.size();
    }
};
int main(){
    Stack<int> s;
    s.push(1);
    s.push(2);
    s.push(3);
    cout<<s.top()<<" "<<s.size()<<endl;
    s.pop();
    cout<<s.top()<<endl;
    Stack<string> t;
    t.push("hello");
    t.push("world");
    cout<<t.top()<<endl;
    return 0;
}
```

```output
3 3
2
world
```

使用类模板时，必须在类名后面的尖括号里明确写出类型：`Stack<int>` 是一个保存整数的栈，`Stack<string>` 是保存字符串的栈，两者是不同的类型，互不干扰。

到这里，很多熟悉的写法终于有了解释：`vector<int>`、`stack<int>`、`queue<int>`、`map<string,int>`、`pair<int,int>`，它们全部都是类模板，尖括号里写的就是类型参数。一直以来我们都是在使用别人写好的类模板，现在也能自己写了。

## 多个类型参数

模板可以有不止一个类型参数，用逗号分隔，`pair<A,B>` 和 `map<K,V>` 就是这样的。

```cpp title="two_params.cpp"
#include <bits/stdc++.h>
using namespace std;
template<typename A,typename B>
struct MyPair{
    A first;
    B second;
};
int main(){
    MyPair<string,int> p{"Tom",90};
    cout<<p.first<<" "<<p.second<<endl;
    return 0;
}
```

```output
Tom 90
```

模板的参数除了类型，也可以是一个常数，比如标准库里 `array<int,5>` 表示长度为 5 的整数数组，其中的 5 就不是类型，而是一个编译时确定的数。

## 模板的报错与限制

模板只有在被使用时才会真正编译。如果对不支持的类型使用，比如对一个没有重载 `>` 的结构体调用 `maxOf`，错误会出现在模板内部，而且报错信息往往长得惊人。遇到这种情况，不必逐行阅读，先找到第一行带有 `error` 的内容，看它指出了哪个类型缺少了哪个运算，通常就能找到原因。

另外，模板的完整定义必须让使用它的代码能看到，所以模板一般写在头文件里，而不能像普通函数那样只在头文件里写声明，把实现放在另一个文件里。比赛里所有代码都在一个文件中，没有这个问题。

> [!竞赛] 模板在比赛里的主要用途是写通用的小工具，比如上面这样的调试输出函数、可以读入任意整数类型的读入函数，或者一份同时适用于 `int` 和 `long long` 的数据结构。把常用的数据结构写成类模板，既能放进自己的代码模板库，也不必为每种数据类型复制一遍。

> [!思考] `maxOf(3,2.5)` 为什么会编译失败？有哪两种办法可以解决？

> [!答案] 参考思路
> 两个参数的类型不同，编译器推导出的 `T` 有 `int` 和 `double` 两种答案，互相矛盾。一种办法是显式指定类型，写 `maxOf<double>(3,2.5)`，让 3 转换为 `double`；另一种办法是把函数改成有两个类型参数的模板，让两个参数各自带有自己的类型。

> [!小结]
> 模板把类型也变成参数，让同一份代码适用于多种类型。函数模板由编译器根据实参推导类型并实例化，类模板在使用时要在尖括号里写明类型。标准库里的 `vector`、`pair`、`map` 等都是类模板。模板错误提示很长，先读第一行 `error`。
