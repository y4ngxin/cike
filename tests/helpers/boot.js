/**
 * 测试共享引导模块
 * 用 jsdom 加载真实 index.html，按其中 <script> 顺序 eval 全部脚本，
 * 再派发 DOMContentLoaded 触发 app 装配 —— 与应用真实运行路径一致。
 *
 * 用法：const { boot, createAssert, sleep, settle } = require('./helpers/boot');
 *
 * 依赖：jsdom（npm install；或受管 runtime 下用 NODE_PATH 指向已装好的 node_modules）
 */
const fs = require('fs');
const path = require('path');

let JSDOM;
try {
    ({ JSDOM } = require('jsdom'));
} catch (e) {
    console.error('❌ 需要 jsdom：请在项目根目录执行 npm install，');
    console.error('   或使用受管 runtime：NODE_PATH="<workspace>/node_modules" node tests/run.js');
    process.exit(2);
}

const ROOT = path.resolve(__dirname, '..', '..');

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 等待并手动派发 hashchange（jsdom 的 hash 赋值不总是触发事件） */
async function settle(window, rounds = 8) {
    for (let i = 0; i < rounds; i++) {
        await sleep(5);
        window.dispatchEvent(new window.Event('hashchange'));
    }
    await sleep(15);
}

/**
 * 启动一个全新应用实例（独立 localStorage 与 window）。
 * 每个测试套件/场景各用一个实例，互不污染。
 */
function boot() {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' });
    const { window } = dom;

    // 按 index.html 中声明的顺序加载脚本（新增页面脚本时无需改测试）
    const srcs = [...html.matchAll(/<script src="\.\/(js[^"]+)"/g)].map(m => m[1]);
    if (!srcs.length) throw new Error('未能从 index.html 解析出任何脚本');
    srcs.forEach(src => {
        const code = fs.readFileSync(path.join(ROOT, src), 'utf8');
        try {
            window.eval(code);
        } catch (e) {
            throw new Error(`加载 ${src} 失败: ${e.message}`);
        }
    });

    window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
    return {
        dom,
        window,
        document: window.document,
        store: window.CiKeStore,
        router: window.CiKeRouter,
        ui: window.CiKeUI
    };
}

/** 轻量断言器：累计通过/失败，失败记录上下文 */
function createAssert() {
    const failures = [];
    let pass = 0;
    return {
        ok(name, cond) {
            if (cond) { pass++; }
            else { failures.push(name); console.log(`    ✗ ${name}`); }
        },
        eq(name, actual, expected) {
            this.ok(`${name}（期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}）`, actual === expected);
        },
        summary() { return { pass, fail: failures.length, failures }; }
    };
}

module.exports = { boot, createAssert, sleep, settle, ROOT };
