# 多态与虚函数

> [!目标]
> - 理解多态要解决的问题：通过基类的指针或引用，调用到对象真正所属的类里的函数
> - 会用 `virtual` 和 `override` 写出可以被重写的函数
> - 会写纯虚函数和抽象类，并知道基类的析构函数为什么要声明成虚函数

## 基类的指针指向派生类的对象

继承表达的是“是一种”的关系，所以一个派生类的对象，可以当作基类的对象来使用：`Dog` 是一种 `Animal`，因此 `Animal` 类型的指针可以指向 `Dog`。这很有用，比如可以把狗和猫放进同一个数组，统一处理。先来看看直接这样做会怎么样。

```cpp title="no_virtual.cpp"
#include <bits/stdc++.h>
using namespace std;
class Animal{
public:
    void speak(){
        cout<<"..."<<endl;
    }
};
class Dog: public Animal{
public:
    void speak(){
        cout<<"汪汪"<<endl;
    }
};
class Cat: public Animal{
public:
    void speak(){
        cout<<"喵喵"<<endl;
    }
};
int main(){
    Dog d;
    Cat c;
    Animal *p[2]={&d,&c};
    for (int i=0;i<2;i++){
        p[i]->speak();
    }
    return 0;
}
```

```output
...
...
```

结果并不是想要的。`p[i]` 的类型是 `Animal*`，编译器在编译阶段只能根据这个类型决定调用哪个函数，于是两次都调用了 `Animal::speak`，指针实际指向的是狗还是猫，被完全忽略了。

## virtual：由对象的真实类型决定

只要在基类的函数前加上 `virtual`，情况就不一样了。带有 `virtual` 的函数，调用哪个版本不再在编译时决定，而是在运行时看指针指向的对象实际是什么类型。

```trace
#include <bits/stdc++.h>
using namespace std;
class Animal{
public:
    virtual void speak(){
        cout<<"..."<<endl;
    }
};
class Dog: public Animal{
public:
    void speak() override{
        cout<<"汪汪"<<endl;                //@s2
    }
};
class Cat: public Animal{
public:
    void speak() override{
        cout<<"喵喵"<<endl;                //@s3
    }
};
int main(){
    Dog d;
    Cat c;
    Animal *p[2]={&d,&c};                  //@s1
    for (int i=0;i<2;i++){
        p[i]->speak();                     //@s2,s3
    }
    return 0;
}
---
s1 | p[0]=&d; p[1]=&c |  | 两个指针的类型都是 Animal*，但 p[0] 指向的是 Dog 对象，p[1] 指向的是 Cat 对象。
s2 | i=0 | 汪汪\n | 虽然写的是同一句 p[i]->speak()，运行时发现 p[0] 实际指向 Dog，于是执行 Dog 的 speak。
s3 | i=1 | 喵喵\n | 同样的语句，这次 p[1] 指向 Cat，所以执行的是 Cat 的 speak。
```

同一条语句 `p[i]->speak()`，因为对象不同而产生了不同的行为，这就是**多态**。写这段代码的人不需要关心每个元素到底是什么动物，以后再新增 `Bird` 类，这个循环也不需要任何改动。

派生类里的 `override` 是一个可选的标记，意思是“这个函数是要重写基类的虚函数”。加上它以后，如果函数名拼错了，或者参数类型和基类对不上，编译器会直接报错，而不是悄悄地定义了一个无关的新函数。建议重写虚函数时总是带上它。

虚函数在引用上同样有效，但对按值传递的对象却没有作用。

```cpp title="slicing.cpp"
#include <bits/stdc++.h>
using namespace std;
class Animal{
public:
    virtual void speak(){
        cout<<"..."<<endl;
    }
};
class Dog: public Animal{
public:
    void speak() override{
        cout<<"汪汪"<<endl;
    }
};
void byRef(Animal &a){
    a.speak();
}
void byVal(Animal a){
    a.speak();
}
int main(){
    Dog d;
    byRef(d);
    byVal(d);
    return 0;
}
```

```output
汪汪
...
```

按值传递时，`Dog` 对象被复制成一个 `Animal` 对象，属于 `Dog` 的那部分在复制中被丢掉了，这叫**对象切片**。切片之后它就是一个货真价实的 `Animal`，当然只能说出“...”。所以想要多态，就要用指针或引用，而不能按值传递。

## 纯虚函数与抽象类

有时基类的某个函数根本没有合理的默认实现。比如“形状”类里的求面积函数：形状本身是一个抽象的概念，只有具体到圆或矩形，才知道怎么算面积。这时可以把函数声明成**纯虚函数**，写法是在末尾加上 `= 0`，它表示这个函数只规定了“有这个功能”，具体怎么做，由派生类来决定。

含有纯虚函数的类叫**抽象类**，它不能用来创建对象，只能作为基类。派生类必须实现所有的纯虚函数，才能创建对象。

```cpp title="shape.cpp"
#include <bits/stdc++.h>
using namespace std;
class Shape{
public:
    virtual double area() const=0;
    virtual ~Shape(){}
};
class Circle: public Shape{
    double r;
public:
    Circle(double r): r(r){}
    double area() const override{
        return 3.14*r*r;
    }
};
class Rect: public Shape{
    double w,h;
public:
    Rect(double w,double h): w(w), h(h){}
    double area() const override{
        return w*h;
    }
};
int main(){
    Circle c(2);
    Rect r(3,4);
    vector<Shape*> shapes={&c,&r};
    double total=0;
    cout<<fixed<<setprecision(2);
    for (Shape *s:shapes){
        cout<<s->area()<<endl;
        total+=s->area();
    }
    cout<<"总面积 "<<total<<endl;
    return 0;
}
```

```output
12.56
12.00
总面积 24.56
```

遍历的循环只依赖 `Shape` 这个统一的接口，不知道也不关心具体是什么形状。以后增加三角形、椭圆，只需要再写一个派生类，这段统计面积的代码一个字也不用改。

## 虚析构函数

用基类的指针去销毁派生类的对象时，有一个必须注意的细节。

```cpp title="virtual_dtor.cpp"
#include <bits/stdc++.h>
using namespace std;
class Base{
public:
    virtual ~Base(){
        cout<<"Base 析构"<<endl;
    }
};
class Derived: public Base{
public:
    ~Derived(){
        cout<<"Derived 析构"<<endl;
    }
};
int main(){
    Base *p=new Derived;
    delete p;
    return 0;
}
```

```output
Derived 析构
Base 析构
```

`delete p` 的 `p` 是 `Base*`，但对象实际是 `Derived`。基类的析构函数声明成了虚函数，所以先执行了 `Derived` 的析构，再执行 `Base` 的。如果漏掉 `virtual`，这行 `delete` 在 C++ 里是未定义行为，通常只会执行 `Base` 的析构函数，`Derived` 里申请的资源就不会释放。因此有一条简单的规则：只要一个类打算作为基类，并且会通过基类的指针来管理派生类对象，就要把它的析构函数声明成 `virtual`。

> [!竞赛] 比赛里几乎用不到虚函数。虚函数调用比普通调用稍慢，而且数据结构的类型在写代码时就已经确定，不需要运行时再选择。需要提醒的一点是，标准库的容器如 `vector`、`map` 都没有虚析构函数，不要继承它们。

> [!思考] 为什么不能直接写 `Shape s;` 来创建一个抽象类的对象？

> [!答案] 参考思路
> 抽象类里有没有实现的纯虚函数。如果允许创建对象，调用 `s.area()` 时就没有任何代码可以执行。编译器因此不允许创建抽象类的对象，只允许通过指针或引用，指向实现完整的派生类对象。

> [!小结]
> 基类的指针或引用可以指向派生类对象。基类函数声明为 `virtual` 以后，调用哪个版本由对象的真实类型在运行时决定，这就是多态；重写时加上 `override` 让编译器帮忙检查。纯虚函数让基类只规定接口，含有它的抽象类不能创建对象。作为基类的类，析构函数应当声明为虚函数。
