# 优先队列

> [!目标]
> - 理解优先队列“每次取出最大（或最小）的元素”的含义，会写大根堆和小根堆
> - 会为 `pair` 和结构体设置优先规则，并清楚 `priority_queue` 比较规则的方向与 `sort` 相反
> - 了解堆的基本原理，会用 `make_heap` 等函数在 `vector` 上操作堆

## 总是先处理最重要的

普通队列严格按照来的先后顺序处理。但现实里常常需要“最紧急的先办”：急诊室先看病情最重的，调度器先运行优先级最高的任务。优先队列（`priority_queue`）就是这样的容器：不管元素以什么顺序放进去，每次取出的总是当前“最大”的那个。

```cpp title="pq_basic.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    priority_queue<int> q;
    q.push(30);
    q.push(20);
    q.emplace(50);
    q.push(10);
    cout<<"大的优先：";
    while (!q.empty()){
        cout<<q.top()<<" ";
        q.pop();
    }
    cout<<endl;
    priority_queue<int,vector<int>,greater<int>> p;
    p.push(30);
    p.push(20);
    p.emplace(50);
    p.push(10);
    cout<<"小的优先：";
    while (!p.empty()){
        cout<<p.top()<<" ";
        p.pop();
    }
    cout<<endl;
    return 0;
}
```

```output
大的优先：50 30 20 10 
小的优先：10 20 30 50 
```

默认情况下，`priority_queue<int>` 是**大根堆**，`top()` 是最大的。想要每次取最小的，需要写成 `priority_queue<int,vector<int>,greater<int>>`，一共三个模板参数：元素类型、底层容器、比较规则。`push` 和 `emplace` 都能放入元素，`emplace` 可以直接把构造参数交给容器，省去创建临时对象。

它的操作与 `stack` 相似：`top` 看最优先的元素，`pop` 弹出，`push` 放入，`size` 与 `empty` 查询。同样没有迭代器，也不能修改中间的元素。

## 用 pair 和结构体作为元素

`pair` 的比较规则是先比第一项，第一项相同再比第二项，所以 `priority_queue<pair<int,int>>` 可以直接使用。最短路算法里经常放入 `(距离, 结点)` 这样的对子，用 `greater` 让距离小的先出来。

```cpp title="pq_pair.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    priority_queue<pair<int,int>,vector<pair<int,int>>,greater<pair<int,int>>> q;
    q.push({5,1});
    q.push({2,7});
    q.push({2,3});
    q.push({9,4});
    while (!q.empty()){
        cout<<q.top().first<<" "<<q.top().second<<endl;
        q.pop();
    }
    return 0;
}
```

```output
2 3
2 7
5 1
9 4
```

对于结构体，可以重载 `<`，也可以在第三个模板参数里传入自己写的比较规则。下面的任务有“优先级”和“名字”，规定优先级高的先处理，优先级相同时名字按字母顺序靠前的先处理。

```cpp title="pq_struct.cpp"
#include <bits/stdc++.h>
using namespace std;
struct Task{
    int level;
    string name;
};
struct Cmp{
    bool operator()(const Task &a,const Task &b) const{
        if (a.level!=b.level) return a.level<b.level;
        return a.name>b.name;
    }
};
int main(){
    priority_queue<Task,vector<Task>,Cmp> q;
    q.push({2,"homework"});
    q.push({5,"medicine"});
    q.push({2,"laundry"});
    q.push({3,"meeting"});
    while (!q.empty()){
        cout<<q.top().level<<" "<<q.top().name<<endl;
        q.pop();
    }
    return 0;
}
```

```output
5 medicine
3 meeting
2 homework
2 laundry
```

这里有一个初学者几乎都会踩的坑：`priority_queue` 的比较规则的方向与 `sort` 恰好相反。`sort` 里的比较函数返回 `true` 表示“`a` 应该排在 `b` 前面”；而 `priority_queue` 里返回 `true` 表示“`a` 的优先级比 `b` 低，`b` 应该更靠近堆顶”。所以上面写 `a.level<b.level`，才是等级大的先出来。记不住时，可以这样想：`priority_queue` 默认使用 `<`，默认弹出最大的，让 `<` 为真的一方沉到下面。

## 堆是怎么工作的

`priority_queue` 的底层是一个**堆**：把元素放在数组里，并把数组看成一棵完全二叉树，下标为 `i` 的结点的两个孩子是 `2i+1` 和 `2i+2`。大根堆要求每个结点都不小于它的孩子，这样根结点永远是最大的。

插入时先放在数组末尾，如果它比父结点大，就和父结点交换，一路“上浮”直到合适的位置；弹出时把末尾的元素换到根的位置，再让它与较大的孩子交换，一路“下沉”。两个操作都只沿着一条从根到叶的路径走，所以复杂度是 O(log n)，而查看最大值只需要访问根，是 O(1)。

标准库还提供了直接在 `vector` 上操作堆的函数：`make_heap` 把数组整理成堆，`push_heap` 和 `pop_heap` 分别在末尾加入、取出元素之后维护堆，`sort_heap` 把堆变成有序序列。

```cpp title="heap_funcs.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    vector<int> v={3,1,4,1,5,9,2,6};
    make_heap(v.begin(),v.end());
    cout<<v.front()<<endl;
    pop_heap(v.begin(),v.end());
    v.pop_back();
    cout<<v.front()<<endl;
    v.push_back(10);
    push_heap(v.begin(),v.end());
    cout<<v.front()<<endl;
    sort_heap(v.begin(),v.end());
    for (int x:v){
        cout<<x<<" ";
    }
    cout<<endl;
    return 0;
}
```

```output
9
6
10
1 1 2 3 4 5 6 10 
```

`pop_heap` 并不会真的删除元素，而是把最大的那个移到末尾，所以还要自己 `pop_back`。直接使用 `priority_queue` 更省心，只有在需要访问堆里的全部元素时，才会选择这些函数。

## 一个典型的应用：合并果子

有 n 堆果子，每次可以把两堆合并成一堆，消耗的体力等于两堆重量之和。要把所有果子合并成一堆，怎样安排才能使总消耗最小？贪心的做法是每次都合并当前最轻的两堆，这样重量较大的堆参与合并的次数更少。“取出最小的两个，再把它们的和放回去”，正是小根堆最擅长的事。

```cpp title="merge_fruits.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n;
    cin>>n;
    priority_queue<int,vector<int>,greater<int>> q;
    for (int i=0;i<n;i++){
        int x;
        cin>>x;
        q.push(x);
    }
    int cost=0;
    while (q.size()>1){
        int a=q.top();
        q.pop();
        int b=q.top();
        q.pop();
        cost+=a+b;
        q.push(a+b);
    }
    cout<<cost<<endl;
    return 0;
}
```

```input
3
1 2 9
```

```output
15
```

先合并 1 和 2，消耗 3；再合并 3 和 9，消耗 12，总共 15。如果先合并 2 和 9，则要 11 加 12，共 23，更差。

> [!竞赛] 优先队列是 Dijkstra 最短路、合并果子、任务调度、求前 k 大的数、中位数（用两个堆）等题目的标配。大根堆的 `priority_queue<int>` 最短，小根堆要记得写全三个参数，或者把数取负数放进去。

> [!思考] 如果要求一个数据流里的前 3 大元素，应该用大根堆还是小根堆？

> [!答案] 参考思路
> 用小根堆，并让它始终只保留 3 个元素：新元素进来时先放入，堆的大小超过 3 就弹出堆顶（即当前最小的）。这样留下的恰好是最大的三个，每个元素的处理代价只有 O(log 3)。

> [!小结]
> `priority_queue` 每次取出“最大”的元素，默认是大根堆，`greater` 让它变成小根堆。比较规则的方向与 `sort` 相反：返回 `true` 表示 `a` 的优先级更低。堆用数组存放完全二叉树，插入上浮、弹出下沉，都是 O(log n)。
