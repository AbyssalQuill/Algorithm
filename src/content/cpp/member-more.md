# this、const 与 static

> [!目标]
> - 理解 `this` 指针，会用它区分同名的参数和成员，会写支持连续调用的成员函数
> - 会给成员函数加 `const`，知道它在传 `const` 引用时为什么不可缺少
> - 理解 `static` 成员属于整个类而不属于某个对象，会用它统计对象的个数，并会通过指针访问对象

## this 指针

成员函数里直接写 `n` 就能访问调用者的 `n`，那么函数是怎么知道调用者是谁的呢？答案是每个成员函数都带有一个看不见的参数 `this`，它是指向当前对象的指针。`a.add(5)` 被调用时，`this` 就指向 `a`。通常不需要写出它，但有两种情形需要。

第一种是参数名与成员名相同。在函数里，参数会把同名的成员“遮住”，要访问成员，就得写 `this->`。

```cpp title="this_name.cpp"
#include <bits/stdc++.h>
using namespace std;
class Point{
public:
    int x,y;
    Point(int x,int y){
        this->x=x;
        this->y=y;
    }
};
int main(){
    Point p(3,4);
    cout<<p.x<<" "<<p.y<<endl;
    return 0;
}
```

```output
3 4
```

`this->x=x` 的左边是成员，右边是参数。如果写成 `x=x`，只是把参数赋给了它自己，成员什么也没变。使用上一课的初始化列表 `Point(int x,int y): x(x), y(y){}` 也可以避免这个问题，括号外是成员，括号里是参数，不会混淆。

第二种是让函数返回对象自身，从而可以连续调用。`*this` 就是当前对象，返回它的**引用**，下一次调用作用的仍然是同一个对象。

```cpp title="chain.cpp"
#include <bits/stdc++.h>
using namespace std;
class Counter{
public:
    int n=0;
    Counter& add(int k){
        n+=k;
        return *this;
    }
    Counter& mul(int k){
        n*=k;
        return *this;
    }
};
int main(){
    Counter c;
    c.add(3).mul(4).add(1);
    cout<<c.n<<endl;
    return 0;
}
```

```output
13
```

`c.add(3).mul(4).add(1)` 的执行顺序是 `0+3=3`，`3*4=12`，`12+1=13`。熟悉的 `cout<<a<<b<<endl` 也是同样的原理：每个 `<<` 都返回输出流本身的引用，所以可以一个接一个地写下去。

> [!注意] 返回类型一定要写成 `Counter&`。如果写成 `Counter`，返回的是对象的一份副本，之后的 `.mul(4)` 修改的是副本，原来的 `c` 在第一次调用之后就不会再变化了。

## const 成员函数

在成员函数的参数列表之后加上 `const`，是向编译器保证：这个函数不会修改对象的任何成员。

```cpp title="const_member.cpp"
#include <bits/stdc++.h>
using namespace std;
class Rectangle{
public:
    int w,h;
    int area() const{
        return w*h;
    }
    void scale(int k){
        w*=k;
        h*=k;
    }
};
void print(const Rectangle &r){
    cout<<r.area()<<endl;
}
int main(){
    Rectangle r{3,4};
    print(r);
    return 0;
}
```

```output
12
```

`print` 的参数是 `const Rectangle &`，即一个“只读”的引用，通过它只能调用被声明为 `const` 的成员函数。`area` 只做读取，所以可以加 `const` 并被调用；而在 `print` 里写 `r.scale(2)` 会编译失败，因为 `scale` 会修改成员。传参时用 `const` 引用是为了避免复制又保证安全，这就要求类里所有不修改数据的成员函数都标上 `const`，否则这些函数就无法在只读的对象上使用。

## static 成员

普通的成员变量每个对象各有一份，而加了 `static` 的成员变量只有一份，由这个类的所有对象共享，它属于类本身。比如要统计当前有多少个 `Student` 对象存活，这个数字显然不属于任何一个学生，适合放在 `static` 成员里。

```trace
#include <bits/stdc++.h>
using namespace std;
class Student{
public:
    string name;
    inline static int count=0;
    Student(string n): name(n){
        count++;                                  //@s1,s3
    }
    ~Student(){
        count--;                                  //@s5
    }
    static int getCount(){
        return count;                             //@s2,s6
    }
};
int main(){
    Student a("A");                               //@s1
    cout<<Student::getCount()<<endl;              //@s2
    {
        Student b("B"),c("C");                    //@s3
        cout<<Student::count<<endl;               //@s4
    }                                             //@s5
    cout<<Student::getCount()<<endl;              //@s6
    return 0;
}
---
s1 | count=1 |  | 创建 a，构造函数里 count 加一。count 是静态成员，只有这一份。
s2 | count=1 | 1\n | 通过类名调用静态成员函数 getCount，不需要任何对象。
s3 | count=3 |  | 又创建了 b 和 c，每次构造都让同一个 count 加一。
s4 | count=3 | 3\n | 公开的静态成员变量也可以直接用“类名::成员名”访问。
s5 | count=1 |  | 内层的右花括号到了，b 和 c 被销毁，析构函数让 count 减了两次。
s6 | count=1 | 1\n | 只剩 a 还活着，count 回到 1。
```

静态成员属于类，所以用 `类名::成员名` 访问。静态成员函数没有 `this`，因为它不针对任何一个对象，也就只能使用静态成员。

> [!注意] 在 C++17 之前，静态成员变量只能在类里声明，还要在类的外面再写一行 `int Student::count=0;` 来定义它，漏掉时会出现“未定义的引用”这种链接错误。C++17 起可以在类里写 `inline static`，一步到位。

## 通过指针访问对象

用 `new` 创建的对象，得到的是指向它的指针。通过指针访问成员，要用箭头 `->`，`p->name` 等价于 `(*p).name`。需要特别记住的是，这样的对象不会在作用域结束时自动销毁，必须用 `delete` 手动销毁，析构函数在 `delete` 的时候才会执行。

```cpp title="new_delete.cpp"
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
    Noisy *p=new Noisy("heap");
    p->hello();
    cout<<"准备 delete"<<endl;
    delete p;
    cout<<"结束"<<endl;
    return 0;
}
```

```output
heap 出生
我是 heap
准备 delete
heap 销毁
结束
```

如果漏掉了 `delete`，这个对象就永远不会被销毁，析构函数也不会执行，占用的内存无法归还，这叫**内存泄漏**。需要手动配对 `new` 和 `delete`，正是 C++ 里许多错误的来源，所以后面的课程会讲怎样让对象自己负责资源的释放。

> [!思考] 一个 `const` 成员函数里，能不能调用同一个类里没有加 `const` 的成员函数？

> [!答案] 参考思路
> 不能。`const` 成员函数承诺不修改对象，而调用一个没有 `const` 的函数则可能会修改它，编译器会拒绝这样的调用。所以常有“一个函数加了 `const`，它调用的其他成员函数也要跟着加”的连锁反应，最好一开始就把只读的函数都标上。

> [!小结]
> `this` 是指向当前对象的隐含指针，用来区分同名的参数与成员，也让函数可以返回自身以便连续调用。`const` 成员函数承诺不修改对象，是只读对象能够调用的唯一一类成员函数。`static` 成员属于整个类，所有对象共享。用 `new` 创建的对象通过 `->` 访问，必须手动 `delete`。
