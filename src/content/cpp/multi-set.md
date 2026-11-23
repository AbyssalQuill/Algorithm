# multiset、multimap 与集合运算

> [!目标]
> - 会使用允许重复元素的 `multiset` 和 `multimap`，清楚 `erase(x)` 与 `erase(it)` 的区别
> - 会用 `equal_range` 取出同一个键对应的全部元素
> - 会用 `set_union`、`set_intersection`、`set_difference` 对有序序列做集合运算，并知道哈希容器 `unordered_map` 的用法

## multiset：允许重复的 set

`set` 里每个值只能出现一次，插入重复的值会被忽略。`multiset` 同样自动排序，但允许相同的值出现多次，适合需要“保持有序，同时记录重复”的场合。

```cpp title="multiset.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    multiset<int> s;
    s.insert(3);
    s.insert(1);
    s.insert(4);
    s.insert(4);
    s.insert(4);
    for (int x:s){
        cout<<x<<" ";
    }
    cout<<endl;
    cout<<"4 出现了 "<<s.count(4)<<" 次"<<endl;
    s.erase(s.find(4));
    cout<<"删除一个 4 之后："<<s.count(4)<<" 次"<<endl;
    s.erase(4);
    cout<<"删除全部 4 之后："<<s.count(4)<<" 次，大小 "<<s.size()<<endl;
    return 0;
}
```

```output
1 3 4 4 4 
4 出现了 3 次
删除一个 4 之后：2 次
删除全部 4 之后：0 次，大小 2
```

这里藏着最重要的区别：`s.erase(4)` 把**所有**等于 4 的元素全部删掉；如果只想删掉一个，要先用 `find` 找到一个位置，再用 `erase(迭代器)`，就像第一次删除那样。`multiset` 的 `count` 也不再只返回 0 或 1，而是实际出现的次数。

`lower_bound` 和 `upper_bound` 对 `multiset` 同样可用，配合起来可以取出一段相等的元素：`lower_bound(x)` 指向第一个不小于 `x` 的元素，`upper_bound(x)` 指向第一个大于 `x` 的元素。

```cpp title="multiset_bound.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    multiset<int> s={1,3,3,5,7,7,7,9};
    auto lo=s.lower_bound(7);
    auto hi=s.upper_bound(7);
    cout<<distance(lo,hi)<<endl;
    auto it=s.lower_bound(4);
    cout<<*it<<endl;
    cout<<*s.begin()<<" "<<*s.rbegin()<<endl;
    s.erase(s.begin());
    cout<<*s.begin()<<endl;
    return 0;
}
```

```output
3
5
1 9
3
```

`*s.begin()` 是当前的最小值，`*s.rbegin()` 是最大值，删除最小值再取 `begin()`，就是次小值。这让 `multiset` 成了一个“可以同时取最小和最大、还能任意删除”的容器，比 `priority_queue` 灵活，代价是每次操作稍慢一些。

## multimap：一个键对应多个值

`map` 里一个键只对应一个值。`multimap` 允许同一个键出现多次，所以不再提供 `mp[key]` 的写法（不知道该返回哪一个）。要取出某个键的全部值，用 `equal_range`，它返回一对迭代器，围起了所有键等于给定值的元素。

```cpp title="multimap.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    multimap<int,string> mp;
    mp.insert({1,"apple"});
    mp.insert({2,"banana"});
    mp.insert({4,"pear"});
    mp.insert({4,"grape"});
    mp.insert({5,"grape"});
    auto range=mp.equal_range(4);
    for (auto it=range.first;it!=range.second;++it){
        cout<<it->first<<"->"<<it->second<<endl;
    }
    for (auto it=mp.begin();it!=mp.end();){
        if (it->second=="grape"){
            it=mp.erase(it);
        }else{
            ++it;
        }
    }
    for (auto &p:mp){
        cout<<p.first<<"->"<<p.second<<endl;
    }
    return 0;
}
```

```output
4->pear
4->grape
1->apple
2->banana
4->pear
```

后一个循环删除所有值为 `grape` 的元素，写法与上一课 `vector` 里边遍历边删除相同：`erase` 返回下一个位置，没有删除时才 `++it`。很多时候，用 `map<int,vector<string>>`（一个键对应一个数组）能够更方便地表达同样的意思，也不用学习 `equal_range`。

## 集合运算

两个集合的并集、交集、差集，标准库用 `set_union`、`set_intersection`、`set_difference` 提供。它们要求两个输入区间都已经排好序，结果写到第三个位置，所以和 `copy` 一样需要一个合适的“出口”，对 `set` 来说用 `inserter`，对 `vector` 来说用 `back_inserter`。

```cpp title="set_ops.cpp"
#include <bits/stdc++.h>
using namespace std;
void show(const string &name,const set<int> &s){
    cout<<name<<"：";
    for (int x:s){
        cout<<x<<" ";
    }
    cout<<endl;
}
int main(){
    set<int> a={1,2,3,4,5,6};
    set<int> b={2,4,6,8,10};
    set<int> u,i,d,x;
    set_union(a.begin(),a.end(),b.begin(),b.end(),inserter(u,u.begin()));
    set_intersection(a.begin(),a.end(),b.begin(),b.end(),inserter(i,i.begin()));
    set_difference(a.begin(),a.end(),b.begin(),b.end(),inserter(d,d.begin()));
    set_symmetric_difference(a.begin(),a.end(),b.begin(),b.end(),inserter(x,x.begin()));
    show("并集",u);
    show("交集",i);
    show("差集 a-b",d);
    show("对称差",x);
    return 0;
}
```

```output
并集：1 2 3 4 5 6 8 10 
交集：2 4 6 
差集 a-b：1 3 5 
对称差：1 3 5 8 10 
```

对称差是只属于其中一个集合的元素。这些函数同样适用于排好序的 `vector`，把输出换成 `back_inserter(vec)` 即可。要特别留意的是，输入必须已经有序，否则结果没有意义；`set` 本来就是有序的，所以最适合配合它们。

`set` 的排序规则也可以改变。给 `set` 增加第二个模板参数，就能得到从大到小的集合：

```cpp title="set_greater.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    set<int,greater<int>> s={3,1,2,5};
    for (int x:s){
        cout<<x<<" ";
    }
    cout<<endl;
    return 0;
}
```

```output
5 3 2 1 
```

## 哈希容器：unordered_map 与 unordered_set

`set` 和 `map` 靠红黑树维持顺序，每次操作的时间是 O(log n)。如果不关心顺序，只需要快速地“判断有没有”或者“按键存取”，可以选用基于哈希的 `unordered_set` 和 `unordered_map`，它们平均只需要 O(1)。

```cpp title="unordered.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    unordered_map<string,int> cnt;
    vector<string> words={"apple","pear","apple","fig","pear","apple"};
    for (auto &w:words){
        cnt[w]++;
    }
    cout<<cnt["apple"]<<" "<<cnt["pear"]<<" "<<cnt["fig"]<<endl;
    cout<<cnt.count("banana")<<" "<<cnt.size()<<endl;
    unordered_set<int> seen;
    int dup=-1;
    for (int x:{3,1,4,1,5,9,2,6}){
        if (!seen.insert(x).second){
            dup=x;
            break;
        }
    }
    cout<<dup<<endl;
    return 0;
}
```

```output
3 2 1
0 3
1
```

`seen.insert(x)` 返回一个 `pair`，它的 `second` 表示是否插入成功：失败说明这个值之前已经在集合里了，这是检测重复元素的一句话写法。需要注意，`unordered` 容器遍历时的顺序是不确定的，不要依赖它；遇到恶意构造的数据时，哈希表还可能退化得很慢，所以比赛里要有顺序、有区间查询需求时，仍然选择 `set` 和 `map`。

> [!竞赛] 求“动态序列里的中位数、前驱后继、第 k 小”这类问题，`multiset` 配合迭代器移动非常方便；统计次数、判断是否出现过，`unordered_map` 和 `unordered_set` 通常比 `map` 和 `set` 更快。

> [!思考] `multiset` 里有三个 4，执行 `s.erase(4)` 与 `s.erase(s.find(4))` 的结果有什么不同？

> [!答案] 参考思路
> 前者删除全部三个 4，后者只删除 `find` 找到的那一个，剩下两个。想只删除一个时，必须传迭代器。

> [!小结]
> `multiset`、`multimap` 允许重复，`erase(值)` 会删除全部相等的元素，只删一个要传迭代器；`equal_range` 取出同一个键的全部元素。`set_union` 等函数对有序序列做集合运算。不需要顺序时，`unordered_map` 和 `unordered_set` 平均 O(1)，但遍历顺序不确定。
