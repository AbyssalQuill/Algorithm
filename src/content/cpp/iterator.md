# 迭代器

> [!目标]
> - 理解迭代器是“指向容器中某个元素的位置”，会像指针一样用 `*it` 和 `++it`
> - 会用 `begin()`、`end()` 以及反向的 `rbegin()`、`rend()` 遍历各种容器
> - 会用 `advance`、`next`、`prev`、`distance` 移动和度量迭代器，并避开 `erase` 之后迭代器失效的陷阱

## 统一的“位置”

`vector` 可以用下标访问元素，但 `list`、`set`、`map` 这些容器的元素并不是顺序编号的，没有下标可用。标准库为所有容器提供了一个统一的概念来表示“元素所在的位置”，这就是**迭代器**。它的用法很像指针：`*it` 取出所指的元素，`++it` 移到下一个元素。

```cpp title="traverse.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={1,2,3};
    list<string> ls={"apple","banana"};
    set<int> s={3,1,2};
    for (auto it=v.begin();it!=v.end();++it){
        cout<<*it<<" ";
    }
    cout<<endl;
    for (auto it=ls.begin();it!=ls.end();++it){
        cout<<*it<<" ";
    }
    cout<<endl;
    for (auto it=s.begin();it!=s.end();++it){
        cout<<*it<<" ";
    }
    cout<<endl;
    return 0;
}
```

```output
1 2 3 
apple banana 
1 2 3 
```

三个容器的类型不同，遍历的写法却完全一样。`begin()` 返回指向第一个元素的迭代器；`end()` 返回的是“最后一个元素的**后面**”的位置，它只用来表示结束，并不指向任何元素，所以不能对它解引用。容器为空时，`begin()` 恰好等于 `end()`，循环一次也不会执行。这样的区间写成 `[begin, end)`，左闭右开，和 `for(i=0;i<n;i++)` 的习惯是同一种约定。

迭代器的类型名很长，比如 `vector<int>::iterator`，实际写代码时几乎都用 `auto` 让编译器去推断。顺便一提，之前常用的范围 `for` 循环 `for (int x:v)`，编译器内部做的正是上面这件事，只是替我们省去了书写。

## 反向迭代器

`rbegin()` 指向最后一个元素，`rend()` 指向第一个元素的前面，对它们执行 `++` 是向容器的开头方向移动。用它们可以不改动数据地倒着访问。

```cpp title="reverse_iter.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={1,2,3,4,5};
    for (auto it=v.rbegin();it!=v.rend();++it){
        cout<<*it<<" ";
    }
    cout<<endl;
    string s="level";
    string t(s.rbegin(),s.rend());
    cout<<t<<" "<<(s==t)<<endl;
    return 0;
}
```

```output
5 4 3 2 1 
level 1
```

`string t(s.rbegin(),s.rend())` 用一对迭代器构造了一个新字符串，内容是 `s` 倒过来的样子。把它与原串比较，就是判断回文串的一种简单办法。

## 移动与度量迭代器

`vector` 的迭代器可以直接加减整数，`it+3` 就是向后移三个位置。但 `list` 的元素在内存中并不相邻，它的迭代器只能一步一步地 `++`，不允许直接加整数。为了让所有容器都能用同一种写法，标准库提供了四个函数：`advance(it,n)` 让迭代器移动 `n` 步，`next(it)` 和 `prev(it)` 返回下一个、上一个位置，`distance(a,b)` 计算两个迭代器之间相隔多少个元素。

```cpp title="advance.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={1,2,3,4,5,6,7,8,9,10};
    list<string> ls={"apple","banana","orange","pear","grape"};
    auto it=v.begin();
    cout<<*it<<endl;
    advance(it,3);
    cout<<*it<<endl;
    advance(it,-2);
    cout<<*it<<endl;
    auto lit=ls.begin();
    advance(lit,2);
    cout<<*lit<<endl;
    cout<<*next(lit)<<" "<<*prev(lit)<<endl;
    cout<<distance(v.begin(),it)<<" "<<distance(ls.begin(),lit)<<endl;
    return 0;
}
```

```output
1
4
2
orange
pear banana
1 2
```

`advance` 的参数为负数时表示向前移动，不过那要求迭代器是可以双向移动的（`list` 可以，只能单向的 `forward_list` 不行）。`distance(v.begin(),it)` 的结果恰好是 `it` 所指元素的下标，这是由迭代器换算出下标的常见办法。

## 用迭代器配合 erase

`erase` 删除元素时需要迭代器指明位置，并且会返回**被删元素后面那个元素的迭代器**。这个返回值非常重要：删除之后，原来的迭代器就不能再用了，这种情况叫作**迭代器失效**。下面是边遍历边删除所有偶数的标准写法。

```cpp title="erase_loop.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={1,2,3,4,5,6};
    for (auto it=v.begin();it!=v.end();){
        if (*it%2==0){
            it=v.erase(it);
        }else{
            ++it;
        }
    }
    for (int x:v){
        cout<<x<<" ";
    }
    cout<<endl;
    return 0;
}
```

```output
1 3 5 
```

注意循环头里没有写 `++it`：删除了元素就用 `erase` 的返回值接着往下走，没有删除才手动 `++it`。如果写成 `v.erase(it);` 然后照常 `++it`，用的就是已经失效的迭代器，行为是未定义的，程序可能崩溃，也可能悄悄得到错误的结果。

`insert` 和 `push_back` 也会让 `vector` 的迭代器失效，因为数组空间不够时 `vector` 会换一块更大的内存，原来的位置全都作废了。而 `list` 和 `set`、`map` 这样基于节点的容器，插入不会影响其他元素的迭代器，删除也只影响被删除的那一个。

## 迭代器与算法

`sort`、`find`、`lower_bound`、`max_element` 这些标准库算法全都用一对迭代器表示要处理的范围，其中返回“位置”的算法，返回的也是迭代器。

```cpp title="algo_iter.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={30,10,50,20,40};
    auto p=find(v.begin(),v.end(),50);
    if (p!=v.end()){
        cout<<"50 的下标是 "<<p-v.begin()<<endl;
    }
    cout<<"最大值是 "<<*max_element(v.begin(),v.end())<<endl;
    sort(v.begin(),v.end());
    auto q=lower_bound(v.begin(),v.end(),25);
    cout<<"第一个不小于 25 的数是 "<<*q<<endl;
    return 0;
}
```

```output
50 的下标是 2
最大值是 50
第一个不小于 25 的数是 30
```

`find` 找不到时返回 `end()`，所以使用结果之前要先与 `end()` 比较。`p-v.begin()` 把迭代器换算成下标，和前面的 `distance` 是一回事，不过这种写法只适用于 `vector` 这样支持随机访问的容器。

> [!注意] 对 `end()` 解引用，或者在 `find` 没有找到时直接使用返回值，是最常见的迭代器错误，运行时往往表现为崩溃或者输出一个莫名其妙的数。

> [!竞赛] 日常刷题中，范围 `for` 加上 `auto` 已经够用。需要“位置”的时候才用到迭代器，比如 `lower_bound` 的结果、`set` 里的前驱后继、`erase` 的参数。迭代器失效是运行时错误的常见原因，边遍历边删除时务必使用 `erase` 的返回值。

> [!思考] 为什么 `end()` 设计成“最后一个元素的后面”，而不是最后一个元素本身？

> [!答案] 参考思路
> 这样可以用统一的方式表示空区间（`begin()==end()`），而且遍历的循环条件 `it!=end()` 不需要为“空容器”和“非空容器”分别处理；查找失败时返回 `end()`，也不会与任何一个有效位置混淆。

> [!小结]
> 迭代器是容器元素的“位置”，`begin()` 指向第一个元素，`end()` 指向末尾之后，两者构成左闭右开的区间。`rbegin()`、`rend()` 用于倒着访问，`advance`、`next`、`prev`、`distance` 在各种容器上移动和度量位置。`erase` 会使被删位置的迭代器失效，要用它的返回值继续遍历。
