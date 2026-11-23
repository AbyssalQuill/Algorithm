# 字符与字符串

> [!目标]
> 读完这一课，你应该明白 `char` 本质上是一个数字，会在字符和数字之间转换，会用 `string` 完成读入、取长度、拼接、截取、查找、遍历和反转，并且能判断字符的类别、转换大小写。

## char：字符其实是数字

`char` 变量保存的是**单个字符**，写字符时要用**单引号**，比如 `'A'`。在计算机内部，每个字符都对应着一个编号，这套编号称为 ASCII 码。因此字符可以像数字一样参与运算，这也是处理字符问题的一个关键事实。

```cpp frag
char c='A';
cout<<c<<" "<<(int)c<<endl;
cout<<(char)(c+1)<<endl;
cout<<'7'-'0'<<endl;
```

```output
A 65
B
7
```

这个例子里有三处值得细看。`(int)c` 把字符当作数字输出，`'A'` 对应的编号是 65。`c+1` 得到 66，把它转换回 `char` 就是 `'B'`，也就是字母表里的下一个字母。最后的 `'7'-'0'` 是 55 减去 48，等于 7，也就是说**数字字符减去 `'0'`，就得到它所代表的数值**，这是把字符变成数字最常用的办法。

下面几个编号要熟悉，它们各自内部是连续的：

| 字符 | `'0'` 到 `'9'` | `'A'` 到 `'Z'` | `'a'` 到 `'z'` |
| :-: | :-: | :-: | :-: |
| 编号 | 48 到 57 | 65 到 90 | 97 到 122 |

小写字母的编号比对应的大写字母大 32。转换大小写、判断字符类别，既可以自己用编号计算，也可以直接调用标准库函数：

```cpp frag
char c='g';
cout<<(char)(c-'a'+'A')<<" "<<(char)toupper(c)<<" "<<(isdigit('5')!=0)<<" "<<(isalpha('5')!=0)<<endl;
```

```output
G G 1 0
```

`toupper` 和 `tolower` 负责转换大小写，`isdigit` 和 `isalpha` 判断一个字符是不是数字、是不是字母。

> [!注意] `isdigit` 的返回值不一定是 1
> 这类判断函数返回的是“非零表示真”，直接输出时可能得到一个奇怪的数。像上面那样加上 `!=0` 再输出即可，放在 `if` 条件里则可以直接使用。

> [!注意] 单引号与双引号含义不同
> `'A'` 是一个字符，类型是 `char`；`"A"` 是一段文字，只不过它恰好只有一个字符。两者不能互换。

## string：字符串

处理一段文字，要用 `string`。它可以看成一个会自动管理长度的字符序列，使用起来比数组方便得多。

```cpp title="word.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string s;
    cin>>s;
    cout<<s.size()<<" "<<s[0]<<" "<<s[s.size()-1]<<endl;
    return 0;
}
```

```input
hello
```

```output
5 h o
```

常用的操作整理如下：

| 写法 | 作用 |
| :-- | :-- |
| `s.size()` 或 `s.length()` | 字符串的长度 |
| `s[i]` | 第 `i` 个字符，下标从 0 开始 |
| `s1+s2`、`s+="abc"` | 拼接 |
| `s1==s2`、`s1<s2` | 比较，按字典顺序 |
| `s.substr(pos,len)` | 从 `pos` 开始截取 `len` 个字符 |
| `s.find(t)` | 查找 `t` 第一次出现的位置，找不到则返回 `string::npos` |
| `reverse(s.begin(),s.end())` | 把字符串反转 |

```cpp frag
string s="algorithm";
cout<<s.substr(0,4)<<endl;
cout<<s.substr(5)<<endl;
cout<<s.find("or")<<endl;
cout<<(s.find("z")==string::npos)<<endl;
s+="s";
cout<<s<<" "<<s.size()<<endl;
```

```output
algo
ithm
3
1
algorithms 10
```

`substr(5)` 只给一个数，表示从第 5 个字符一直取到末尾。`find` 找到时返回的是位置的下标，找不到就返回一个特殊的值 `string::npos`，所以判断“有没有找到”要拿它来比较，不能和 -1 之类的数比。

## 遍历字符串

要逐个检查字符串中的字符，除了用下标，还有一种更简洁的写法，叫范围 `for`：`for (char c:s)` 让 `c` 依次等于 `s` 中的每一个字符。

```cpp frag
string s="a1b22c";
int d=0,l=0;
for (char c:s){
    if (isdigit(c)){
        d++;
    }else if (isalpha(c)){
        l++;
    }
}
cout<<d<<" "<<l<<endl;
```

```output
3 3
```

如果需要修改字符串里的字符，就必须使用下标。下面的程序读入一整行，把其中的小写字母全部变成大写：

```cpp title="upper.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string s;
    getline(cin,s);
    for (int i=0;i<(int)s.size();i++){
        if (s[i]>='a'&&s[i]<='z'){
            s[i]=s[i]-'a'+'A';
        }
    }
    cout<<s<<endl;
    return 0;
}
```

```input
Hello World
```

```output
HELLO WORLD
```

因为这一行里有空格，所以读入时用 `getline`，而不是 `cin>>`。循环条件里写成 `(int)s.size()`，是为了和 `i` 的类型保持一致，原因见下面的提示。

> [!注意] `s.size()` 是无符号数，不要让它参与减法
> `size()` 返回的类型不能表示负数。当字符串为空时，`s.size()-1` 得到的不是 -1，而是一个极大的数。需要做减法时，先把它转成 `int`，写成 `(int)s.size()-1`。

## 判断回文

回文指的是正着读和倒着读都一样的字符串，比如 `level`。思路很直接：把字符串复制一份并反转，再比较两者是否相等。

```cpp title="palindrome.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string s,t;
    cin>>s;
    t=s;
    reverse(t.begin(),t.end());
    cout<<(s==t?"YES":"NO")<<endl;
    return 0;
}
```

```input
level
```

```output
YES
```

## 数字与字符串的互相转换

```cpp frag
int n=123;
string s=to_string(n)+"45";
cout<<s<<" "<<stoi(s)+1<<endl;
```

```output
12345 12346
```

`to_string(n)` 把数字转换成字符串，`stoi(s)` 则把字符串转换成 `int`。需要转成 `long long` 用 `stoll`，转成小数用 `stod`。

## C 风格的字符串

在 C 语言里没有 `string` 类型，字符串是用 `char` 数组存放的。在比赛里偶尔也会遇到，值得认识一下：

```cpp frag
char s[105];
scanf("%s",s);
printf("%d\n",(int)strlen(s));
```

```input
hello
```

```output
5
```

用 `char` 数组要自己预留足够的空间，而且要比字符串的最大长度多留一个位置，用来存放结束标记。取长度用 `strlen`，读入时 `scanf("%s",s)` 不需要加 `&`。能用 `string` 的地方，优先用 `string`。

> [!思考] 数一数字符串 `"banana"` 里有几个字母 `a`

> [!答案] 参考写法
> ```cpp frag
> string s="banana";
> int cnt=0;
> for (char c:s){
>     if (c=='a'){
>         cnt++;
>     }
> }
> cout<<cnt<<endl;
> ```
>
> ```output
> 3
> ```

> [!小结]
> `char` 保存的是字符的编号，所以 `'7'-'0'` 能得到数字 7，`c-'a'+'A'` 能把小写变成大写。`string` 提供了长度、拼接、截取、查找和反转等常用操作，遍历用范围 `for`，修改用下标，整行输入则要用 `getline`。
