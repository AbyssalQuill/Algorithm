# 链表：list 与 forward_list

> [!目标]
> - 理解链表与数组在存储方式上的区别，以及这带来的优缺点
> - 会使用 `list` 的常用操作，包括 `sort`、`merge`、`unique`、`remove_if`
> - 了解单向链表 `forward_list`，并能手写一个最简单的单链表

## 数组连续，链表串联

`vector` 把元素放在一整块连续的内存里，所以能凭下标直接找到第几个元素；代价是在中间插入或删除时，后面的元素都要整体移动。**链表**换了一种思路：每个元素单独占一个“结点”，结点里除了数据，还记着下一个结点的位置，整条链表靠这些位置串联起来。要在中间插入，只需要改几个位置，不用搬动任何元素；而要找第 k 个元素，却只能从头一个一个数过去。

标准库里的 `list` 是**双向链表**：每个结点既记着后一个，也记着前一个，所以两个方向都能走。

```cpp title="list_ops.cpp"
#include <bits/stdc++.h>
using namespace std;
void show(const list<int> &l){
    for (int x:l){
        cout<<x<<" ";
    }
    cout<<endl;
}
int main(){
    list<int> lst={5,3,8,3,1,9,5,5};
    lst.push_back(11);
    lst.push_front(0);
    show(lst);
    lst.pop_back();
    lst.pop_front();
    lst.reverse();
    show(lst);
    lst.sort();
    show(lst);
    lst.unique();
    show(lst);
    lst.remove(5);
    show(lst);
    lst.remove_if([](int x){
        return x%2==0;
    });
    show(lst);
    return 0;
}
```

```output
0 5 3 8 3 1 9 5 5 11 
5 5 9 1 3 8 3 5 
1 3 3 5 5 5 8 9 
1 3 5 8 9 
1 3 8 9 
1 3 9 
```

`push_front`、`push_back`、`pop_front`、`pop_back` 在两端操作，和 `deque` 类似。后面的几个是 `list` 特有的成员函数：`reverse` 反转，`sort` 排序，`unique` 删除**相邻**的重复元素（所以要先排序），`remove(x)` 删除所有等于 `x` 的元素，`remove_if` 删除满足条件的元素。

这里有一个细节：`list` 不能使用 `sort(lst.begin(),lst.end())`，因为那个函数要求迭代器可以随机访问，而链表的迭代器只能一步一步地移动，所以 `list` 把排序做成了自己的成员函数。`remove` 也一样，成员版本会真的删除结点，不需要再配合 `erase`。

## 在中间插入与删除

链表真正的优势，是在已知位置上插入或删除时只需要常数时间，并且不会让其他位置的迭代器失效。

```cpp title="list_insert.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    list<int> lst={1,2,4,5};
    auto it=lst.begin();
    advance(it,2);
    lst.insert(it,3);
    for (int x:lst){
        cout<<x<<" ";
    }
    cout<<endl;
    it=lst.erase(it);
    cout<<*it<<endl;
    list<int> other={7,8,9};
    lst.splice(lst.end(),other);
    for (int x:lst){
        cout<<x<<" ";
    }
    cout<<endl;
    cout<<other.size()<<endl;
    return 0;
}
```

```output
1 2 3 4 5 
5
1 2 3 5 7 8 9
0
```

`insert(it,3)` 把 3 插到 `it` 所指元素的前面。`erase(it)` 删除元素并返回后一个位置的迭代器，所以 `*it` 变成了 5。最后的 `splice` 是链表的绝招：它把另一个链表的结点直接“拼接”过来，没有复制任何元素，原来的 `other` 就变成了空的。

两个已经排好序的链表，可以用 `merge` 合并成一个有序的链表，同样不会复制元素。

```cpp title="list_merge.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    list<int> a={1,4,7},b={2,3,8,9};
    a.merge(b);
    for (int x:a){
        cout<<x<<" ";
    }
    cout<<endl;
    list<list<int>> grid={{1,2,3},{4,5,6}};
    cout<<grid.front().front()<<" "<<grid.back().back()<<endl;
    return 0;
}
```

```output
1 2 3 4 7 8 9 
1 6
```

`list` 也可以嵌套，`list<list<int>>` 是链表的链表，访问内层元素要一层一层地使用 `front()`、`back()` 或者迭代器。

## 单向链表 forward_list

如果只需要朝一个方向走，可以选用 `forward_list`，它是单向链表，每个结点少存一个位置，更省空间。代价是功能少一些：没有 `size()`，没有 `push_back`，插入和删除只能在某个位置的“后面”进行。

```cpp title="forward_list.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    forward_list<int> f={2,3,4};
    f.push_front(1);
    auto it=f.begin();
    f.insert_after(it,10);
    for (int x:f){
        cout<<x<<" ";
    }
    cout<<endl;
    f.erase_after(f.begin());
    for (int x:f){
        cout<<x<<" ";
    }
    cout<<endl;
    return 0;
}
```

```output
1 10 2 3 4 
1 2 3 4 
```

## 手写一个单链表

标准库的链表很少在比赛里出现，但链表这种结构本身非常重要，很多题目、很多数据结构（比如图的邻接表、哈希表的拉链法）都建立在它的基础之上，所以值得亲手写一次。结点由数据和指向下一个结点的指针组成。

```cpp title="my_list.cpp"
#include <bits/stdc++.h>
using namespace std;
struct Node{
    int val;
    Node *next;
    Node(int v,Node *n=nullptr): val(v), next(n){}
};
void print(Node *head){
    for (Node *p=head;p!=nullptr;p=p->next){
        cout<<p->val<<" ";
    }
    cout<<endl;
}
Node* reverseList(Node *head){
    Node *prev=nullptr;
    while (head!=nullptr){
        Node *next=head->next;
        head->next=prev;
        prev=head;
        head=next;
    }
    return prev;
}
int main(){
    Node *head=nullptr;
    for (int i=5;i>=1;i--){
        head=new Node(i,head);
    }
    print(head);
    head=reverseList(head);
    print(head);
    while (head!=nullptr){
        Node *next=head->next;
        delete head;
        head=next;
    }
    return 0;
}
```

```output
1 2 3 4 5 
5 4 3 2 1 
```

在表头插入最方便：新结点的 `next` 指向原来的头结点，再把头指针指向新结点。所以循环里从 5 倒着插到 1，得到的链表是 `1 2 3 4 5`。反转链表的做法是让每个结点的 `next` 改为指向它前面的那个结点，用 `prev`、`head`、`next` 三个指针依次向前推进。最后别忘了逐个 `delete` 释放结点，否则会造成内存泄漏。

> [!竞赛] 数据量大的时候，`vector` 通常比 `list` 快得多，因为连续的内存对缓存更友好，所以只有真正需要频繁地在中间插入、删除，并且已经拿着迭代器的时候，才考虑 `list`。比赛里更多是用数组下标模拟链表，比如邻接表里的 `next[]` 数组，既快又不用担心释放。

> [!思考] 为什么 `list` 不提供 `lst[3]` 这样的下标访问？

> [!答案] 参考思路
> 链表的结点分散在内存各处，要找到第 3 个只能从头开始数。提供下标运算符会让人误以为它和数组一样快，标准库因此选择不提供，需要时用 `advance` 或者 `next` 明确地表达“要走几步”。

> [!小结]
> 链表用指针串联结点，插入删除不需要移动其他元素，但不能按下标直接访问。`list` 是双向链表，自带 `sort`、`merge`、`unique`、`remove_if` 和 `splice`；`forward_list` 是更省空间的单向链表。手写单链表的关键是理清指针的先后顺序。
