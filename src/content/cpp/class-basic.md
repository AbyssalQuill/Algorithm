# 类与对象

> [!目标]
> - 理解类要解决的问题：把数据和处理这些数据的函数放进同一个整体
> - 会定义类、创建对象，用 `.` 访问成员变量和调用成员函数
> - 分清“类”和“对象”，并认识到 `string`、`vector` 本身就是类

## 数据和操作为什么要放在一起

上一章用结构体把一个学生的姓名和分数组织成一个整体。不过结构体只管存数据，处理这些数据的函数依然散落在外面，比如下面这个把学生信息打印出来的 `show`。

```cpp title="student_struct.cpp"
#include <bits/stdc++.h>
using namespace std;
struct Student{
    string name;
    int score;
};
void show(const Student &s){
    cout<<s.name<<" "<<s.score<<endl;
}
int main(){
    Student a={"Tom",90};
    show(a);
    return 0;
}
```

```output
Tom 90
```

程序很短的时候，这样写没有任何问题。但程序变大以后就会遇到两个麻烦：一是看到 `Student` 时，不知道有哪些函数是专门处理它的；二是一旦修改了 `Student` 的成员，就得到处去找哪些函数需要跟着改。

更自然的做法是把“学生有哪些数据”和“学生能做哪些事”写在同一个地方。C++ 里用来做这件事的就是**类**（`class`）。

## 定义一个类

下面把 `show` 搬进了类的内部。

```cpp title="student_class.cpp"
#include <bits/stdc++.h>
using namespace std;
class Student{
public:
    string name;
    int score;
    void show(){
        cout<<name<<" "<<score<<endl;
    }
};
int main(){
    Student a;
    a.name="Tom";
    a.score=90;
    a.show();
    Student b;
    b.name="Amy";
    b.score=95;
    b.show();
    return 0;
}
```

```output
Tom 90
Amy 95
```

类里面的内容叫作**成员**，分成两种：`name` 和 `score` 是成员变量，保存数据；`show` 是成员函数，描述这类东西能做什么。`public:` 的含义留到下一课再讲，现在照写即可。

注意 `show` 的内部直接写了 `name` 和 `score`，没有写 `a.name`。成员函数总是通过某一个具体的对象来调用的：`a.show()` 里的 `name` 就是 `a` 的 `name`，`b.show()` 里的就是 `b` 的，所以同一个函数在两次调用中打印了不同的内容。

### 类与对象

类和对象的关系，可以类比 `int` 与整数变量。`int` 规定了一种类型能存什么、能做什么，`int x;` 才真正得到一个可以使用的变量。同样，`Student` 是一份设计图，说明学生有姓名、分数，可以显示；`Student a;` 是照着这份图造出来的一个具体的对象。一份设计图可以造出任意多个对象，每个对象都有自己独立的一份成员变量，改动 `a.score` 不会影响 `b.score`。

## 在成员函数里修改数据

成员函数不仅可以读取成员变量，也可以修改它们。下面的长方形类提供了计算面积、周长和按比例放大三个操作。

```cpp title="rectangle.cpp"
#include <bits/stdc++.h>
using namespace std;
class Rectangle{
public:
    int w,h;
    int area(){
        return w*h;
    }
    int perimeter(){
        return 2*(w+h);
    }
    void scale(int k){
        w*=k;
        h*=k;
    }
};
int main(){
    Rectangle r;
    r.w=3;
    r.h=4;
    cout<<r.area()<<" "<<r.perimeter()<<endl;
    r.scale(2);
    cout<<r.area()<<" "<<r.perimeter()<<endl;
    return 0;
}
```

```output
12 14
48 28
```

下面这个演示更清楚地展示了“每个对象各有一份数据”。两个计数器 `a` 和 `b` 调用的是同一个 `add` 函数，但每次改动的是调用它的那个对象自己的 `n`。

```trace
#include <bits/stdc++.h>
using namespace std;
class Counter{
public:
    int n=0;
    void add(int k){
        n+=k;                         //@s3,s4
    }
};
int main(){
    Counter a,b;                      //@s1
    b.n=10;                           //@s2
    a.add(5);                         //@s3
    b.add(1);                         //@s4
    cout<<a.n<<" "<<b.n;              //@s5
    return 0;
}
---
s1 | a.n=0; b.n=0 |  | 创建两个 Counter 对象。成员变量 n 声明时写了初值 0，所以每个对象一创建，自己的 n 就是 0。
s2 | a.n=0; b.n=10 |  | 只修改了 b 的 n，a 的 n 不受影响。
s3 | a.n=5; b.n=10 |  | 通过 a 调用 add，函数里的 n 指的就是 a.n，所以只有 a.n 变成了 5。
s4 | a.n=5; b.n=11 |  | 通过 b 调用同一个 add，这一次函数里的 n 指的是 b.n。
s5 | a.n=5; b.n=11 | 5 11 | 分别输出两个对象各自的 n。
```

## 把成员函数写在类的外面

如果函数体比较长，把它全部塞在类的花括号里，会让类变得很难读。这时可以只在类里写函数的声明，把函数体写在类的外面，并在函数名前加上 `类名::`，告诉编译器这个函数属于哪个类。

```cpp title="outside.cpp"
#include <bits/stdc++.h>
using namespace std;
class Rectangle{
public:
    int w,h;
    int area();
};
int Rectangle::area(){
    return w*h;
}
int main(){
    Rectangle r;
    r.w=5;
    r.h=6;
    cout<<r.area()<<endl;
    return 0;
}
```

```output
30
```

规模较大的项目通常把类的声明放在头文件里，函数的实现放在另一个源文件里，用的就是这种写法。在算法竞赛里所有代码都写在同一个文件，直接写在类里面更省事，两种写法的效果完全一样。

## 其实早就在使用对象

学过 `string` 和 `vector` 之后，应该已经对下面这种写法很熟悉了。

```cpp title="std_objects.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string s="algorithm";
    vector<int> v;
    v.push_back(3);
    v.push_back(5);
    cout<<s.size()<<" "<<s.substr(0,4)<<" "<<v.size()<<" "<<v.back()<<endl;
    return 0;
}
```

```output
9 algo 2 5
```

`string` 和 `vector<int>` 都是标准库提供的类，`s` 和 `v` 是它们的对象，`s.size()`、`v.push_back(3)` 就是在调用对象的成员函数。点号前面是哪个对象，函数就对哪个对象起作用，这与前面的 `a.show()` 没有任何区别。搞清楚了类，这些标准库的用法也就不再神秘了。

> [!注意] 类定义的右花括号后面必须有分号，和结构体一样。漏掉它时，编译器的报错通常指向后面好几行，不太容易一眼看出原因。

> [!思考] 在 `Rectangle` 里，如果有人写了 `r.w=-3;`，会发生什么？这是类自身能够避免的吗？

> [!答案] 参考思路
> 长方形的宽变成了负数，`area()` 也会算出负的面积，而程序不会有任何提示。目前的类没有办法阻止这种情况，因为成员变量对外完全开放。下一课讲的封装，就是让类自己负责检查数据是否合理。

> [!小结]
> 类把成员变量和成员函数放在一起，描述一类东西有哪些数据、能做哪些事；对象是按类造出来的具体个体，每个对象有自己的一份成员变量，通过 `.` 访问。成员函数里直接使用的成员名，指的是调用它的那个对象的成员。
