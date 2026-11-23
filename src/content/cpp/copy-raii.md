# 拷贝与资源管理

> [!目标]
> - 理解对象被复制时发生了什么，知道默认的复制为什么会让两个对象共用同一块内存
> - 会写拷贝构造函数和赋值运算符，了解“三法则”
> - 理解 RAII 的思想，会用 `vector` 和智能指针让资源自动释放

## 对象是怎样被复制的

写下 `Student b=a;`，把一个对象按值传给函数，或者从函数里返回一个对象，都会产生一个新的对象，它是原来那个对象的副本。如果自己没有规定怎么复制，编译器会采用最直接的办法：把每个成员逐个复制过去。

这个办法对 `int`、`string`、`vector` 这类成员完全没有问题，因为它们自己知道怎样复制自己。问题出在指针上：复制指针，复制的只是“地址”，并不会复制地址指向的那块内存。

```cpp title="shallow.cpp"
#include <bits/stdc++.h>
using namespace std;
class IntArray{
public:
    int *data;
    int n;
    IntArray(int n): data(new int[n]()), n(n){}
};
int main(){
    IntArray a(3);
    IntArray b=a;
    b.data[0]=7;
    cout<<a.data[0]<<" "<<(a.data==b.data)<<endl;
    return 0;
}
```

```output
7 1
```

`b` 是 `a` 的副本，可是修改 `b.data[0]` 时，`a.data[0]` 也变成了 7，因为两个对象里的 `data` 指向同一块内存。这种只复制地址的复制叫**浅拷贝**。上面的类还没有析构函数，所以只是白白占用了内存。如果给它加上析构函数 `delete[] data;`，问题就严重了：`a` 和 `b` 销毁时，会各自把同一块内存释放一次，同一块内存被释放两次是未定义行为，程序往往直接崩溃。

## 深拷贝：自己规定怎样复制

解决的办法是自己写复制的规则，让每个对象拥有独立的一块内存，这叫**深拷贝**。需要写两个函数：创建新对象时使用的**拷贝构造函数**，和对已经存在的对象赋值时使用的**赋值运算符**。

```cpp title="deep_copy.cpp"
#include <bits/stdc++.h>
using namespace std;
class IntArray{
public:
    int *data;
    int n;
    IntArray(int n): data(new int[n]()), n(n){
        cout<<"构造 "<<n<<endl;
    }
    IntArray(const IntArray &o): data(new int[o.n]), n(o.n){
        copy(o.data,o.data+n,data);
        cout<<"拷贝构造"<<endl;
    }
    IntArray& operator=(const IntArray &o){
        if (this!=&o){
            int *p=new int[o.n];
            copy(o.data,o.data+o.n,p);
            delete[] data;
            data=p;
            n=o.n;
        }
        cout<<"赋值"<<endl;
        return *this;
    }
    ~IntArray(){
        delete[] data;
        cout<<"析构 "<<n<<endl;
    }
};
int main(){
    IntArray a(3);
    a.data[0]=1;
    IntArray b=a;
    b.data[0]=7;
    IntArray c(2);
    c=a;
    cout<<a.data[0]<<" "<<b.data[0]<<" "<<c.data[0]<<" "<<c.n<<endl;
    return 0;
}
```

```output
构造 3
拷贝构造
构造 2
赋值
1 7 1 3
析构 3
析构 3
析构 3
```

`IntArray b=a;` 是用已有的对象创建一个新对象，走的是拷贝构造函数，它先为 `b` 申请了自己的内存，再把内容复制过来，所以之后修改 `b` 不会影响 `a`。`c=a;` 中 `c` 本来就存在，走的是赋值运算符：先把新内容复制到一块新的内存，再释放 `c` 原来的内存，最后让 `data` 指向新的。三个对象各自拥有一块内存，程序结束时按相反的顺序分别释放，没有重复释放。

赋值运算符的开头有一句 `if (this!=&o)`，防止 `a=a` 这样的自我赋值：如果不检查，先释放了自己的内存，再从已经释放的内存里复制，就出错了。

析构函数、拷贝构造函数、赋值运算符这三个函数，只要需要自己写其中一个，通常另外两个也需要自己写，这条经验叫作**三法则**。原因很直接：需要自定义析构函数，说明类里有需要手动释放的资源；既然有这样的资源，默认的逐成员复制几乎一定是错的。

## RAII：让对象负责释放资源

上面的 `IntArray` 体现了一种很重要的思想：在构造函数里获取资源，在析构函数里释放资源，让资源的生命周期与对象的生命周期绑定在一起。对象无论是正常离开作用域，还是中途提前返回，析构函数都一定会执行，资源就不会被遗忘。这种做法的名字很绕口，叫“资源获取即初始化”，简称 **RAII**。

不过更好的方法是根本不自己管理资源。把指针换成标准库的 `vector`，这个类早已写好了正确的拷贝、赋值和析构，自己的类就什么都不用写了。

```cpp title="use_vector.cpp"
#include <bits/stdc++.h>
using namespace std;
class IntArray{
public:
    vector<int> data;
    IntArray(int n): data(n){}
};
int main(){
    IntArray a(3);
    a.data[0]=1;
    IntArray b=a;
    b.data[0]=7;
    cout<<a.data[0]<<" "<<b.data[0]<<endl;
    return 0;
}
```

```output
1 7
```

没有析构函数，没有拷贝构造函数，也没有赋值运算符，复制仍然是深拷贝，释放也不会出错，因为 `vector` 把这些事都负责了。如果类里的成员本身都能正确地复制和销毁，这个类就什么也不用补充，这被称为“零法则”。能用 `vector`、`string` 的地方，就不要用裸指针加 `new`。

## 智能指针

有些场合确实需要动态创建单个对象，C++11 提供了**智能指针**，让指针自己负责释放。`unique_ptr` 表示独占：同一时刻只有一个指针拥有这个对象，它离开作用域时自动 `delete`。`shared_ptr` 表示共享：多个指针可以共同拥有一个对象，内部记录有几个指针在使用，最后一个离开时才释放。

```cpp title="smart_ptr.cpp"
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
    void hello(){
        cout<<"我是 "<<name<<endl;
    }
};
int main(){
    {
        unique_ptr<Noisy> p=make_unique<Noisy>("u");
        p->hello();
    }
    cout<<"离开了内层"<<endl;
    shared_ptr<Noisy> s1=make_shared<Noisy>("s");
    {
        shared_ptr<Noisy> s2=s1;
        cout<<"引用计数 "<<s1.use_count()<<endl;
    }
    cout<<"引用计数 "<<s1.use_count()<<endl;
    return 0;
}
```

```output
u 出生
我是 u
u 销毁
离开了内层
s 出生
引用计数 2
引用计数 1
s 销毁
```

全程没有出现 `delete`。`u` 在内层的右花括号处自动销毁；`s` 被两个指针共同拥有时计数是 2，`s2` 离开后降为 1，直到 `main` 结束、最后一个指针消失，`s` 才被销毁。`make_unique` 和 `make_shared` 是创建这两种智能指针的推荐写法。

> [!注意] `unique_ptr` 不能复制，复制就意味着两个指针都以为自己独占对象。想把所有权交给另一个指针，要用 `std::move`。

> [!竞赛] 比赛里很少手写 `new` 和 `delete`，多数数据放在全局数组或者 `vector` 里，用不着考虑谁来释放。了解这些规则，是为了在读别人的代码，或是写较大的程序时不犯内存方面的错误。

> [!思考] 如果类里同时有一个 `vector<int>` 成员和一个 `int*` 指针成员，需要自己写拷贝构造函数吗？

> [!答案] 参考思路
> 需要。`vector` 会自己正确复制，问题出在那个裸指针：默认的复制只会复制地址。只要类里含有需要自己管理的资源，三法则就适用，而不管它同时还有哪些成员。

> [!小结]
> 默认的复制逐个成员进行，对指针成员只复制地址，会使两个对象共用同一块内存，销毁时重复释放。需要管理资源的类要自己写析构函数、拷贝构造函数和赋值运算符，保证深拷贝。更好的办法是让资源由 `vector`、`string` 和智能指针管理，这就是 RAII：资源的生命周期与对象绑定，由析构函数自动释放。
