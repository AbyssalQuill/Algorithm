# 封装与访问控制

> [!目标]
> - 理解为什么要把成员变量藏起来，只允许通过成员函数来读写
> - 会使用 `private` 和 `public`，知道 `class` 与 `struct` 唯一的区别
> - 能写出带有合法性检查的取值函数和设值函数

## 数据被随意修改的风险

假设要写一个银行账户。成员函数 `withdraw` 在取钱之前会认真检查余额是否足够，看起来万无一失。

```cpp title="open_balance.cpp"
#include <bits/stdc++.h>
using namespace std;
class Account{
public:
    int balance;
    void deposit(int x){
        balance+=x;
    }
    bool withdraw(int x){
        if (x>balance) return false;
        balance-=x;
        return true;
    }
};
int main(){
    Account a;
    a.balance=100;
    a.withdraw(30);
    a.balance-=500;
    cout<<a.balance<<endl;
    return 0;
}
```

```output
-430
```

问题出在 `balance` 是公开的：任何一段代码都可以不经过 `withdraw`，直接对它做减法，余额就变成了负数，而编译器和运行时都不会提出任何异议。类里的检查写得再仔细，只要数据对外敞开，这些检查就可以被绕过。

## private 与 public

C++ 用访问权限来解决这个问题。写在 `public:` 后面的成员对所有代码开放，写在 `private:` 后面的成员只有这个类自己的成员函数才能访问。把 `balance` 放进 `private`，外部就只能通过 `deposit` 和 `withdraw` 来改变余额，所有的检查都绕不过去。

```trace
#include <bits/stdc++.h>
using namespace std;
class Account{
private:
    int balance=0;
public:
    void deposit(int x){
        if (x>0) balance+=x;                  //@s2
    }
    bool withdraw(int x){
        if (x<=0||x>balance) return false;    //@s3,s4
        balance-=x;                           //@s3
        return true;                          //@s3
    }
    int getBalance(){
        return balance;                       //@s5
    }
};
int main(){
    Account a;                                //@s1
    a.deposit(100);                           //@s2
    cout<<a.withdraw(30)<<endl;               //@s3
    cout<<a.withdraw(500)<<endl;              //@s4
    cout<<a.getBalance()<<endl;              //@s5
    return 0;
}
---
s1 | balance=0 |  | 创建账户，余额是 0。balance 是私有的，main 里已经不能直接写 a.balance 了。
s2 | balance=100 |  | 存入 100。deposit 先确认存入的金额是正数，再把它加到余额上。
s3 | balance=70 | 1\n | 取出 30：金额合法，余额也够，所以扣除后返回 true，输出时 true 显示为 1。
s4 | balance=70 | 0\n | 想取 500，超过了余额。withdraw 在检查时就返回了 false，余额没有变化，输出 0。
s5 | balance=70 | 70\n | 外部想知道余额，只能调用 getBalance 来读，读到的是 70。
```

如果在 `main` 里仍然写 `a.balance=-100;`，程序根本无法通过编译。

```text
error: 'int Account::balance' is private within this context
```

这是封装的第一个好处：把“不允许发生的事”变成编译错误，在运行之前就被拦下。第二个好处在于出了问题好查。余额只有 `deposit` 和 `withdraw` 两个函数能改动，所以当余额出现异常时，只需要检查这两处，而不必搜索整个程序。

## 取值函数与设值函数

私有的成员变量需要提供读取或修改的途径时，常见的做法是写一对函数：读取的叫取值函数（getter），修改的叫设值函数（setter）。关键在于设值函数里可以加检查。

```cpp title="student_private.cpp"
#include <bits/stdc++.h>
using namespace std;
class Student{
private:
    string name;
    int score=0;
public:
    void setName(string n){
        name=n;
    }
    void setScore(int s){
        if (s<0) s=0;
        if (s>100) s=100;
        score=s;
    }
    string getName(){
        return name;
    }
    int getScore(){
        return score;
    }
};
int main(){
    Student s;
    s.setName("Tom");
    s.setScore(120);
    cout<<s.getName()<<" "<<s.getScore()<<endl;
    return 0;
}
```

```output
Tom 100
```

传入的 120 超出了合理范围，`setScore` 把它修正成了 100。无论哪一处代码设置分数，都要经过这个检查，不会有漏网之鱼。

不过也不必给每个成员都配一对函数。只读的数据就只提供取值函数，不希望外部知道的细节完全不提供，类向外开放多少，取决于它真正需要对外提供什么。

## class 与 struct 的区别

在 C++ 里，`struct` 同样可以拥有成员函数和构造函数，它和 `class` 唯一的区别是默认的访问权限：`struct` 里没有写权限的成员默认是 `public`，`class` 里默认是 `private`。

```cpp top
struct A{
    int x;
};
class B{
    int x;
};
```

上面的 `A::x` 是公开的，`B::x` 是私有的。除此之外两者完全等价。习惯上，只是把几项数据放在一起、没有什么规则需要维护的，用 `struct`；需要保护数据、维持某些约束的，用 `class`。

> [!竞赛] 算法竞赛的代码追求简短，所有成员公开的 `struct` 用得最多，很少为了封装去写取值和设值函数。封装的价值在代码需要长期维护、多人协作时才充分体现，但理解它，有助于读懂别人的代码，也有助于看懂标准库的设计。

> [!思考] 如果希望外部能读取账户余额，却绝对不能直接修改它，应该给 `Account` 提供哪些函数？

> [!答案] 参考思路
> 只提供 `getBalance` 这样的取值函数，不提供任何直接设置余额的函数。余额的变化只能通过 `deposit` 和 `withdraw` 完成。

> [!小结]
> 封装的做法是把成员变量设为 `private`，只通过成员函数来改变它，并在这些函数里检查数据的合法性。这样类自己就能保证数据始终处于合理的状态，出现问题时也容易定位。`class` 与 `struct` 的唯一差别是默认的访问权限。
