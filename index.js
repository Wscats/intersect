const data3M = require('./library/data-3M');
const data60M = require('./library/data-60M');
(async () => {
    let smallData = await data3M();
    let result = await data60M(smallData);
    console.log(result);
})();