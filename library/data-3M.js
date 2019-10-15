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
