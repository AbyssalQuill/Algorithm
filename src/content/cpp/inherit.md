# 继承

> [!目标]
> - 理解继承解决的问题：让新类直接获得已有类的成员，只补充不同的部分
> - 会写派生类，会在派生类的构造函数里调用基类的构造函数
> - 知道 `protected` 的用途，以及基类与派生类的构造、析构顺序

## 为什么需要继承

设想要描述学校里的人。学生有姓名、年龄，还有成绩；老师也有姓名、年龄，还有所教的科目。两者的姓名、年龄以及自我介绍的方式完全一样，如果各写一个类，就得把相同的代码抄两遍，以后改动时还得改两处。

继承就是为这种情形准备的：先写一个只包含共同部分的类 `Person`，再让 `Student` 和 `Teacher` 在它的基础上，补充各自特有的内容。被继承的类叫**基类**（也叫父类），继承而来的叫**派生类**（也叫子类）。

```cpp title="inherit.cpp"
#include <bits/stdc++.h>
using namespace std;
class Person{
public:
    string name;
    int age;
    Person(string n,int a): name(n), age(a){}
    void introduce(){
        cout<<"我叫"<<name<<"，"<<age<<" 岁"<<endl;
    }
};
class Student: public Person{
public:
    int score;
    Student(string n,int a,int s): Person(n,a), score(s){}
    void showScore(){
        cout<<name<<" 的成绩是 "<<score<<endl;
    }
};
int main(){
    Student s("Tom",15,90);
    s.introduce();
    s.showScore();
    return 0;
}
```

```output
我叫Tom，15 岁
Tom 的成绩是 90
```

`class Student: public Person` 表示 `Student` 继承自 `Person`。派生类拥有基类的全部成员，所以 `s` 虽然没有定义 `introduce`，却可以直接调用；在 `showScore` 里也可以直接使用基类的 `name`。

派生类的对象由两部分组成：基类的部分和自己新增的部分。创建对象时，必须先把基类的部分构造好，因此派生类的构造函数要通过初始化列表调用基类的构造函数，上面的 `Person(n,a)` 就是这个作用。如果基类有无参的构造函数，这一步可以省略，编译器会自动调用它。

继承表达的是“是一种”的关系：学生是一种人，所以可以继承。如果两个类之间只是“拥有”的关系，比如汽车有发动机，就不应该用继承，而应该把发动机作为汽车的一个成员变量。

## protected 成员

基类里的 `private` 成员，派生类同样无法访问，这有时太严格了。C++ 还提供了第三种权限 `protected`：它对外部代码仍然是隐藏的，但派生类可以使用。

| 权限 | 类自己的成员函数 | 派生类的成员函数 | 外部代码 |
| --- | --- | --- | --- |
| `public` | 可以 | 可以 | 可以 |
| `protected` | 可以 | 可以 | 不可以 |
| `private` | 可以 | 不可以 | 不可以 |

```cpp title="protected.cpp"
#include <bits/stdc++.h>
using namespace std;
class Person{
protected:
    int age;
public:
    string name;
    Person(string n,int a): name(n), age(a){}
    int getAge(){
        return age;
    }
};
class Student: public Person{
public:
    Student(string n,int a): Person(n,a){}
    void birthday(){
        age++;
    }
};
int main(){
    Student s("Tom",15);
    s.birthday();
    cout<<s.getAge()<<endl;
    return 0;
}
```

```output
16
```

`age` 是 `protected` 的，所以 `Student` 的 `birthday` 可以直接修改它，而 `main` 里写 `s.age` 就会编译失败。

## 构造与析构的顺序

派生类对象创建时，先构造基类部分，再构造派生类自己的部分；销毁时的顺序正好相反。

```cpp title="order.cpp"
#include <bits/stdc++.h>
using namespace std;
class Base{
public:
    Base(){
        cout<<"Base 构造"<<endl;
    }
    ~Base(){
        cout<<"Base 析构"<<endl;
    }
};
class Derived: public Base{
public:
    Derived(){
        cout<<"Derived 构造"<<endl;
    }
    ~Derived(){
        cout<<"Derived 析构"<<endl;
    }
};
int main(){
    Derived d;
    cout<<"使用中"<<endl;
    return 0;
}
```

```output
Base 构造
Derived 构造
使用中
Derived 析构
Base 析构
```

这和盖楼的顺序是一样的：必须先有地基，才能在上面盖楼；拆楼时则要先拆上层，最后才能拆地基。派生类的构造依赖基类已经就绪，所以基类一定先构造、后析构。

## 在派生类里重写函数

派生类可以定义一个与基类同名的函数。这样，通过派生类对象调用这个名字时，用的是派生类自己的版本，基类的同名函数被“隐藏”了。如果仍想用基类的版本，就在函数名前面加上 `基类名::`。

```cpp title="hide.cpp"
#include <bits/stdc++.h>
using namespace std;
class Person{
public:
    void introduce(){
        cout<<"我是一个人"<<endl;
    }
};
class Student: public Person{
public:
    void introduce(){
        Person::introduce();
        cout<<"我还是一名学生"<<endl;
    }
};
int main(){
    Student s;
    s.introduce();
    return 0;
}
```

```output
我是一个人
我还是一名学生
```

派生类的版本先调用了基类的版本，再补充自己的内容，这是扩展基类行为的常见写法。不过这里的“同名函数”只是简单的隐藏，调用哪一个，完全取决于对象的类型是什么。如果把派生类的对象当作基类来使用，会是什么结果，这是下一课的主题。

## 多重继承

一个类也可以同时继承多个基类，在冒号后面用逗号隔开。派生类将拥有所有基类的成员。

```cpp title="multi.cpp"
#include <bits/stdc++.h>
using namespace std;
class Flyer{
public:
    void move(){
        cout<<"飞行"<<endl;
    }
    void fly(){
        cout<<"拍动翅膀"<<endl;
    }
};
class Swimmer{
public:
    void move(){
        cout<<"游泳"<<endl;
    }
    void swim(){
        cout<<"划水"<<endl;
    }
};
class Duck: public Flyer, public Swimmer{
};
int main(){
    Duck d;
    d.fly();
    d.swim();
    d.Flyer::move();
    d.Swimmer::move();
    return 0;
}
```

```output
拍动翅膀
划水
飞行
游泳
```

`Flyer` 和 `Swimmer` 各有一个 `move`，对 `Duck` 的对象直接写 `d.move()` 无法确定指的是哪一个，编译器会报“有歧义”的错误，必须像上面那样，用 `类名::` 明确指出。

多重继承还有一个更棘手的情形：如果两个基类又继承自同一个更上层的基类，派生类里就会有两份这个“祖先”的数据，访问起来有歧义，也浪费空间，这叫作“菱形继承”。C++ 提供了**虚继承**来解决它，写成 `class A: virtual public Base`，让所有路径共享同一份祖先。由于这会让类的结构变得复杂，实际使用时要慎重，多数时候让一个类继承一个基类、再把别的功能作为成员，就足够了。

> [!竞赛] 算法竞赛里几乎不需要继承，所有的数据结构直接写成独立的结构体或类。但继承是读懂标准库和大型项目的基础，例如输入输出流 `cin`、`cout` 所属的类就有一套继承关系，理解它们的工作方式，也要从这里开始。

> [!思考] 如果让 `Student` 继承 `Person`，那么 `Person` 的析构函数和 `Student` 的析构函数，哪一个先执行？

> [!答案] 参考思路
> 先执行 `Student` 的析构函数，再执行 `Person` 的。派生类对象销毁时，先收拾自己新增的部分，最后再收拾基类的部分，与构造的顺序相反。

> [!小结]
> 继承让派生类直接获得基类的成员，并可以增加自己的成员；派生类的构造函数要通过初始化列表构造基类的部分。`protected` 成员对外隐藏，但派生类可以使用。基类先于派生类构造，后于派生类析构。同名函数在派生类里会隐藏基类的版本，需要时用 `基类名::` 来调用。
