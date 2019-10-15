const { createReadStream, appendFile } = require('fs');
const readline = require('readline');
const intersect = require('./intersect');
// 写入结果
const writeResult = (element) => {
    appendFile('./result.txt', `${element}\n`, (err) => {
        err ? () => console.log('写入成功') : () => console.log('写入失败');
    })
}
module.exports = (smallData) => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            // 6000条数据流
            input: createReadStream('./database/data-60M.txt', {
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
            console.log(line, rawData.length);
            lineCount++;
            // 限制每一次读取600条数据，分十次读取
            if (lineCount === 600) {
                console.log('读取次数为：', lineCount);
                console.log('取出结果为：', rawData);
                // 暂停流
                rl.pause();
                // 获取交集
                let intersectResult = intersect(rawData, smallData);
                // 遍历交集并写入结果
                intersectResult.forEach(element => {
                    writeResult(element)
                });
                setTimeout(() => {
                    // 释放缓存
                    rawData = [];
                    // 重置读取次数
                    lineCount = 0;
                    // 重启流
                    rl.resume();
                }, 0)
            }
        });
        rl.on('close', () => {
            resolve('结束');
        })
    })
}
