# 字符串的更多操作

> [!目标]
> - 会用 `insert`、`erase`、`replace`、`assign` 修改字符串，会用 `find` 系列函数找出所有出现的位置
> - 会在数字和字符串之间互相转换，会用 `stringstream` 把一行文字拆成若干部分
> - 会用标准库函数完成大小写转换、排序、去重和去空格

## 多种构造方式

`string` 的构造方式不止 `string s="abc"` 这一种，下面几种也很常用。

```cpp title="string_ctor.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string a(5,'*');
    string b("hello world",1,3);
    string c("hello world",5);
    char arr[]="array";
    string d(arr);
    string e(d.begin()+1,d.end()-1);
    cout<<a<<endl<<b<<endl<<c<<endl<<d<<endl<<e<<endl;
    return 0;
}
```

```output
*****
ell
hello
array
rra
```

`string(5,'*')` 是 5 个重复的字符；`string("hello world",1,3)` 从下标 1 开始取 3 个字符；只给一个数字时，取字符串开头的那么多个字符；也可以用一对迭代器指定一段范围。

## 增加、删除与替换

这几个函数的位置参数都是下标，长度参数是字符个数。

```cpp title="string_edit.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string s="hello world";
    s.insert(5,",");
    cout<<s<<endl;
    s.replace(7,5,"C++");
    cout<<s<<endl;
    s.erase(5,1);
    cout<<s<<endl;
    s.append("!!").push_back('?');
    cout<<s<<endl;
    s.assign(3,'z');
    cout<<s<<endl;
    return 0;
}
```

```output
hello, world
hello, C++
hello C++
hello C++!!?
zzz
```

`insert(pos,str)` 在下标 `pos` 的位置插入；`replace(pos,len,str)` 把从 `pos` 开始的 `len` 个字符替换成 `str`，新旧长度可以不同；`erase(pos,len)` 删除；`append` 追加，等同于 `+=`；`assign` 则是用新内容整个替换。这些操作都会修改原来的字符串，并且 `insert`、`erase` 之后，后面的字符需要整体移动，在很长的字符串里频繁使用会比较慢。

## 查找的几个函数

`find(x)` 从头开始找，`rfind(x)` 从尾部开始找，都返回下标，找不到时返回特殊的常量 `string::npos`。`find_first_of(集合)` 找第一个属于给定字符集合的字符，`find_first_not_of(集合)` 找第一个不属于集合的字符。`find` 还可以多给一个参数，指定从哪个位置开始找，用它能够找出所有出现的位置。

```cpp title="string_find.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string s="Hello World, hello C++";
    cout<<s.find("llo")<<" "<<s.rfind("llo")<<" "<<s.find("xyz")<<endl;
    size_t pos=0;
    while ((pos=s.find('o',pos))!=string::npos){
        cout<<"o 在 "<<pos<<endl;
        pos++;
    }
    cout<<s.find_first_of("WC")<<" "<<s.find_first_not_of("Helo ")<<endl;
    cout<<(s.find("xyz")==string::npos?"没找到":"找到了")<<endl;
    return 0;
}
```

```output
2 15 18446744073709551615
o 在 4
o 在 7
o 在 17
6 6
没找到
```

`find("xyz")` 找不到，返回的是 `string::npos`，它是一个很大的无符号数（通常相当于 -1 转成无符号），所以不能用来当作普通下标，也不要把它放进 `int` 里与 0 比较大小。判断是否找到，应该写 `==string::npos`。

## 数字与字符串的转换

比赛里经常需要在数字和字符串之间转换。数字转字符串用 `to_string`；字符串转数字用 `stoi`（转 `int`）、`stoll`（转 `long long`）、`stod`（转 `double`）。`stoi` 还可以指定进制，用来做进制转换。

```cpp title="string_num.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string s=to_string(123)+to_string(45);
    cout<<s<<" "<<stoi(s)+1<<endl;
    cout<<stod("3.14abc")*2<<endl;
    cout<<stoi("1010",nullptr,2)<<" "<<stoi("ff",nullptr,16)<<endl;
    cout<<bitset<8>(stoi("1010",nullptr,2))<<endl;
    long long big=stoll("12345678901");
    cout<<big*2<<endl;
    return 0;
}
```

```output
12345 12346
6.28
10 255
00001010
24691357802
```

`stoi` 会读取字符串开头尽可能长的一段合法数字，遇到非法字符就停下，所以 `stod("3.14abc")` 得到的是 3.14；如果字符串一开头就不是数字，这些函数会抛出异常。`stoi("1010",nullptr,2)` 把二进制的 `1010` 转成了十进制的 10。

## 用 stringstream 拆分字符串

`stringstream`（在 `<sstream>` 里）可以把字符串当作输入来使用：像 `cin` 那样用 `>>` 一个个地读出，按空白字符自动拆分。它能把一行文字拆成多个单词，也可以把一串数字读出来。

```cpp title="stringstream.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string line="12 apple 3.5 banana";
    stringstream ss(line);
    int n;
    string a,b;
    double x;
    ss>>n>>a>>x>>b;
    cout<<n+1<<" "<<a<<" "<<x*2<<" "<<b<<endl;
    string csv="1,2,3,4";
    stringstream cs(csv);
    string part;
    int sum=0;
    while (getline(cs,part,',')){
        sum+=stoi(part);
    }
    cout<<sum<<endl;
    return 0;
}
```

```output
13 apple 7 banana
10
```

`getline(流,变量,分隔符)` 可以指定分隔符，这里按逗号拆分，这是处理 CSV、日期（`2025-06-01`）和路径等字符串的常用办法。

## 字符的判断、转换与整理

`<cctype>` 提供了判断字符类别的函数：`isdigit`、`isalpha`、`isalnum`、`isupper`、`islower`、`isspace`，以及转换大小写的 `toupper` 和 `tolower`。配合 `transform` 就能一次转换整个字符串。排序、去重、去空格则是前面学过的算法的直接应用。

```cpp title="string_clean.cpp"
#include <bits/stdc++.h>
using namespace std;
int main(){
    string s="Hello, World 2025";
    string up=s,low=s;
    transform(up.begin(),up.end(),up.begin(),::toupper);
    transform(low.begin(),low.end(),low.begin(),::tolower);
    cout<<up<<endl<<low<<endl;
    int d=count_if(s.begin(),s.end(),::isdigit);
    int a=count_if(s.begin(),s.end(),::isalpha);
    cout<<d<<" "<<a<<endl;
    string t="hello world";
    t.erase(remove(t.begin(),t.end(),' '),t.end());
    sort(t.begin(),t.end());
    cout<<t<<endl;
    t.erase(unique(t.begin(),t.end()),t.end());
    cout<<t<<endl;
    return 0;
}
```

```output
HELLO, WORLD 2025
hello, world 2025
4 10
dehllloorw
dehlorw
```

`::toupper` 前面的两个冒号表示使用全局的 C 语言版本，避免与 `<locale>` 里同名的函数产生歧义，这是 `transform` 配合它们时常见的写法。先排序再去重，得到的是字符串里出现过的所有字符，每种只保留一个，并且按顺序排好。

> [!竞赛] 处理字符串输入时，先用 `getline` 读入一整行，再用 `stringstream` 拆分，是最稳妥的组合。判断一个字符串是不是回文，用 `s==string(s.rbegin(),s.rend())`。需要大量拼接字符串时，用 `+=` 或 `append`，不要反复写 `s=s+x`，后者每次都会复制整个字符串。

> [!思考] 为什么判断 `find` 是否找到时，不能写 `if (s.find(x)>=0)`？

> [!答案] 参考思路
> `find` 返回的是无符号类型，找不到时是一个很大的正数（`string::npos`），而无符号数永远不小于 0，所以这个条件恒为真。正确的写法是与 `string::npos` 比较。

> [!小结]
> `insert`、`replace`、`erase`、`append`、`assign` 修改字符串；`find` 系列返回下标，找不到是 `string::npos`；`to_string` 与 `stoi`、`stoll`、`stod` 互转数字和字符串；`stringstream` 配合 `getline` 拆分文本；`transform`、`sort`、`unique`、`remove` 整理字符串。
