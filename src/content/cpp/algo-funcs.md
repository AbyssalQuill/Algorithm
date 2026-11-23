# 常用函数速查

> [!目标]
> - 知道标准库里有哪些现成的函数可以直接用，遇到需求时第一反应是“应该有现成的”
> - 掌握最值与交换、反转与去重、二分查找、最大公约数、求和与计数、全排列这几类函数

这一课和前面不太一样，没有一条主线，而更像一张工具清单。建议先通读一遍留个印象，在以后写题时遇到需求，再回来对照查阅。所有函数都包含在 `bits/stdc++.h` 里，不需要额外引入头文件。

## 最值与交换

```cpp frag
int a=3,b=8;
swap(a,b);
cout<<a<<" "<<b<<" "<<min(a,b)<<" "<<max(a,b)<<endl;
cout<<max({1,5,3})<<endl;
```

```output
8 3 3 8
5
```

`swap` 交换两个变量，`min` 和 `max` 取两个数中较小或较大的。如果要在多个数里取最值，可以把它们放在花括号里一起交给 `max` 或 `min`。

## 反转与去重

`reverse(起点,终点)` 把一段区间的顺序倒过来。`unique(起点,终点)` 能去掉**相邻**的重复元素，所以一般要先排好序，让相同的元素挨在一起。它不会真正删除元素，而是把不重复的元素整理到前面，并返回新的结尾位置，需要配合 `erase` 才能把多余的部分删掉：

```cpp frag
vector<int> v={1,1,2,2,3,3,3};
v.erase(unique(v.begin(),v.end()),v.end());
reverse(v.begin(),v.end());
for (int x:v){
    cout<<x<<" ";
}
cout<<endl;
```

```output
3 2 1
```

## 在有序序列里二分查找

在已经排好序的数组上查找，用二分查找比逐个扫描快得多。标准库提供了两个函数：

- `lower_bound(起点,终点,x)`：返回第一个**大于等于** `x` 的元素的位置。
- `upper_bound(起点,终点,x)`：返回第一个**大于** `x` 的元素的位置。

返回值是位置（指针或迭代器），减去起点就得到下标。两者之差正好是 `x` 出现的次数：

```cpp frag
int a[6]={1,3,3,5,7,9};
cout<<lower_bound(a,a+6,3)-a<<" "<<upper_bound(a,a+6,3)-a<<" "<<lower_bound(a,a+6,4)-a<<endl;
cout<<upper_bound(a,a+6,3)-lower_bound(a,a+6,3)<<endl;
```

```output
1 3 3
2
```

数组里 3 出现在下标 1 和 2，所以 `lower_bound` 给出 1，`upper_bound` 给出 3。查找 4 时，第一个不小于 4 的元素是下标 3 的 5。两者之差 2，就是 3 出现的次数。

## 最大公约数与最小公倍数

```cpp frag
int a=12,b=18;
int g=__gcd(a,b);
cout<<g<<" "<<a/g*b<<endl;
```

```output
6 36
```

最小公倍数没有现成函数，用“两数之积除以最大公约数”计算。为了防止乘法溢出，要先除后乘，写成 `a/g*b`，而不是 `a*b/g`。

## 求和、最值、计数与填充

```cpp frag
vector<int> v={3,1,4,1,5};
cout<<accumulate(v.begin(),v.end(),0)<<" "<<*max_element(v.begin(),v.end())<<" "<<*min_element(v.begin(),v.end())<<" "<<count(v.begin(),v.end(),1)<<endl;
```

```output
14 5 1 2
```

- `accumulate(起点,终点,初值)`：求和。
- `max_element` 和 `min_element` 返回的是最大、最小元素的**位置**，要取值需要在前面加 `*`。
- `count(起点,终点,x)`：统计 `x` 出现了多少次。
- `fill(起点,终点,x)`：把区间里都填成 `x`；`iota(起点,终点,x0)`：依次填入 `x0, x0+1, x0+2…`。

> [!注意] `accumulate` 的初值决定了结果的类型
> 初值写 `0` 就是 `int`，数据很大时会溢出。求大数之和要写成 `0LL`，让整个累加过程在 `long long` 里进行。

## 全排列：next_permutation

`next_permutation` 把序列变成字典序中的**下一个排列**，如果已经是最后一个就返回 `false`。把它放在 `do-while` 里，可以按顺序枚举出所有排列：

```cpp frag
int a[3]={1,2,3};
do{
    cout<<a[0]<<a[1]<<a[2]<<" ";
}while (next_permutation(a,a+3));
cout<<endl;
```

```output
123 132 213 231 312 321
```

要枚举所有排列，序列必须**一开始就是升序**，否则会漏掉前面的那些排列。

## 二进制相关

```cpp frag
cout<<__builtin_popcount(13)<<" "<<(1<<10)<<endl;
```

```output
3 1024
```

`__builtin_popcount(x)` 统计 `x` 的二进制里有几个 1（13 是 `1101`，所以是 3）。`1<<k` 得到 2 的 k 次方，常用来表示“只有第 k 位是 1”。

> [!竞赛] 遇到需求先想想有没有现成函数
> 去重、二分、全排列这些功能，自己手写既慢又容易错。熟悉这张清单之后，很多题目里的“基础操作”可以一行解决，把时间留给真正需要思考的部分。

> [!小结]
> 本课覆盖的函数可以归为几类：`swap/min/max` 处理两个数，`reverse/unique` 整理序列，`lower_bound/upper_bound` 在有序序列上二分，`__gcd` 求最大公约数，`accumulate/count/max_element` 做统计，`next_permutation` 枚举排列。
