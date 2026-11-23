# 查找、统计与部分排序

> [!目标]
> - 会用 `find`、`find_if` 查找元素，并正确处理“没找到”的情况
> - 会用 `count`、`any_of`、`all_of` 统计与判断，用 `max_element` 一类的函数找最值的位置
> - 理解 `nth_element`、`partial_sort` 为什么比完整排序更快，会用它们求第 k 小的数和前 k 小的数

## 查找：find 与 find_if

`find(first,last,x)` 在区间里顺序查找等于 `x` 的元素，找到就返回指向它的迭代器，找不到返回 `last`。`find_if` 的参数是一个条件，查找第一个满足条件的元素。两者都是从头到尾逐个检查，所需时间与长度成正比。

```cpp title="find.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={3,8,2,5,4,7};
    auto it=find(v.begin(),v.end(),5);
    if (it!=v.end()){
        cout<<"5 在下标 "<<it-v.begin()<<endl;
    }
    auto jt=find_if(v.begin(),v.end(),[](int x){
        return x>6;
    });
    cout<<"第一个大于 6 的数是 "<<*jt<<endl;
    cout<<(find(v.begin(),v.end(),99)==v.end()?"没有 99":"有 99")<<endl;
    string s="hello world";
    cout<<"o 第一次出现在 "<<find(s.begin(),s.end(),'o')-s.begin()<<endl;
    return 0;
}
```

```output
5 在下标 3
第一个大于 6 的数是 8
没有 99
o 第一次出现在 4
```

这里再次提醒：使用返回值之前，必须与 `end()` 比较，确认真的找到了。对已经排好序的序列，应该用 `lower_bound` 二分查找，速度比 `find` 快得多。

## 计数与条件判断

`count(first,last,x)` 统计等于 `x` 的元素个数，`count_if` 统计满足条件的个数。如果只关心“有没有”，可以使用 `any_of`（至少有一个满足）、`all_of`（全部满足）和 `none_of`（没有一个满足），它们一发现结果已经确定就会立刻停止。

```cpp title="count.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={1,2,2,3,2,4,5,6};
    cout<<count(v.begin(),v.end(),2)<<endl;
    cout<<count_if(v.begin(),v.end(),[](int x){
        return x%2==0;
    })<<endl;
    cout<<any_of(v.begin(),v.end(),[](int x){
        return x>5;
    })<<endl;
    cout<<all_of(v.begin(),v.end(),[](int x){
        return x>0;
    })<<endl;
    cout<<none_of(v.begin(),v.end(),[](int x){
        return x<0;
    })<<endl;
    return 0;
}
```

```output
3
5
1
1
1
```

## 最大值与最小值的位置

之前的 `max`、`min` 比较的是两个值。要在一个序列里找最大、最小的元素，用的是 `max_element` 和 `min_element`，它们返回的是**迭代器**，既能取到值，又能换算出下标。`minmax_element` 一次扫描同时给出最小值和最大值的位置。

```cpp title="max_element.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={4,9,2,7,9,1};
    auto mx=max_element(v.begin(),v.end());
    auto mn=min_element(v.begin(),v.end());
    cout<<"最大值 "<<*mx<<"，下标 "<<mx-v.begin()<<endl;
    cout<<"最小值 "<<*mn<<"，下标 "<<mn-v.begin()<<endl;
    auto p=minmax_element(v.begin(),v.end());
    cout<<*p.first<<" "<<*p.second<<endl;
    return 0;
}
```

```output
最大值 9，下标 1
最小值 1，下标 5
1 9
```

最大值 9 出现了两次，`max_element` 返回的是第一个，下标 1；而 `minmax_element` 对于最大值返回的是最后一个，这是标准里规定的细微差别，需要精确位置时不要依赖它。

## 相邻重复与子序列查找

`adjacent_find` 查找第一对相邻且相等的元素，在检查“有没有挨着的重复”时很方便。`search` 在一个序列里查找另一个序列第一次出现的位置，相当于把 `string::find` 推广到了任意容器。`for_each` 对每个元素执行一个函数，不过多数时候，直接用范围 `for` 更直观。

```cpp title="adjacent.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={1,2,3,3,4,5};
    auto it=adjacent_find(v.begin(),v.end());
    if (it!=v.end()){
        cout<<"相邻重复的数是 "<<*it<<"，下标 "<<it-v.begin()<<endl;
    }
    vector<int> pat={3,4,5};
    auto p=search(v.begin(),v.end(),pat.begin(),pat.end());
    cout<<"子序列从下标 "<<p-v.begin()<<" 开始"<<endl;
    for_each(v.begin(),v.end(),[](int x){
        cout<<x*x<<" ";
    });
    cout<<endl;
    return 0;
}
```

```output
相邻重复的数是 3，下标 2
子序列从下标 3 开始
1 4 9 9 16 25 
```

## 部分排序：只要前 k 个，或者只要第 k 个

要找出第 k 小的数，有一种笨办法是把整个数组排好序再取下标 k。但这样做的工作量比需要的多：只想知道第 k 小，没必要把其他的数也排得井井有条。`nth_element(first,nth,last)` 只保证一件事：执行之后，`nth` 位置上就是排好序时应当在那里的那个数，它前面的数都不大于它，后面的都不小于它，但前后两部分内部并没有排序。它的平均时间是 O(n)，比完整排序的 O(n log n) 快。

```cpp title="nth_element.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={3,8,2,5,4,7,6,1,9};
    nth_element(v.begin(),v.begin()+4,v.end());
    cout<<"第 5 小的数是 "<<v[4]<<endl;
    vector<int> w={9,1,8,2,7,3,6,4,5};
    nth_element(w.begin(),w.begin()+2,w.end(),greater<int>());
    cout<<"第 3 大的数是 "<<w[2]<<endl;
    return 0;
}
```

```output
第 5 小的数是 5
第 3 大的数是 7
```

下标从 0 开始，所以第 5 小对应的是 `v.begin()+4`。第三个参数可以传比较规则，这里用 `greater<int>()` 把“小”的含义反过来，得到的就是第 3 大。

如果需要前 k 个元素并且要求它们是有序的，用 `partial_sort(first,mid,last)`：它保证 `[first,mid)` 是整个区间里最小的那些元素，并且已经排好序，后面的部分顺序不作保证。

```cpp title="partial_sort.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={5,2,9,1,7,3,8};
    partial_sort(v.begin(),v.begin()+3,v.end());
    for (int i=0;i<3;i++){
        cout<<v[i]<<" ";
    }
    cout<<endl;
    cout<<is_sorted(v.begin(),v.end())<<endl;
    return 0;
}
```

```output
1 2 3 
0
```

前三个数是整个序列里最小的三个，已经排好了；但整个序列并没有排好，所以 `is_sorted` 的结果是 0。

## 字典序比较

`lexicographical_compare` 按字典序比较两个序列，第一个序列更小时返回 `true`。字符串的 `<` 运算符，`vector` 的 `<` 运算符，背后都是它。

```cpp title="lex.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> a={1,2,3},b={1,2,4};
    cout<<lexicographical_compare(a.begin(),a.end(),b.begin(),b.end())<<endl;
    cout<<(a<b)<<" "<<(string("apple")<string("banana"))<<endl;
    return 0;
}
```

```output
1
1 1
```

> [!竞赛] 求第 k 小或第 k 大的数，用 `nth_element` 比排序更快，洛谷上的“第 k 小的数”正是这类题目的典型。统计满足条件的个数，`count_if` 一行就能写完。`max_element` 配合下标换算，常用来寻找最大值所在的位置。

> [!思考] `nth_element` 之后，为什么不能说 `v[0]` 到 `v[3]` 是最小的四个数并且已经排好序？

> [!答案] 参考思路
> 它们确实都不大于 `v[4]`，所以确实是最小的那些数，但它们之间的顺序没有被整理，`nth_element` 并不保证这一点。要让它们有序，应该使用 `partial_sort`，或者对这一段再调用一次 `sort`。

> [!小结]
> `find`、`find_if` 顺序查找并返回迭代器，没找到时是 `end()`；`count` 系列统计个数，`any_of`、`all_of`、`none_of` 判断条件；`max_element` 系列返回最值的位置；`nth_element` 以 O(n) 的平均时间找到第 k 个数，`partial_sort` 给出有序的前 k 个。
