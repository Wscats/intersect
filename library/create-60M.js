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