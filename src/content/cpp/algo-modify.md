# 填充、复制与删除

> [!目标]
> - 会用 `fill`、`iota`、`generate` 给序列赋值
> - 会用 `copy`、`copy_if` 复制，理解为什么要借助 `back_inserter`
> - 掌握 `remove` 与 `erase` 配合的删除方法，会用 `replace`、`rotate` 等函数修改序列

## 给序列赋值

题目里经常需要把一个序列整体设成同一个值，或者填上 1、2、3 这样有规律的数。标准库为这些场合各提供了一个函数：`fill` 全部填成同一个值，`iota` 从给定的起点开始依次加一，`generate` 则反复调用你给出的函数来产生每个元素。

```cpp title="fill.cpp"
#include <bits/stdc++.h>
using namespace std;
void show(const vector<int> &v){
    for (int x:v){
        cout<<x<<" ";
    }
    cout<<endl;
}
int main(){
    vector<int> v(5);
    fill(v.begin(),v.end(),7);
    show(v);
    iota(v.begin(),v.end(),1);
    show(v);
    int x=0;
    generate(v.begin(),v.end(),[&]{
        x+=2;
        return x;
    });
    show(v);
    return 0;
}
```

```output
7 7 7 7 7 
1 2 3 4 5 
2 4 6 8 10 
```

`iota` 的名字取自希腊字母 ι，它在初始化并查集的父结点数组（`fa[i]=i`）、生成 `0` 到 `n-1` 的下标数组时特别方便。`generate` 里的 lambda 用 `[&]` 捕获了外面的变量 `x`，每次调用都让它加 2，因此得到一个等差数列。

## 复制

`copy(a.begin(),a.end(),b.begin())` 把区间 `[a.begin(),a.end())` 的内容依次复制到从 `b.begin()` 开始的位置。`copy_if` 则只复制满足条件的元素，`copy_n` 复制指定的个数。

```cpp title="copy.cpp"
#include <bits/stdc++.h>
using namespace std;
void show(const vector<int> &v){
    for (int x:v){
        cout<<x<<" ";
    }
    cout<<endl;
}
int main(){
    vector<int> a={1,2,3,4,5,6,7,8};
    vector<int> b(a.size());
    copy(a.begin(),a.end(),b.begin());
    show(b);
    vector<int> c;
    copy_if(a.begin(),a.end(),back_inserter(c),[](int x){
        return x%2==0;
    });
    show(c);
    vector<int> d;
    copy_n(a.begin(),3,back_inserter(d));
    show(d);
    return 0;
}
```

```output
1 2 3 4 5 6 7 8 
2 4 6 8 
1 2 3 
```

复制本身不会创建空间，目标序列必须已经有足够的位置，所以第一个例子事先把 `b` 开成了和 `a` 一样大。当事先不知道会复制多少个元素时（比如 `copy_if`），可以让目标换成 `back_inserter(c)`，它会在每次写入时调用 `c.push_back`，让 `c` 自己长大。

> [!注意] 如果目标序列空间不够，`copy` 不会报错，而是直接写到数组之外，属于越界。写入一个空的 `vector` 之前，要么先指定大小，要么使用 `back_inserter`。

## 删除：remove 与 erase 配合

直觉上，`remove` 应该把元素从容器里删掉，但实际并非如此。`remove` 和 `remove_if` 只负责把**要保留的元素**依次移到序列的前面，然后返回一个迭代器，指向保留部分的末尾；容器的大小并没有改变，后面剩下的是没有意义的内容。真正缩短容器，还要再调用 `erase` 把后面那一段去掉。

```cpp title="remove.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={1,2,3,4,5,6,7,8,9,10};
    auto it=remove_if(v.begin(),v.end(),[](int x){
        return x%2==0;
    });
    cout<<"remove_if 之后的大小："<<v.size()<<endl;
    for (auto p=v.begin();p!=it;++p){
        cout<<*p<<" ";
    }
    cout<<endl;
    v.erase(it,v.end());
    cout<<"erase 之后的大小："<<v.size()<<endl;
    string s="Hello World";
    s.erase(remove_if(s.begin(),s.end(),[](char c){
        return c>='A'&&c<='Z';
    }),s.end());
    cout<<s<<endl;
    return 0;
}
```

```output
remove_if 之后的大小：10
1 3 5 7 9 
erase 之后的大小：5
ello orld
```

这种“`erase(remove_if(...),end)`”的写法太常见，几乎成了固定句式。它对 `string` 同样适用，上面最后几行就用它删掉了所有大写字母。按值删除用 `remove(v.begin(),v.end(),x)`，写法完全相同。顺带一提，C++20 提供了 `erase_if(v,条件)`，一行就能完成，但比赛环境不一定支持，所以仍然要熟悉上面的写法。

## 替换

`replace` 把序列里等于某个值的元素全部换成新值，`replace_if` 则替换满足条件的元素，两者都直接修改原序列。

```cpp title="replace.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={1,2,1,3,1,8,9};
    replace(v.begin(),v.end(),1,0);
    for (int x:v){
        cout<<x<<" ";
    }
    cout<<endl;
    replace_if(v.begin(),v.end(),[](int x){
        return x>5;
    },5);
    for (int x:v){
        cout<<x<<" ";
    }
    cout<<endl;
    string s="hello world";
    replace(s.begin(),s.end(),'o','0');
    cout<<s<<endl;
    return 0;
}
```

```output
0 2 0 3 0 8 9 
0 2 0 3 0 5 5 
hell0 w0rld
```

## 旋转、交换与打乱

`rotate(first,mid,last)` 把区间循环移位，使 `mid` 指向的元素成为新的第一个元素。它实现的是“把前面的若干个元素挪到末尾”这样的循环左移。`swap_ranges` 交换两个等长区间的内容，前面学过的 `reverse` 则是整体反转。

```cpp title="rotate.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={1,2,3,4,5};
    rotate(v.begin(),v.begin()+2,v.end());
    for (int x:v){
        cout<<x<<" ";
    }
    cout<<endl;
    vector<int> a={1,2,3},b={7,8,9};
    swap_ranges(a.begin(),a.end(),b.begin());
    cout<<a[0]<<" "<<b[0]<<endl;
    return 0;
}
```

```output
3 4 5 1 2 
7 1
```

`shuffle` 可以把序列随机打乱，需要提供一个随机数引擎，比如 `mt19937`：

```cpp frag
vector<int> v={1,2,3,4,5};
mt19937 rng(2024);
shuffle(v.begin(),v.end(),rng);
```

自 C++17 起，老式的 `random_shuffle` 已被移除，应当使用 `shuffle`。打乱的具体结果与编译器的实现有关，不要依赖它与某个固定的输出一致。

> [!竞赛] 去重的完整写法是先 `sort`，再 `v.erase(unique(v.begin(),v.end()),v.end())`；`iota` 常用来初始化并查集和下标数组；清空二维数组时 `fill` 比逐个循环更简洁。名字里带 `_copy` 的版本，如 `remove_copy`、`replace_copy`、`unique_copy`，会把结果写到另一处而不改动原序列。

> [!思考] 执行 `remove_if` 之后，容器的 `size()` 为什么没有变小？

> [!答案] 参考思路
> `remove_if` 只接收一对迭代器，它没有办法访问容器本身，因此无法改变容器的大小，只能把保留的元素移到前面，再把新的末尾位置告诉你。容器要缩短，必须由持有它的 `erase` 来完成。

> [!小结]
> `fill`、`iota`、`generate` 为序列赋值；`copy` 系列复制，目标空间不够时借助 `back_inserter`；`remove` 系列只是把保留的元素移到前面，要配合 `erase` 才真正删除；`replace` 系列直接替换，`rotate` 做循环移位，`shuffle` 随机打乱。
