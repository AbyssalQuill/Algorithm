# vector 动态数组

> [!目标]
> - 明白 `vector` 比普通数组方便在哪里
> - 掌握创建、添加、访问、遍历、删除和清空这些基本操作
> - 会使用二维 `vector`，并能避开 `size()` 带来的一个常见陷阱

## 数组的长度是个负担

普通数组有一个很实际的麻烦：长度必须在写程序时就确定。题目说 `n` 最大为十万，就只能开一个十万以上的数组，而实际输入可能只有十几个数；如果一道题里要处理很多组数据，每一组之间还得手动清零。

`vector`（向量）是标准库提供的“会自己伸缩的数组”。它能随时在末尾添加元素，空间不够时会自动扩容，同时保留了用下标访问元素的习惯，用起来和数组几乎一样。

## 基本用法

```cpp title="square.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n;
    cin>>n;
    vector<int> v;
    for (int i=0;i<n;i++){
        int x;
        cin>>x;
        v.push_back(x);
    }
    for (int x:v){
        cout<<x*x<<" ";
    }
    cout<<endl;
    return 0;
}
```

```input
4
1 2 3 4
```

```output
1 4 9 16
```

声明时尖括号里写元素的类型，`vector<int>` 就是装整数的向量。最常用的操作整理如下：

| 写法 | 作用 |
| :-- | :-- |
| `vector<int> v;` | 创建一个空的向量 |
| `vector<int> v(n);` | 创建含有 `n` 个元素的向量，初值都是 0 |
| `vector<int> v(n,x);` | 创建含有 `n` 个元素的向量，初值都是 `x` |
| `v.push_back(x)` | 在末尾添加一个元素 |
| `v.pop_back()` | 删除最后一个元素 |
| `v[i]`、`v.back()` | 访问第 `i` 个元素、最后一个元素 |
| `v.size()`、`v.empty()` | 元素个数、是否为空 |
| `v.clear()` | 清空所有元素 |
| `v.insert(位置,x)`、`v.erase(位置)` | 在指定位置插入或删除 |

遍历可以用下标，也可以用上一课见过的范围 `for`。下面这段演示体现了 `push_back` 如何让向量逐渐变长：

```trace
vector<int> v;       //@s1
v.push_back(3);      //@s2
v.push_back(5);      //@s3
v[0]=8;              //@s4
cout<<v.size();      //@s5
---
s1 | v=[] |  | 创建了一个空向量，里面一个元素也没有。
s2 | v=[3] |  | push_back 把 3 添加到末尾，现在有一个元素。
s3 | v=[3,5] |  | 再添加 5，向量自动变长。
s4 | v=[8,5] |  | 和数组一样，可以用下标直接修改某个元素。
s5 | v=[8,5] | 2 | size() 返回当前元素个数，是 2。
```

## 插入、删除和清空

`insert` 和 `erase` 需要用迭代器来指定位置，最简单的写法是 `v.begin()` 加上一个偏移量。

```cpp frag
vector<int> v={10,20,30};
v.erase(v.begin()+1);
v.insert(v.begin(),5);
for (int x:v){
    cout<<x<<" ";
}
cout<<endl;
```

```output
5 10 30
```

先删除了下标为 1 的元素 20，再在最前面插入 5。需要留意，在中间或开头插入、删除时，后面所有的元素都要整体挪动，花费的时间与元素个数成正比；而在末尾添加和删除则几乎不花时间。所以如果可以，尽量只在末尾操作。

```cpp frag
vector<int> a(3,7);
a.push_back(1);
cout<<a.size()<<" "<<a.back()<<" "<<a.empty()<<endl;
a.clear();
cout<<a.size()<<" "<<a.empty()<<endl;
```

```output
4 1 0
0 1
```

## 二维 vector

二维数组的行数和列数也同样可以做成可变的：把“一行”看成一个 `vector<int>`，再把若干行放进一个更大的 `vector` 里。

```cpp frag
int n=2,m=3;
vector<vector<int>> g(n,vector<int>(m,0));
g[1][2]=9;
for (int i=0;i<n;i++){
    for (int j=0;j<m;j++){
        cout<<g[i][j]<<" ";
    }
    cout<<endl;
}
```

```output
0 0 0
0 0 9
```

`vector<vector<int>> g(n,vector<int>(m,0))` 的意思是：创建 `n` 个元素，每个元素都是一个含有 `m` 个 0 的 `vector<int>`。之后用 `g[i][j]` 访问，和二维数组完全一样。

> [!注意] `size()` 的返回值不能是负数
> `v.size()` 的类型是无符号整数。当向量为空时，`v.size()-1` 并不会得到 -1，而是一个极大的数（在 64 位环境中是 18446744073709551615）：
>
> ```cpp frag
> vector<int> v;
> cout<<v.size()-1<<endl;
> ```
>
> ```output
> 18446744073709551615
> ```
>
> 凡是需要用 `size()` 做减法的地方，先把它转成 `int`：`(int)v.size()-1`。

> [!竞赛] 什么时候用 vector，什么时候用数组
> 数据范围固定、追求最快速度时，全局数组足够；元素个数事先不知道、需要反复增删，或者要在函数之间传来传去时，`vector` 更省心。传参时记得加引用，免得复制整个向量。

> [!小结]
> `vector` 是可以自动扩容的数组：用 `push_back` 追加，用下标访问，用范围 `for` 遍历。只在末尾增删最快；`size()` 是无符号数，做减法前要先转成 `int`。把 `vector` 套在 `vector` 里，就得到了行列数都可变的二维表格。
