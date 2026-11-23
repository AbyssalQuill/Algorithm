# 栈、队列与双端队列

> [!目标]
> - 会使用 `stack`、`queue`、`deque` 的常用操作，清楚它们各自“从哪一端进、从哪一端出”
> - 知道这三种容器为什么不能遍历，以及需要遍历时怎么办
> - 理解循环队列的原理，能写出一个带容量上限的循环队列

## stack：后进先出

栈只允许在一端操作：放进去的元素压在最上面，取出的也总是最上面的那个，也就是“后进先出”。`stack` 提供的操作很少：`push` 压入，`pop` 弹出，`top` 查看栈顶，`size` 和 `empty` 查询状态。

```cpp title="stack_ops.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    stack<int> s;
    s.push(1);
    s.push(2);
    s.push(3);
    cout<<"栈大小："<<s.size()<<endl;
    cout<<"栈顶："<<s.top()<<endl;
    s.pop();
    cout<<"弹出一个之后，栈顶："<<s.top()<<endl;
    while (!s.empty()){
        s.pop();
    }
    cout<<"清空之后是否为空："<<s.empty()<<endl;
    return 0;
}
```

```output
栈大小：3
栈顶：3
弹出一个之后，栈顶：2
清空之后是否为空：1
```

有两点需要注意。第一，`pop` 只负责弹出，没有返回值，要先用 `top` 取出再 `pop`。第二，对空栈执行 `top` 或 `pop` 是未定义行为，使用之前一定要判断 `empty()`。

下面是一个经典的应用：输入一个字符串，反复删除相邻且相同的两个字符，输出最后剩下的字符串。扫描每个字符时，如果它与栈顶相同，就说明刚好构成一对，弹出栈顶；否则压入栈中。

```cpp title="stack_remove.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string s;
    cin>>s;
    stack<char> st;
    for (char c:s){
        if (!st.empty()&&st.top()==c){
            st.pop();
        }else{
            st.push(c);
        }
    }
    string res;
    while (!st.empty()){
        res+=st.top();
        st.pop();
    }
    reverse(res.begin(),res.end());
    cout<<res<<endl;
    return 0;
}
```

```input
abbaca
```

```output
ca
```

`abbaca` 中先删掉 `bb` 得到 `aaca`，再删掉 `aa` 得到 `ca`。从栈里取出的字符是倒着的，所以最后要反转一次。

其实对这道题，不一定要用 `stack`。`string` 本身就有 `back()`、`push_back()` 和 `pop_back()`，完全可以当栈来用，省去了最后倒序的步骤：

```cpp title="string_as_stack.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string s,res;
    cin>>s;
    for (char c:s){
        if (!res.empty()&&res.back()==c){
            res.pop_back();
        }else{
            res.push_back(c);
        }
    }
    cout<<res<<endl;
    return 0;
}
```

```input
abbaca
```

```output
ca
```

`vector` 同样可以充当栈，而且还能遍历和随机访问。比赛里常常用 `vector` 或者数组来模拟栈，因为需要查看栈中间的内容时，`stack` 做不到。

## queue：先进先出

队列是排队的规则：新来的在队尾，离开的从队头走，先进先出。`queue` 的主要操作是 `push` 入队，`pop` 出队，`front` 查看队头，`back` 查看队尾。

```cpp title="queue_ops.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    queue<int> q;
    q.push(1);
    q.push(2);
    q.push(3);
    cout<<"队头："<<q.front()<<"，队尾："<<q.back()<<endl;
    q.pop();
    cout<<"出队一个之后，队头："<<q.front()<<"，大小："<<q.size()<<endl;
    queue<int> copy_q(q);
    while (!copy_q.empty()){
        cout<<copy_q.front()<<" ";
        copy_q.pop();
    }
    cout<<endl;
    return 0;
}
```

```output
队头：1，队尾：3
出队一个之后，队头：2，大小：2
2 3 
```

`stack` 和 `queue` 都没有迭代器，不能直接遍历。如果想看看里面都有什么，只有两种办法：像上面那样复制一份，然后一个一个地取出来；或者一开始就用 `deque`、`vector` 这样能遍历的容器。队列在广度优先搜索里是主角，动画实验室里的“约瑟夫问题”和“迷宫最短路”都是用它完成的。

## deque：两头都能进出

双端队列（`deque`）可以在两端都高效地插入和删除，同时还保留了下标访问的能力。可以认为它是“能从头部添加元素的 `vector`”。

```cpp title="deque_ops.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    deque<int> dq;
    dq.push_back(1);
    dq.push_front(2);
    dq.push_back(3);
    dq.push_front(4);
    for (int x:dq){
        cout<<x<<" ";
    }
    cout<<endl;
    cout<<dq.front()<<" "<<dq.back()<<" "<<dq[1]<<endl;
    dq.pop_front();
    dq.pop_back();
    dq.erase(find(dq.begin(),dq.end(),1));
    for (int x:dq){
        cout<<x<<" ";
    }
    cout<<endl;
    return 0;
}
```

```output
4 2 1 3 
4 3 2
2 
```

最初插入后的顺序是 `4 2 1 3`。去掉队头 4、队尾 3 之后剩下 `2 1`，再用 `find` 找到 1 并删除，只剩 `2`。`deque` 支持遍历和下标，这是它与 `queue` 最大的区别。比赛里的“单调队列”（滑动窗口最大值）正是借助 `deque` 完成的。

## 循环队列

用数组实现队列时有一个麻烦：出队只是让队头下标向后移，前面空出来的位置再也用不上，数组很快就“满”了。办法是把数组首尾相接，下标走到末尾后绕回开头，这就是**循环队列**。

要判断队列空和满，需要区分两种情形：`head==tail` 到底是空还是满？常见的办法是故意留出一个位置不用，规定 `head==tail` 表示空，`(tail+1)%容量==head` 表示满。所以要容纳 `k` 个元素，数组需要开 `k+1` 个位置。

```cpp title="circular.cpp"
#include <bits/stdc++.h>
using namespace std;
class CircularQueue{
    vector<int> a;
    int head=0,tail=0;
public:
    CircularQueue(int k): a(k+1){}
    bool empty() const{
        return head==tail;
    }
    bool full() const{
        return (tail+1)%a.size()==head;
    }
    bool push(int x){
        if (full()) return false;
        a[tail]=x;
        tail=(tail+1)%a.size();
        return true;
    }
    bool pop(int &x){
        if (empty()) return false;
        x=a[head];
        head=(head+1)%a.size();
        return true;
    }
};
int main(){
    CircularQueue q(3);
    for (int i=1;i<=5;i++){
        cout<<(q.push(i)?"入队 ":"已满 ")<<i<<endl;
    }
    int x;
    q.pop(x);
    q.pop(x);
    cout<<"出队两个之后再入队 6："<<q.push(6)<<endl;
    while (q.pop(x)){
        cout<<x<<" ";
    }
    cout<<endl;
    return 0;
}
```

```output
入队 1
入队 2
入队 3
已满 4
已满 5
出队两个之后再入队 6：1
3 6 
```

容量为 3 的队列，前三个元素入队成功，4 和 5 被拒绝。出队两个之后空出了位置，6 可以继续入队，此时 `tail` 已经绕回了数组的前面，最后依次取出的是 3 和 6，说明绕回之后顺序依然正确。

> [!竞赛] 比赛里，括号匹配、表达式求值、单调栈用栈；广度优先搜索、按顺序处理任务用队列；滑动窗口、单调队列用双端队列。需要遍历或访问中间元素时，改用 `vector` 或数组模拟更方便。

> [!思考] 用数组实现循环队列时，如果不留出那个空位，只用 `head==tail` 来判断，会出现什么问题？

> [!答案] 参考思路
> 队列为空时 `head==tail`，队列装满之后 `tail` 绕了一圈追上 `head`，也是 `head==tail`，两种状态无法区分。要么像上面那样少用一个位置，要么再单独维护一个记录元素个数的变量。

> [!小结]
> `stack` 后进先出，`queue` 先进先出，`deque` 两端都能进出且支持下标。`stack` 和 `queue` 不能遍历，需要时复制一份再逐个取出，或者改用 `vector`、`deque`。循环队列把数组首尾相接，用取模让下标绕回，并留出一个空位区分空与满。
