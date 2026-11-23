# 字符与字符串

> [!目标]
> - 理解 `char` 其实是数字（ASCII 码），会做字符和数字的转换
> - 会用 `string` 完成：读入、长度、拼接、截取、查找、遍历、反转
> - 会判断字符的类别（数字、字母），会转换大小写

## char：字符就是数字

`char` 存的是**一个字符**，用**单引号**包住：`'A'`。电脑里每个字符都对应一个编号，这套编号叫 **ASCII 码**。所以字符可以参与运算：

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

- `(int)c` 把字符当数字看，`'A'` 是 65。
- `c+1` 是 66，转成 `char` 就是 `'B'`。
- `'7'-'0'` 是 55−48=7：**数字字符减去 `'0'`，就得到它代表的数字**。这是把字符变成数字最常用的办法。

几个要背的编号（它们各自是连续的）：

| 字符 | `'0'`~`'9'` | `'A'`~`'Z'` | `'a'`~`'z'` |
| :-: | :-: | :-: | :-: |
| 编号 | 48~57 | 65~90 | 97~122 |

小写字母比对应的大写字母**大 32**（`'a'-'A'` 是 32）。判断和转换大小写：

```cpp frag
char c='g';
cout<<(char)(c-'a'+'A')<<" "<<(char)toupper(c)<<" "<<(isdigit('5')!=0)<<" "<<(isalpha('5')!=0)<<endl;
```

```output
G G 1 0
```

`toupper`/`tolower` 转大小写，`isdigit`/`isalpha` 判断是不是数字 / 字母，用起来比自己写区间判断省事。

> [!注意] `isdigit` 的返回值不一定是 1
> 它返回“非零”表示真，直接输出可能是个怪数字。需要输出的话，像上面这样写 `!=0`。放在 `if` 里直接用就行。

> [!注意] 单引号和双引号完全不同
> `'A'` 是一个**字符**（`char`），`"A"` 是一段**文字**（长度为 1 的字符串）。别混用。

## string：一串字符

`string` 就是一个会自己管理长度的“字符数组”，用起来很方便。

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

| 写法 | 作用 |
| :-- | :-- |
| `s.size()` 或 `s.length()` | 长度 |
| `s[i]` | 第 `i` 个字符（下标从 0 开始） |
| `s1+s2`、`s+="abc"` | 拼接 |
| `s1==s2`、`s1<s2` | 比较（按字典顺序） |
| `s.substr(pos,len)` | 从 `pos` 开始取 `len` 个字符 |
| `s.find(t)` | 找 `t` 第一次出现的位置，找不到返回 `string::npos` |
| `reverse(s.begin(),s.end())` | 反转 |

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

`substr(5)` 只写一个数，表示“从第 5 个一直取到末尾”。`find` 找到时返回下标，**找不到就返回 `string::npos`**，要用它来判断“有没有”。

## 遍历字符串

一个个检查字符，可以用下标，也可以用更简洁的“范围 for”：`for (char c:s)`，意思是“让 `c` 依次等于 `s` 里的每一个字符”。

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

要**修改**字符串里的字符，就用下标。把一整行里的小写字母变成大写：

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

这里读整行用的是 `getline`（输入那一课讲过：`cin>>` 遇到空格就会停）。`(int)s.size()` 是为了让它和 `i` 的类型一致，下面的提示解释了原因。

> [!注意] `s.size()` 是“无符号数”，别让它参与减法
> `size()` 的类型不能表示负数，字符串是空的时候，`s.size()-1` 不会得到 -1，而是一个巨大的数。需要时先转成 `int`：`(int)s.size()-1`。

## 反转和回文

回文是正着读和倒着读都一样的字符串（如 `level`）。反转一份拷贝再比较：

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

## 数字和字符串互相转换

```cpp frag
int n=123;
string s=to_string(n)+"45";
cout<<s<<" "<<stoi(s)+1<<endl;
```

```output
12345 12346
```

`to_string(n)` 把数字变成字符串，`stoi(s)` 把字符串变成 `int`（大整数用 `stoll`，小数用 `stod`）。

## C 风格的字符串：char 数组

C 语言里没有 `string`，用 `char` 数组存字符串。在竞赛里也偶尔见到，认识一下：

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

`char` 数组要自己开够空间（比字符串长度多留 1 个位置存结束标记），用 `strlen` 取长度，读入时 `scanf("%s",s)` **不用加 `&`**。能用 `string` 就用 `string`。

> [!思考] 数一数 "banana" 里有几个字母 `a`

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
> - `char` 就是数字：`'7'-'0'` 得 7，`c-'a'+'A'` 转大写。
> - `string` 常用：`size`、`[]`、`+`、`substr`、`find`（找不到是 `npos`）、`reverse`。
> - 遍历用 `for (char c:s)`，修改用下标；整行输入用 `getline`。
