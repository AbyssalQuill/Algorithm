# 运算符重载

> [!目标]
> - 理解运算符重载的含义：为自己定义的类型规定 `+`、`==`、`<<` 等运算符该做什么
> - 会用成员函数和友元函数两种方式重载运算符
> - 会为 `sort`、`set`、`priority_queue` 重载 `<`，并认识重载 `()` 得到的“仿函数”

## 让自定义类型也能做运算

两个整数可以直接写 `a+b`，但两个二维向量就只能写成 `add(a,b)` 这样的函数调用，读起来远不如数学里的写法直观。C++ 允许为自己定义的类型规定运算符的含义，这就是**运算符重载**。重载的运算符本质上是一个名字特殊的函数，函数名是 `operator` 加上运算符本身，比如 `operator+`。

```cpp title="vec.cpp"
#include <bits/stdc++.h>
using namespace std;
struct Vec{
    int x,y;
    Vec(int x=0,int y=0): x(x), y(y){}
    Vec operator+(const Vec &o) const{
        return Vec(x+o.x,y+o.y);
    }
    Vec operator-(const Vec &o) const{
        return Vec(x-o.x,y-o.y);
    }
    Vec operator*(int k) const{
        return Vec(x*k,y*k);
    }
    bool operator==(const Vec &o) const{
        return x==o.x&&y==o.y;
    }
};
int main(){
    Vec a(1,2),b(3,4);
    Vec c=a+b;
    Vec d=(b-a)*3;
    cout<<c.x<<" "<<c.y<<endl;
    cout<<d.x<<" "<<d.y<<endl;
    cout<<(a+b==Vec(4,6))<<endl;
    return 0;
}
```

```output
4 6
6 6
1
```

`a+b` 会被编译器翻译成 `a.operator+(b)`：以左边的对象调用它的成员函数，右边的对象作为参数。几个细节值得留意：参数写成 `const Vec &` 是为了避免复制，并保证不会修改右边的对象；函数后面的 `const` 表示不会修改左边的对象，因为 `a+b` 不应该改变 `a`；返回的是一个新建的对象，而不是引用，因为它是临时算出来的结果。

## 输出运算符 <<

想让 `cout<<a` 直接输出一个向量，需要重载 `<<`。这里有个特殊之处：运算符的左边是 `cout`，不是 `Vec` 对象，所以它不能写成 `Vec` 的成员函数，只能写成类外面的普通函数。如果这个函数需要访问类的私有成员，就要在类里把它声明为**友元**（`friend`），友元不是类的成员，却被允许访问类的私有部分。

```cpp title="vec_print.cpp"
#include <bits/stdc++.h>
using namespace std;
class Vec{
    int x,y;
public:
    Vec(int x=0,int y=0): x(x), y(y){}
    friend ostream& operator<<(ostream &os,const Vec &v){
        os<<"("<<v.x<<", "<<v.y<<")";
        return os;
    }
};
int main(){
    Vec a(3,4);
    cout<<a<<endl;
    cout<<a<<" "<<Vec(1,2)<<endl;
    return 0;
}
```

```output
(3, 4)
(3, 4) (1, 2)
```

函数返回 `ostream&`，也就是输出流自身的引用。这样 `cout<<a<<" "` 先算出 `cout<<a`，得到的仍是 `cout`，后面才能继续接 `<<" "`，这和上一课返回 `*this` 实现连续调用是同一个办法。输入运算符 `>>` 的重载方式完全类似，只是参数换成 `istream&` 和非 `const` 的对象引用。

## 为排序规则重载 <

排序、`set`、`map` 以及 `priority_queue` 这些标准库工具，需要判断两个元素谁排在前面，它们判断的依据正是 `<`。只要为自定义类型重载了 `<`，这些工具就可以直接使用。

```cpp title="less_op.cpp"
#include <bits/stdc++.h>
using namespace std;
struct Student{
    string name;
    int score;
    bool operator<(const Student &o) const{
        if (score!=o.score) return score>o.score;
        return name<o.name;
    }
};
int main(){
    vector<Student> v={{"Tom",90},{"Amy",95},{"Bob",90}};
    sort(v.begin(),v.end());
    for (auto &s:v){
        cout<<s.name<<" "<<s.score<<endl;
    }
    return 0;
}
```

```output
Amy 95
Bob 90
Tom 90
```

这里 `operator<` 的含义是“谁应该排在前面”：分数高的在前，分数相同时名字靠前的在前。`sort` 默认从小到大排，也就是把“小”的放前面，于是这个定义直接决定了排序的结果。重载 `<` 时，成员函数一定要加上 `const`，否则标准库在处理只读对象时会因为无法调用它而报出冗长的错误。

> [!注意] `priority_queue` 也依据 `<` 来比较，但它每次弹出的是“最大”的元素，也就是按 `<` 排序后排在最后的那一个。想让分数最高的先出队，在上面的定义下是办不到的，要么反转比较方向，要么改用下面的写法。

## 重载 () 与仿函数

`()` 也是可以重载的运算符。重载了它的类，创建出来的对象可以像函数一样被调用，这样的对象叫**仿函数**（函数对象）。它们最常用在需要传入比较规则的地方。

```cpp title="functor.cpp"
#include <bits/stdc++.h>
using namespace std;
struct Greater{
    bool operator()(int a,int b) const{
        return a>b;
    }
};
int main(){
    vector<int> v={3,1,4,1,5};
    sort(v.begin(),v.end(),Greater());
    for (int x:v){
        cout<<x<<" ";
    }
    cout<<endl;
    priority_queue<int,vector<int>,Greater> pq;
    for (int x:v){
        pq.push(x);
    }
    cout<<pq.top()<<endl;
    return 0;
}
```

```output
5 4 3 1 1
1
```

`Greater()` 创建了一个仿函数对象，交给 `sort` 后，每当它需要比较两个数，就像调用函数那样使用它，所以结果是从大到小。`priority_queue` 的第三个模板参数同样是比较规则：默认是 `less`，弹出最大的；换成 `Greater` 之后，弹出的就是最小的。标准库里的 `greater<int>` 就是这样写出来的，竞赛里直接写 `priority_queue<int,vector<int>,greater<int>>` 即可。

## 重载时要遵守的规则

重载运算符有几条限制。只能重载已有的运算符，不能发明新的，比如没有办法让 `**` 表示乘方；不能改变运算符的优先级、结合性和操作数的个数；`.`、`::`、`?:` 和 `sizeof` 不能重载。除了语法上的限制，还有一条约定：含义要符合直觉。`+` 就应该表示某种“相加”，如果把它重载成做减法，没有人读得懂这样的代码。

> [!竞赛] 在比赛里最常用的是重载 `<`，让结构体可以放进 `sort`、`set`、`map` 和 `priority_queue`；其次是写一个 `operator()` 的仿函数作比较规则。需要做矩阵连乘、大整数运算时，重载 `*`、`+` 能让主体代码读起来像数学公式，下下课就会用到。

> [!思考] 为什么 `operator+` 返回的是一个新对象，而 `a+=b` 这样的 `operator+=` 通常返回自身的引用？

> [!答案] 参考思路
> `a+b` 不应该改变 `a` 和 `b`，结果只能是一个全新的对象，所以返回值。`a+=b` 的含义是修改 `a` 本身，把修改后的 `a` 作为结果返回，返回自身的引用既省去了复制，也让 `(a+=b)+=c` 这样的连续写法继续作用在同一个对象上。

> [!小结]
> 运算符重载就是定义名为 `operator` 加运算符的函数，让自定义类型也能用熟悉的符号来运算。二元运算符作为成员函数时，左边是调用者；`<<` 的左边是输出流，只能写成类外函数，需要访问私有成员时声明为友元。重载 `<` 能让对象直接参与排序，重载 `()` 得到可以像函数一样调用的仿函数。
