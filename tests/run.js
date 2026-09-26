/**
 * 测试聚合入口：node tests/run.js（或 npm test）
 * 顺序执行 tests/*.test.js，汇总断言数，任何失败以非零码退出（供 CI 使用）。
 */
const fs = require('fs');
const path = require('path');

(async () => {
    const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort();
    if (!files.length) {
        console.error('tests/ 下没有任何 .test.js');
        process.exit(2);
    }

    let totalPass = 0, totalFail = 0;
    const allFailures = [];

    for (const f of files) {
        const suite = require(path.join(__dirname, f));
        console.log(`\n【${suite.name}】(${f})`);
        let result;
        try {
            result = await suite.run();
        } catch (e) {
            console.log(`    ✗ 套件执行异常: ${e.stack || e.message}`);
            result = { pass: 0, fail: 1, failures: [`套件异常: ${e.message}`] };
        }
        totalPass += result.pass;
        totalFail += result.fail;
        result.failures.forEach(x => allFailures.push(`${suite.name}: ${x}`));
        console.log(`    → ${result.pass} 通过 / ${result.fail} 失败`);
    }

    console.log(`\n========== 总计：${totalPass} 通过 / ${totalFail} 失败 ==========`);
    if (allFailures.length) {
        allFailures.forEach(x => console.log(`  ✗ ${x}`));
    }
    process.exit(totalFail ? 1 : 0);
})();
