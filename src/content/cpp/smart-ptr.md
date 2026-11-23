# 智能指针

> [!目标]
> - 会使用 `unique_ptr` 管理独占的对象，理解所有权的转移，以及 `get`、`reset`、`release` 的区别
> - 会使用 `shared_ptr` 共享对象，并通过 `use_count` 理解引用计数
> - 理解两个 `shared_ptr` 互相指向时为什么会泄漏，会用 `weak_ptr` 来打破这种循环

## 为什么需要智能指针

上一课提到过：用 `new` 创建的对象，必须有人负责 `delete`，漏掉就会内存泄漏，重复 `delete` 又会让程序崩溃。智能指针把这件事交给了对象自己：它是一个行为像指针的类，在析构函数里自动释放所管理的对象。使用它们需要头文件 `<memory>`。

本课用一个会报告自己出生和销毁的类，来观察对象究竟在什么时候被释放。

```cpp top
class Noisy{
public:
    string name;
    Noisy(string n): name(n){
        cout<<name<<" 出生"<<endl;
    }
    ~Noisy(){
        cout<<name<<" 销毁"<<endl;
    }
};
```

后面的程序都包含这个类的完整定义。

## unique_ptr：独占所有权

`unique_ptr` 保证同一时刻只有一个指针拥有这个对象，指针销毁时对象一同销毁。因为独占，它**不能被复制**，只能把所有权转移给另一个指针。

```cpp title="unique.cpp"
#include <bits/stdc++.h>
using namespace std;
class Noisy{
public:
    string name;
    Noisy(string n): name(n){
        cout<<name<<" 出生"<<endl;
    }
    ~Noisy(){
        cout<<name<<" 销毁"<<endl;
    }
};
int main(){
    unique_ptr<Noisy> a=make_unique<Noisy>("a");
    unique_ptr<Noisy> b=move(a);
    cout<<(a==nullptr)<<" "<<b->name<<endl;
    Noisy *raw=b.get();
    cout<<raw->name<<endl;
    b.reset(new Noisy("c"));
    cout<<"reset 之后"<<endl;
    Noisy *p=b.release();
    cout<<"release 之后："<<(b==nullptr)<<endl;
    delete p;
    unique_ptr<int[]> arr(new int[3]{1,2,3});
    cout<<arr[1]<<endl;
    return 0;
}
```

```output
a 出生
1 a
a
c 出生
a 销毁
reset 之后
release 之后：1
c 销毁
2
```

逐行来看：`make_unique<Noisy>("a")` 创建对象并交给 `a` 管理；`move(a)` 把所有权交给 `b`，之后 `a` 变成空指针；`get()` 返回里面保存的普通指针，指针依然归智能指针所有，使用时不要自己去 `delete`；`reset(新指针)` 先接管新对象，再销毁原来管理的对象（从输出可以看到 `c` 先出生，`a` 才销毁）；`release()` 则是放弃所有权，把普通指针还给你，对象并不销毁，从这时起就需要自己 `delete`。最后一行显示了 `unique_ptr<int[]>`，它管理的是数组，释放时使用 `delete[]`，并且支持用下标访问。

也可以指定释放时使用的函数，叫作**自定义删除器**，用来管理不是靠 `delete` 释放的资源，比如用 `fclose` 关闭的文件。

```cpp title="deleter.cpp"
#include <bits/stdc++.h>
using namespace std;
class Noisy{
public:
    string name;
    Noisy(string n): name(n){
        cout<<name<<" 出生"<<endl;
    }
    ~Noisy(){
        cout<<name<<" 销毁"<<endl;
    }
};
int main(){
    auto del=[](Noisy *p){
        cout<<"自定义删除器：";
        delete p;
    };
    unique_ptr<Noisy,decltype(del)> q(new Noisy("d"),del);
    cout<<"离开 main"<<endl;
    return 0;
}
```

```output
d 出生
离开 main
自定义删除器：d 销毁
```

## shared_ptr：共享所有权

有时对象确实需要被多处共同使用，谁都不能独占它。`shared_ptr` 允许多个指针同时指向同一个对象，内部有一个**引用计数**，记录当前有多少个 `shared_ptr` 在使用它。复制一个指针，计数加一；一个指针销毁，计数减一；减到 0，对象才被真正销毁。

```cpp title="shared.cpp"
#include <bits/stdc++.h>
using namespace std;
class Noisy{
public:
    string name;
    Noisy(string n): name(n){
        cout<<name<<" 出生"<<endl;
    }
    ~Noisy(){
        cout<<name<<" 销毁"<<endl;
    }
};
int main(){
    shared_ptr<Noisy> a=make_shared<Noisy>("s");
    cout<<a.use_count()<<endl;
    {
        shared_ptr<Noisy> b=a;
        shared_ptr<Noisy> c=b;
        cout<<a.use_count()<<endl;
    }
    cout<<a.use_count()<<endl;
    a.reset();
    cout<<"reset 之后"<<endl;
    return 0;
}
```

```output
s 出生
1
3
1
s 销毁
reset 之后
```

`b` 和 `c` 在内层花括号结束时销毁，计数从 3 回到 1，对象没有受影响；直到 `a.reset()` 让最后一个指针放弃对象，计数变成 0，`s` 才被销毁。引用计数本身的增减是线程安全的，但对象里面的数据并不会因此变得线程安全，多线程同时修改同一个对象，仍然要自己加锁。

## 循环引用与 weak_ptr

`shared_ptr` 有一个著名的陷阱。如果两个对象各自持有指向对方的 `shared_ptr`，就形成了环：父亲指着孩子，孩子也指着父亲。每个对象的引用计数里，都有来自对方的一份，所以即使外面所有的指针都销毁了，计数也降不到 0，两个对象谁也释放不了，造成泄漏。

```cpp title="cycle.cpp"
#include <bits/stdc++.h>
using namespace std;
class Child;
class Parent{
public:
    string name;
    shared_ptr<Child> child;
    Parent(string n): name(n){
        cout<<"Parent "<<name<<" 出生"<<endl;
    }
    ~Parent(){
        cout<<"Parent "<<name<<" 销毁"<<endl;
    }
};
class Child{
public:
    string name;
    shared_ptr<Parent> parent;
    Child(string n): name(n){
        cout<<"Child "<<name<<" 出生"<<endl;
    }
    ~Child(){
        cout<<"Child "<<name<<" 销毁"<<endl;
    }
};
int main(){
    shared_ptr<Parent> p=make_shared<Parent>("Dad");
    shared_ptr<Child> c=make_shared<Child>("Kid");
    p->child=c;
    c->parent=p;
    cout<<p.use_count()<<" "<<c.use_count()<<endl;
    cout<<"离开 main"<<endl;
    return 0;
}
```

```output
Parent Dad 出生
Child Kid 出生
2 2
离开 main
```

程序结束时没有任何“销毁”的输出：两个对象的计数都是 2，`main` 里的局部指针销毁后各自还剩 1，永远降不到 0。

解决办法是用 `weak_ptr` 表示“弱引用”：它指向对象，但**不增加引用计数**，不影响对象的生命周期。因为对象可能已经被销毁了，不能直接通过 `weak_ptr` 访问，要先调用 `lock()`：如果对象还在，就得到一个有效的 `shared_ptr`，否则得到空指针。`expired()` 可以先判断对象是否已经销毁。只需要把孩子指向父亲的那一个指针换成 `weak_ptr`，环就断开了。

```cpp title="weak.cpp"
#include <bits/stdc++.h>
using namespace std;
class Child;
class Parent{
public:
    string name;
    shared_ptr<Child> child;
    Parent(string n): name(n){
        cout<<"Parent "<<name<<" 出生"<<endl;
    }
    ~Parent(){
        cout<<"Parent "<<name<<" 销毁"<<endl;
    }
};
class Child{
public:
    string name;
    weak_ptr<Parent> parent;
    Child(string n): name(n){
        cout<<"Child "<<name<<" 出生"<<endl;
    }
    ~Child(){
        cout<<"Child "<<name<<" 销毁"<<endl;
    }
};
int main(){
    shared_ptr<Parent> p=make_shared<Parent>("Dad");
    shared_ptr<Child> c=make_shared<Child>("Kid");
    p->child=c;
    c->parent=p;
    cout<<p.use_count()<<" "<<c.use_count()<<endl;
    if (auto locked=c->parent.lock()){
        cout<<"孩子找到了父亲："<<locked->name<<endl;
    }
    cout<<"离开 main"<<endl;
    return 0;
}
```

```output
Parent Dad 出生
Child Kid 出生
1 2
孩子找到了父亲：Dad
离开 main
Parent Dad 销毁
Child Kid 销毁
```

这一次父亲的计数只有 1（孩子指向它的是弱引用，不算数），所以 `main` 结束、`p` 销毁时，父亲的计数降到 0，被销毁；父亲销毁时，它持有的 `child` 也随之释放，孩子的计数再减一，同样降到 0。两个对象都得到了正确的释放。

## 怎样选择

默认应当使用 `unique_ptr`，它的开销几乎和普通指针一样，并且把“谁拥有这个对象”表达得非常清楚。确实需要多处共享所有权时才使用 `shared_ptr`，并留意是否可能形成环，成环的那一条引用用 `weak_ptr`。如果一个对象本来就可以直接作为局部变量、数据成员或者放进 `vector`，就不必使用指针，这是最简单、最不容易出错的方式。

> [!竞赛] 算法竞赛里很少需要智能指针，数据结构大多用数组和下标就足够了。需要动态建树（如字典树、二叉搜索树）时，有人习惯用 `new`，比赛程序运行时间短，一般不在意释放。理解智能指针主要是为了读懂工程项目里的代码。

> [!思考] 为什么推荐用 `make_unique` 和 `make_shared` 创建智能指针，而不是 `unique_ptr<T>(new T)`？

> [!答案] 参考思路
> `make_` 系列只需写一次类型名，不会出现裸露的 `new`，也避免了某些情况下，对象已经创建、智能指针还没来得及接管时发生异常而造成泄漏的风险。对于 `shared_ptr`，`make_shared` 还能把对象和引用计数分配在同一块内存里，效率更高。

> [!小结]
> `unique_ptr` 独占对象，不能复制，只能用 `move` 转移，`get` 取普通指针，`reset` 换成新对象，`release` 放弃所有权。`shared_ptr` 用引用计数共享对象，计数归零时才销毁。互相指向的 `shared_ptr` 会形成环而泄漏，把其中一条改为不计数的 `weak_ptr`，使用时通过 `lock()` 获得临时的强引用。
