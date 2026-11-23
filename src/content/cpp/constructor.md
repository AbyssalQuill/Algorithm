# 构造函数与析构函数

> [!目标]
> - 理解构造函数要解决的问题，会写带参数、带默认值的构造函数，会用初始化列表
> - 知道析构函数在什么时候自动执行，以及多个对象的构造与析构顺序
> - 会把带构造函数的对象放进 `vector`

## 让对象一创建就有合理的状态

前面创建长方形对象之后，总是接着写 `r.w=3; r.h=4;` 才让它有了意义。这样做有一个隐患：如果忘了赋值，`w` 和 `h` 里是随机的旧数据，后面的计算就全错了。更稳妥的办法是让对象在创建的那一刻就拥有完整、合理的状态，这件事由**构造函数**负责。

构造函数是一种特殊的成员函数：名字与类名相同，没有返回类型，在创建对象时自动执行。

```cpp title="ctor.cpp"
#include <bits/stdc++.h>
using namespace std;
class Rectangle{
public:
    int w,h;
    Rectangle(int a,int b){
        w=a;
        h=b;
        cout<<"创建了 "<<w<<"x"<<h<<" 的长方形"<<endl;
    }
    int area(){
        return w*h;
    }
};
int main(){
    Rectangle r(3,4);
    cout<<r.area()<<endl;
    return 0;
}
```

```output
创建了 3x4 的长方形
12
```

`Rectangle r(3,4);` 在创建 `r` 的同时，把 3 和 4 传给了构造函数。从这时起，`r` 就不可能处于“没有赋值”的状态了。

## 默认值与重载

构造函数的参数可以带默认值，这样同一个构造函数就能适应多种写法。

```cpp title="default_args.cpp"
#include <bits/stdc++.h>
using namespace std;
class Rectangle{
public:
    int w,h;
    Rectangle(int a=1,int b=1){
        w=a;
        h=b;
    }
    int area(){
        return w*h;
    }
};
int main(){
    Rectangle r1;
    Rectangle r2(5);
    Rectangle r3(2,3);
    cout<<r1.area()<<" "<<r2.area()<<" "<<r3.area()<<endl;
    return 0;
}
```

```output
1 5 6
```

不给参数时，宽和高都取默认的 1；只给一个参数时，它赋给宽，高仍用默认值。构造函数也可以像普通函数一样重载，写出参数个数或类型不同的多个版本，编译器会按调用时给出的参数挑选合适的那个。

这里有一条容易被忽略的规则：如果一个类里一个构造函数都没写，编译器会悄悄提供一个什么也不做的无参构造函数；一旦写了任何一个构造函数，编译器就不再提供这个“免费”的版本。所以只写了 `Rectangle(int a,int b)` 的类，再去写 `Rectangle r;` 就会编译失败。上面的例子能写 `Rectangle r1;`，正是因为参数都带了默认值，不给参数也可以调用。

## 初始化列表

构造函数还有一种更常见的写法：在参数列表后面加冒号，用“成员(值)”的形式给成员变量赋初值，这叫**初始化列表**。

```cpp title="init_list.cpp"
#include <bits/stdc++.h>
using namespace std;
class Student{
public:
    const int id;
    string name;
    Student(int i,string n): id(i), name(n){}
};
int main(){
    Student s(7,"Tom");
    cout<<s.id<<" "<<s.name<<endl;
    return 0;
}
```

```output
7 Tom
```

初始化列表和在函数体里赋值看起来效果相同，但并不完全一样。函数体里的赋值，是先把成员按默认方式造好，再覆盖成新值；初始化列表则是一步到位，直接用给定的值把成员造出来。对于 `int` 来说差别不大，对于 `string` 之类较大的成员就更省时间。更重要的是，`const` 成员和引用成员在创建之后就不能再被赋值，只能通过初始化列表来设置，上面的 `id` 就是例子。

> [!注意] 成员的初始化顺序按它们在类里声明的先后，与初始化列表里的书写顺序无关。如果一个成员的初值要依赖另一个成员，务必让被依赖的成员声明在前面。

## 析构函数

对象不再需要的时候，往往要做一点收尾的工作，比如关闭文件、释放内存。C++ 为此提供了**析构函数**：名字是在类名前加一个 `~`，没有参数也没有返回值，在对象的生命周期结束时自动执行。

局部对象的生命周期在它所在的花括号结束时结束。下面用一个会“报告”自己出生和销毁的类，观察构造与析构发生的时间。

```trace
#include <bits/stdc++.h>
using namespace std;
class Noisy{
public:
    string name;
    Noisy(string n): name(n){
        cout<<name<<" 出生"<<endl;                //@s1,s2,s3
    }
    ~Noisy(){
        cout<<name<<" 销毁"<<endl;                //@s5,s6,s8
    }
};
int main(){
    Noisy a("a");                                 //@s1
    {
        Noisy b("b");                             //@s2
        Noisy c("c");                             //@s3
        cout<<"内层结束"<<endl;                   //@s4
    }                                             //@s5,s6
    cout<<"main 结束"<<endl;                      //@s7
    return 0;                                     //@s8
}
---
s1 | a=存活 | a 出生\n | 创建对象 a，构造函数自动执行，输出 a 出生。
s2 | a=存活; b=存活 | b 出生\n | 进入内层花括号，创建 b。
s3 | a=存活; b=存活; c=存活 | c 出生\n | 接着创建 c。
s4 | a=存活; b=存活; c=存活 |  内层结束\n | 内层的最后一条语句。
s5 | a=存活; b=存活 | c 销毁\n | 内层的右花括号到了，在这里创建的对象要离开作用域。最后创建的 c 最先被销毁。
s6 | a=存活 | b 销毁\n | 然后才轮到 b。析构的顺序与构造的顺序正好相反。
s7 | a=存活 | main 结束\n | 外层的 a 还活着，继续往下执行。
s8 | 无 | a 销毁\n | main 结束时，a 也被销毁。
```

析构的顺序与构造的顺序相反：后创建的先销毁。这和栈“后进先出”的规律是一致的，原因也很容易理解：后创建的对象可能要用到先创建的对象，所以必须先把它收拾干净，才能收拾它所依赖的那一个。

## 对象和 vector

把带构造函数的对象放进 `vector` 时，有两种写法。`push_back` 先造出一个临时对象再放进去，`emplace_back` 把构造参数直接交给容器，在容器内部构造。

```cpp title="vector_objects.cpp"
#include <bits/stdc++.h>
using namespace std;
class Student{
public:
    string name;
    int score;
    Student(string n,int s): name(n), score(s){}
};
int main(){
    vector<Student> v;
    v.push_back(Student("Tom",90));
    v.emplace_back("Amy",95);
    for (auto &s:v){
        cout<<s.name<<" "<<s.score<<endl;
    }
    return 0;
}
```

```output
Tom 90
Amy 95
```

> [!注意] 用无参构造函数创建对象时，不能写成 `Student s();`。这一行会被编译器当成“声明了一个名为 s、返回 Student 的函数”，而不是创建对象。要么直接写 `Student s;`，要么用花括号 `Student s{};`。

> [!竞赛] 比赛里构造函数的主要作用是方便地创建结构体，比如 `q.push(Node(x,y))`，或者让结构体的成员带上默认值。析构函数很少需要，因为竞赛代码很少手动管理资源。

> [!思考] 为什么要让析构的顺序与构造的顺序相反？

> [!答案] 参考思路
> 后创建的对象可能依赖先创建的对象，比如后者持有前者的引用。如果先销毁被依赖的对象，后者在收尾时就会访问到已经不存在的东西。反过来销毁，每个对象收尾时它依赖的对象还完整地存在。

> [!小结]
> 构造函数在对象创建时自动执行，用来保证对象从一开始就有合理的状态；初始化列表一步到位地给成员赋初值，并且是 `const` 成员和引用成员唯一的初始化方式。析构函数在对象生命周期结束时自动执行，局部对象按创建的相反顺序销毁。
