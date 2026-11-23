# 结构体

> [!目标]
> - 理解结构体解决的问题：把属于同一个对象的几项数据放在一起管理
> - 能定义结构体、创建变量，并用 `.` 访问其中的成员
> - 会用结构体数组保存一批对象，会写构造函数，也知道怎样为结构体定义“谁大谁小”

## 为什么需要结构体

假设要处理一个班的学生成绩，每个学生有姓名和分数两项信息。用前面学过的知识，只能开两个数组，一个存姓名，一个存分数，靠相同的下标把它们对应起来。这样做并不难，可一旦要排序，两个数组必须同步移动，稍有疏忽就会出现“名字和分数对不上”的错误。

更自然的想法是：既然姓名和分数描述的是同一个学生，就让它们待在同一个“盒子”里。结构体（`struct`）做的正是这件事，它允许你自己定义一种新的类型，这种类型可以包含若干个不同类型的成员。

## 定义结构体并使用

```cpp title="student.cpp"
#include <bits/stdc++.h>
using namespace std;
struct Student{
    string name;
    int score;
};
int main(){
    Student a={"小明",90};
    Student b;
    b.name="小红";
    b.score=95;
    cout<<a.name<<" "<<a.score<<endl;
    cout<<b.name<<" "<<b.score<<endl;
    return 0;
}
```

```output
小明 90
小红 95
```

`struct Student{ ... };` 定义了一种叫 `Student` 的新类型，它由 `name` 和 `score` 两个成员组成。注意右花括号后面要写分号，这是初学者最常漏掉的地方。定义之后，`Student` 就可以像 `int` 一样用来声明变量：

- 声明时可以直接用花括号按顺序赋值：`Student a={"小明",90};`
- 访问某个成员用点号：`b.score` 表示变量 `b` 的 `score` 成员，既可以读，也可以修改。

下面这个演示改动了一个成员的值，可以留意 `a.score` 的变化：

```trace
#include <bits/stdc++.h>
using namespace std;
struct Student{
    string name;
    int score;
};
int main(){
    Student a={"Tom",90};            //@s1
    a.score=95;                      //@s2
    cout<<a.name<<" "<<a.score;      //@s3
    return 0;
}
---
s1 | a.name=Tom; a.score=90 |  | 创建一个 Student 变量 a，两个成员分别被赋为 Tom 和 90。
s2 | a.name=Tom; a.score=95 |  | 通过 a.score 只修改其中一个成员，其余成员不受影响。
s3 | a.name=Tom; a.score=95 | Tom 95 | 依次输出两个成员。
```

## 结构体数组：保存一批对象

结构体和数组可以直接组合，得到“很多个学生”。下面的程序读入 `n` 个学生，找出分数最高的一位。

```cpp title="top.cpp"
#include <bits/stdc++.h>
using namespace std;
struct Student{
    string name;
    int score;
};
Student s[105];
int main(){
    int n;
    cin>>n;
    for (int i=0;i<n;i++){
        cin>>s[i].name>>s[i].score;
    }
    int best=0;
    for (int i=1;i<n;i++){
        if (s[i].score>s[best].score){
            best=i;
        }
    }
    cout<<s[best].name<<" "<<s[best].score<<endl;
    return 0;
}
```

```input
3
Tom 90
Amy 95
Bob 88
```

```output
Amy 95
```

这里用到的“打擂台”和数组一课里找最大值的思路完全一样，区别只是比较的对象换成了 `s[i].score`，并且我们记录的是下标 `best`，而不是分数本身，这样最后就能同时取出姓名。

## 让结构体更好用：构造函数

每次创建变量都要手写 `{...}` 有些麻烦，而且不写初值时成员里是随机值。可以给结构体加一个**构造函数**：一个与结构体同名、没有返回值的函数，创建变量时会自动执行。

```cpp title="point.cpp"
#include <bits/stdc++.h>
using namespace std;
struct Point{
    int x,y;
    Point(int a=0,int b=0){
        x=a;
        y=b;
    }
};
int main(){
    Point p(3,4);
    Point q;
    cout<<p.x<<" "<<p.y<<" "<<q.x<<" "<<q.y<<endl;
    return 0;
}
```

```output
3 4 0 0
```

参数后面的 `=0` 是默认值：没给参数时就用 0，所以 `Point q;` 得到的是 `(0,0)`。

## 给结构体定义“大小”

有了结构体，很快就会遇到这样的需求：按分数给学生排序。排序函数要能判断两个学生谁排在前面，而它并不知道你的结构体里哪个成员重要。我们可以通过重载 `<` 运算符来告诉它：

```cpp title="less.cpp"
#include <bits/stdc++.h>
using namespace std;
struct P{
    int x,y;
    bool operator<(const P &o) const{
        return x<o.x;
    }
};
int main(){
    P a={1,5},b={2,3};
    cout<<(a<b)<<endl;
    return 0;
}
```

```output
1
```

这里规定“`x` 小的就算小”。以后写 `a<b` 时，编译器会调用你定义的这个函数。下一部分学习 `sort` 时，你会看到它是怎样利用这个规则的。

> [!竞赛] 结构体几乎是所有“有多个属性的对象”的标准写法
> 比赛里的人员、城市、任务、坐标点，基本都用结构体表示。把结构体放进 `vector` 或数组，再配合 `sort`，是最常见的组合。

> [!思考] 如果两个同学分数相同，想让名字靠前的排在前面，比较规则应该怎么写？

> [!答案] 参考思路
> 先比分数，分数不同就按分数决定；分数相同再比名字。这在排序一课中会有完整的代码。

> [!小结]
> 结构体把属于同一个对象的多项数据组织成一个整体，用 `.` 访问成员。它既能单独使用，也能做成数组；构造函数可以保证变量一创建就有合理的初值，重载 `<` 则让它能够参与排序。
