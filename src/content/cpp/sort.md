# sort 与 pair

> [!目标]
> - 会用 `sort` 对数组和 `vector` 排序，会从大到小排
> - 理解 `pair`，知道它默认怎样比较大小
> - 能写自定义的比较规则，包括使用 lambda 表达式
> - 知道比较规则必须满足“严格弱序”，并明白为什么不能写 `<=`

## sort 的基本用法

排序是编程里最常见的操作之一，而 C++ 标准库已经提供了一个又快又可靠的实现，就是 `sort`。它的用法是告诉它**从哪里开始，到哪里结束**（区间左闭右开），其余的交给它完成。

```cpp title="sort.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n;
    cin>>n;
    vector<int> a(n);
    for (int i=0;i<n;i++){
        cin>>a[i];
    }
    sort(a.begin(),a.end());
    for (int x:a){
        cout<<x<<" ";
    }
    cout<<endl;
    return 0;
}
```

```input
5
3 1 4 1 5
```

```output
1 1 3 4 5
```

对于 `vector`，区间的两端是 `a.begin()` 和 `a.end()`；对于普通数组，则写成数组名和“数组名加元素个数”：

```cpp frag
int a[5]={5,2,9,1,7};
sort(a,a+5);
for (int i=0;i<5;i++){
    cout<<a[i]<<" ";
}
cout<<endl;
```

```output
1 2 5 7 9
```

`sort` 的时间复杂度是 O(n log n)，几十万个数也能很快排完，不需要自己再写冒泡排序。

## 从大到小排

默认是从小到大。想要降序，在第三个参数的位置传入 `greater<int>()`：

```cpp frag
vector<int> v={5,2,9,1,7};
sort(v.begin(),v.end(),greater<int>());
for (int x:v){
    cout<<x<<" ";
}
cout<<endl;
```

```output
9 7 5 2 1
```

## pair：把两个值绑在一起

有时需要把两个相关的值当作一个整体，比如（分数，编号）、（横坐标，纵坐标）。如果专门为此定义结构体显得有些重，可以用现成的 `pair`。它的两个成员叫 `first` 和 `second`。

`pair` 自带比较规则：**先比 `first`，`first` 相等再比 `second`**。所以对 `pair` 的数组直接排序，就实现了“按第一个关键字排，相同时按第二个关键字排”。

```cpp frag
vector<pair<int,int>> v={{90,2},{85,1},{90,1}};
sort(v.begin(),v.end());
for (auto &p:v){
    cout<<p.first<<" "<<p.second<<endl;
}
```

```output
85 1
90 1
90 2
```

这里的 `auto` 让编译器自动推断变量类型，免得把 `pair<int,int>` 重复写一遍。

## 自定义比较规则

如果想按别的规则排序，就自己写一个比较函数交给 `sort`。函数接收两个元素 `a` 和 `b`，**当 `a` 应当排在 `b` 前面时返回 `true`**。例如按绝对值从小到大排：

```cpp title="cmp.cpp"
#include <bits/stdc++.h>
using namespace std;
bool cmp(int a,int b){
    return abs(a)<abs(b);
}
int main(){
    vector<int> v={-3,1,-2};
    sort(v.begin(),v.end(),cmp);
    for (int x:v){
        cout<<x<<" ";
    }
    cout<<endl;
    return 0;
}
```

```output
1 -2 -3
```

如果这个规则只用一次，单独写函数显得啰嗦，可以直接把它写在 `sort` 的参数里，这种没有名字的函数叫作 **lambda 表达式**，格式是 `[](参数){ 函数体 }`。下面是按多个条件排序的典型例子：先按分数从高到低，分数相同再按姓名的字典序。

```cpp title="rank.cpp"
#include <bits/stdc++.h>
using namespace std;
struct S{
    string name;
    int score;
};
int main(){
    vector<S> v={{"Tom",90},{"Amy",95},{"Bob",90}};
    sort(v.begin(),v.end(),[](const S &a,const S &b){
        if (a.score!=b.score){
            return a.score>b.score;
        }
        return a.name<b.name;
    });
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

写多条件比较时有一个固定的套路：先比较最重要的条件，如果两者不相等就可以直接得出结论；只有相等的时候，才继续看下一个条件。

## 比较规则必须是“严格”的

自己写比较规则时，有一条必须遵守：**当两个元素相等时，必须返回 `false`**。也就是说，要写 `a<b`、`a>b`，不能写 `a<=b`。这条要求在数学上称为“严格弱序”。

```cpp noverify
// 错误示范：当 a 和 b 相等时返回了 true
sort(v.begin(),v.end(),[](int a,int b){
    return a<=b;
});
```

这样写在数据里有相同元素时，程序可能直接崩溃，也可能得到乱七八糟的结果，而且往往在本地测试时发现不了。养成习惯，比较函数里永远只用 `<` 或 `>`。

## 一个有趣的例子：拼出最大的数

给出若干个正整数，把它们首尾相接拼成一个最大的数。比如 3、30、34，最大的拼法是 `34330`。关键是决定两个数谁在前：如果 `a+b` 拼出来的字符串比 `b+a` 大，就让 `a` 排在前面。

```cpp title="concat.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n;
    cin>>n;
    vector<string> v(n);
    for (int i=0;i<n;i++){
        cin>>v[i];
    }
    sort(v.begin(),v.end(),[](const string &a,const string &b){
        return a+b>b+a;
    });
    for (auto &s:v){
        cout<<s;
    }
    cout<<endl;
    return 0;
}
```

```input
3
3 30 34
```

```output
34330
```

这就是洛谷“拼数”这道题的完整思路。

> [!竞赛] 排序前先想清楚要排什么
> 绝大多数题目的排序，都可以归结为“把元素放进数组，写好比较规则，调用 `sort`”。如果需要稳定排序（相等的元素保持原来的先后顺序），可以改用 `stable_sort`，用法完全一样。

> [!小结]
> `sort(起点,终点)` 默认从小到大，传入 `greater<int>()` 变成从大到小。`pair` 先比 `first` 再比 `second`。自定义规则要写成函数或 lambda，相等时返回 `false`，多个条件按“先比重要的，相等再比次要的”处理。
