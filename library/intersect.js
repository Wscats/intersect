// 交集方法
module.exports = (a, b) => {
    return a.filter(x => new Set(b).has(x));
}