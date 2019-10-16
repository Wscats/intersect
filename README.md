# 下载 && 运行

下载源代码：
```bash
git clone https://github.com/Wscats/intersect
```

使用以下命令运行测试，运行成功后结果会在`result.txt`中展现结果：
```bash
# 运行
npm start
# 查看结果
npm run dev
# 生成新的大数据
npm run build
```

# 目录结构

- database
    - data-3M.txt - 模拟的3百万数据包
    - data-60M.txt - 模拟的6千万数据包
- library
    - data-3M.js - 处理3百万数据包的逻辑
    - data-60M.js - 处理6千万数据包的逻辑
    - intersect.js - 处理数据包的交集
    - create-60M.js - 生成大数据的文件
- result.txt 最终数据包的交集结果
- index.js 主逻辑文件

理想数据包的数据结构如下：
```
QQ:40645253 地址：xxx 年龄：xxx
QQ:49844525 地址：xxx 年龄：xxx
QQ:51053984 地址：xxx 年龄：xxx
QQ:15692967 地址：xxx 年龄：xxx
QQ:39211026 地址：xxx 年龄：xxx
...
```
理想数据包的内存占用如下：

|数据量|内存占用|
|-|-|
|6000条数据|>=30KB|
|6000万条数据|>=300.000KB>=300MB|
|300条数据|>=15KB|
|300万条数据|>=150.000KB>=15MB|

在50MB的内存限制下，我们可以把300万条约15MB的数据完全放入内存中，剩余大概35MB空间是不允许我们完全放入6000万条约300MB的数据，所以我们需要把数据切割成10块左右，大概每块控制在30MB，然后分别读取出来跟内存中的300万条数据进行比对并求出交集。

在 Node 中要满足上面的要求，我们分别需要用到两个关键的内置模块：

- fs - 文件系统
- readline - 逐行读取

`fs.createReadStream(path[, options])`方法中，其中 options 可以包括 start 和 end 值，以从文件中读取一定范围的字节而不是整个文件。 start 和 end 都包含在内并从 0 开始计数，这种是方法方便我们分段读取6000万条数据。

示例，从一个大小为 100 个字节的文件中读取最后 10 个字节：
```js
fs.createReadStream('data3M.txt', { start: 90, end: 99 });
```

除此之外还可以使用，`fs.createReadStream()` 提供 highWaterMark 选项，它允许我们将以大小等于 highWaterMark 选项的块读取流，highWaterMark 的默认值为: 64 * 1024(即64KB)，我们可以根据需要进行调整，当内部的可读缓冲的总大小达到 highWaterMark 设置的阈值时，流会暂时停止从底层资源读取数据，直到当前缓冲的数据被消费，我们就可以触发`readline.pause()`暂停流，处理完之后继续触发`readline.resume()`恢复流，然后不断重复以上步骤，将6000万数据分别处理完。

readline 模块提供了一个接口，用于一次一行地读取可读流中的数据。 它可以使用以下方式访问，并且我们的数据包，每条数据之间是使用`\n、\r 或 \r\n`隔开，所以这样方便我们使用`readline.on('line', (input) => {})`来接受每一行数据包的字符串。

# data-60M.js

该文件用于专门处理6000万数据，我们使用`readline`和`createReadStream`两者配合，将数据按一定条数分别缓存在内存中，由于提交的代码不适合太大(Git传上去太慢)，所以把数据量减少到6000条，那么分成10份的话，每份缓存就需要读600条左右，读完每份数据之后调用`intersect`函数求交集，并存入硬盘`result.txt`文件中，然后释放内存：

```js
// 写入结果
const writeResult = (element) => {
    appendFile('./result.txt', `${element}\n`, (err) => {
        err ? () => console.log('写入成功') : () => console.log('写入失败');
    })
}
```
这里最关键是要定义一个空的容器`lineCount`来存放每段数据，并且使用`if (lineCount === 600) {}`语句判断内存超过限制的空间后做释放内存的处理：
```js
const { createReadStream, appendFile } = require('fs');
const readline = require('readline');
const intersect = require('./intersect');

module.exports = (smallData) => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            // 6000条数据流
            input: createReadStream('./database/data60M.txt', {
                // 节流阀
                highWaterMark: 50
            }),
            // 处理分隔符
            crlfDelay: Infinity
        });
        // 缓存次数
        let lineCount = 0;
        // 缓存容器
        let rawData = [];
        // 逐行读取
        rl.on('line', (line) => {
            rawData.push(line);
            lineCount++;
            // 限制每一次读取600条数据，分十次读取
            if (lineCount === 600) {
                // 释放内存
                // ...
            }
        );
        rl.on('close', () => {
            resolve('结束');
        })
    })
}
```
释放内存后前需要使用`rl.pause()`暂停流，然后做两步逻辑:

- 求交集结果
- 写入每段交集结果到硬盘

然后需要使用`rl.resume()`重启流：
```js
if (lineCount === 600) {
    // 暂停流
    rl.pause();
    // 获取交集
    let intersectResult = intersect(rawData, smallData);
    // 遍历交集并写入结果
    intersectResult.forEach(element => {
        writeResult(element)
    });
    // 释放缓存
    rawData = null;
    intersectResult = null;
    rawData = [];
    // 重置读取次数
    lineCount = 0;
    // 重启流
    rl.resume();
}
```

# data-3M.js

这里的数据由于是3百万，所以可以把全部数据放入内存，这里用Promise封装，方便在外部配合`async`和`await`使用：
```js
const fs = require('fs');
const readline = require('readline');
module.exports = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: fs.createReadStream('./database/data-3M.txt'),
            crlfDelay: Infinity
        });
        let check = [];
        rl.on('line', (line) => {
            check.push(line);
        });
        rl.on('close', () => {
            resolve(check)
        })
    })
}
```

# intersect.js

这里简单的使用`Set`和`filter`方法来求交集：
```js
// 交集方法
module.exports = (a, b) => {
    return a.filter(x => new Set(b).has(x));
}
```

# index.js

这里分别把上面两份处理关键数据的逻辑引入，然后执行逻辑：
```js
const data3M = require('./library/data-3M');
const data60M = require('./library/data-60M');
(async () => {
    let smallData = await data3M();
    let result = await data60M(smallData);
    console.log(result);
})();
```

# create-60M.js

生成全新的大数据，用于测试：
```js
const fs = require("fs");
const path = require('path');
const writer = fs.createWriteStream(path.resolve(__dirname, '../database/data-60M.txt'), { highWaterMark: 1 });

const writeSixtyMillionTimes = (writer) => {
    const write = () => {
        let data = Buffer.from(`${parseInt(Math.random() * 60000000)}\n`)
        let ok = true;
        do {
            i--;
            if (i === 0) {
                // 最后一次写入。
                writer.write(data);
            } else {
                // 检查是否可以继续写入。 
                // 不要传入回调，因为写入还没有结束。
                ok = writer.write(data);
            }
        } while (i > 0 && ok);
        if (i > 0) {
            // 被提前中止。
            // 当触发 'drain' 事件时继续写入。
            writer.once('drain', write);
        }
    }
    // 初始化6000万数据
    let i = 600000;
    write();
}

writeSixtyMillionTimes(writer)
```