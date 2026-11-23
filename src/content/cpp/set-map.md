# set 与 map

> [!目标]
> - 理解 `set` 的特点：自动去重，并且始终保持有序
> - 理解 `map` 的特点：用“键”找到对应的“值”
> - 会用它们完成去重、统计出现次数、判断某个元素有没有出现过

## set：一个自动去重又自动排序的集合

数学里的集合有两个特点：元素不重复，元素之间没有顺序。C++ 的 `set` 在此基础上多做了一步，它始终把元素**按从小到大的顺序**放好。所以往 `set` 里不断插入数据，最后遍历一遍，得到的就是“去重之后再排序”的结果。

```cpp title="set.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n;
    cin>>n;
    set<int> s;
    for (int i=0;i<n;i++){
        int x;
        cin>>x;
        s.insert(x);
    }
    for (int x:s){
        cout<<x<<" ";
    }
    cout<<endl;
    return 0;
}
```

```input
5
3 1 3 2 1
```

```output
1 2 3
```

这正是洛谷“明明的随机数”这类题目要做的事。常用的操作有：

| 写法 | 作用 |
| :-- | :-- |
| `s.insert(x)` | 插入 `x`，已经存在则什么也不做 |
| `s.erase(x)` | 删除 `x` |
| `s.count(x)` | `x` 在集合里返回 1，不在返回 0 |
| `s.find(x)` | 找到则返回指向它的迭代器，找不到返回 `s.end()` |
| `s.size()`、`s.empty()` | 元素个数、是否为空 |
| `s.begin()`、`s.rbegin()` | 最小的元素、最大的元素（要加 `*` 取值） |
| `s.lower_bound(x)` | 第一个大于等于 `x` 的元素 |

```cpp frag
set<int> s={5,1,3};
s.insert(3);
s.erase(1);
cout<<s.size()<<" "<<s.count(5)<<" "<<s.count(1)<<endl;
cout<<*s.begin()<<" "<<*s.rbegin()<<endl;
auto it=s.lower_bound(4);
cout<<*it<<endl;
```

```output
2 1 0
3 5
5
```

插入重复的 3 没有任何效果，删除 1 之后集合里剩下 `{3,5}`。`lower_bound(4)` 找到第一个不小于 4 的元素，也就是 5。`set` 内部是平衡的树，所以插入、删除、查找都是 O(log n)。

> [!注意] 想要二分查找，别对 set 使用全局的 `lower_bound`
> `set` 本身带有 `lower_bound` 成员函数，要写成 `s.lower_bound(x)`。如果写成 `lower_bound(s.begin(),s.end(),x)`，它会退化成逐个检查，速度就慢了。

## map：键值对

有时需要的不是“某个值在不在”，而是“某个值对应着什么”：一个单词出现了几次，一个学号对应哪个名字。`map` 就是为这种场景准备的，它保存的每一项由两部分组成：**键**（key）和**值**（value），通过键就能快速找到对应的值。和 `set` 一样，它也按键排好序。

最经典的用法是统计次数：

```cpp title="freq.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n;
    cin>>n;
    map<string,int> mp;
    for (int i=0;i<n;i++){
        string w;
        cin>>w;
        mp[w]++;
    }
    for (auto &p:mp){
        cout<<p.first<<" "<<p.second<<endl;
    }
    return 0;
}
```

```input
6
apple banana apple cherry banana apple
```

```output
apple 3
banana 2
cherry 1
```

`mp[w]++` 做了两件事：如果 `w` 这个键还不存在，`map` 会先自动创建它并把值设为 0，然后再加 1。遍历时每一项是一个 `pair`，`p.first` 是键，`p.second` 是值，而且是按键从小到大的顺序。

这个“不存在就自动创建”的特性很方便，但也带来一个容易忽略的副作用：**只是用 `mp[k]` 去查询，也会把 `k` 加进去**。如果只想判断一个键存不存在，用 `count`：

```cpp frag
map<string,int> mp;
mp["a"]=1;
cout<<mp.count("a")<<" "<<mp.count("b")<<endl;
cout<<mp["b"]<<" "<<mp.size()<<endl;
```

```output
1 0
0 2
```

最后一行说明了问题：我们只是想看看 `mp["b"]` 是多少，结果 `b` 被偷偷加了进去，`size()` 变成了 2。

同样的写法也适用于统计字符。比如数一数 `hello` 里每个字母各出现几次：

```cpp frag
string s="hello";
map<char,int> mp;
for (char c:s){
    mp[c]++;
}
for (auto &p:mp){
    cout<<p.first<<p.second<<" ";
}
cout<<endl;
```

```output
e1 h1 l2 o1
```

## 几种容器的对比

| 容器 | 有序吗 | 能重复吗 | 查找速度 |
| :-- | :-: | :-: | :-: |
| `set` | 有序 | 不能 | O(log n) |
| `multiset` | 有序 | 能 | O(log n) |
| `map` | 按键有序 | 键不能重复 | O(log n) |
| `unordered_set`、`unordered_map` | 无序 | 同上 | 平均 O(1) |

名字前面带 `unordered` 的版本不关心顺序，用哈希来查找，平均速度更快；但遍历出来的顺序是不确定的。如果只需要判断“有没有”，不在乎顺序，可以优先考虑它们。

> [!竞赛] 统计次数和判断是否出现过，是 map 和 set 最常见的两个用途
> 当数据的取值范围很大（比如 10⁹），没法开一个那么大的数组做计数时，用 `map` 就能解决：它只会为真正出现过的值占用空间。

> [!小结]
> `set` 自动去重并保持有序，适合“去重加排序”和“判断是否出现过”。`map` 用键找值，适合统计次数和建立对应关系，访问 `mp[k]` 时如果键不存在会自动创建，只想判断是否存在时请用 `count`。
