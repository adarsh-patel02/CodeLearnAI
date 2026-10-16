const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const evaluator = require('../src/services/taskEvaluationService');
const runner = require('../src/services/codeExecutionService');

const checkFunction = async (code, name, input, expected) => {
    const result = await runner.executePython(
        evaluator.buildFunctionEvaluationWrapper(code, name, input, expected)
    );
    assert.equal(result.success, true, result.error);
    return evaluator.parseFunctionEvaluationResult(result.output).passed;
};

test('function arguments, return types, text, escapes and wrong answers', async () => {
    for (const [code, name, input, expected] of [
        ['def add(a,b):\n return a+b', 'add', '[2,3]', '5'],
        ['def total(xs):\n return sum(xs)', 'total', '[1,2,3]', '6'],
        ['def ready():\n return True', 'ready', '', 'true'],
        ['def identity(s):\n return s', 'identity', 'hello', 'hello'],
        ['def identity(s):\n return s', 'identity', JSON.stringify('a\n"b"\\c'), JSON.stringify('a\n"b"\\c')],
        ['def f(xs,n):\n return sum(xs)+n', 'f', '{"args":[[1,2],3]}', '6'],
        ['def f(*,n):\n return n*2', 'f', '{"args":[],"kwargs":{"n":4}}', '8'],
        ['def f():\n print("debug")\n return [1,2]', 'f', '', '[1,2]'],
        ['def f(n):\n return n', 'f', 'null', 'null']
    ]) assert.equal(await checkFunction(code, name, input, expected), true, name);
    assert.equal(await checkFunction('def add(a,b):\n return a-b', 'add', '[2,3]', '5'), false);
});

test('STDIN preserves real lines, suppresses input prompts, and catches failures', async () => {
    const result = await runner.executePython('a=int(input("A:"))\nb=int(input("B:"))\nprint(a+b)', evaluator.prepareStdin('2\r\n3'));
    assert.deepEqual(result, {success: true, output: '5'});
    assert.equal((await runner.executePython('raise ValueError("bad")')).success, false);
});

test('interactive input supplies real newlines for consecutive input calls', async () => {
    await new Promise((resolve, reject) => {
        let output = '';
        const process = runner.startInteractivePython('a=int(input())\nb=int(input())\nprint(a+b)', {
            onOutput: chunk => { output += chunk.data; },
            onClose: result => {
                try { assert.equal(result.success, true); assert.equal(output.trim(), '5'); resolve(); }
                catch (error) { reject(error); }
            }
        });
        process.sendInput('2');
        process.sendInput('3');
    });
});

test('task configuration resolves explicit, legacy and invalid function tasks', () => {
    assert.equal(evaluator.resolveEvaluation({evaluationType:'FUNCTION',functionName:'add'}).functionName, 'add');
    assert.equal(evaluator.resolveEvaluation({starterCode:'def add(a,b):\n pass',description:'Write a function that adds numbers'}).evaluationType, 'FUNCTION');
    assert.equal(evaluator.resolveEvaluation({evaluationType:'FUNCTION'}).evaluationType, 'INVALID');
    assert.equal(evaluator.resolveEvaluation({starterCode:'n=int(input())'}).evaluationType, 'STDIN');
});

test('submit controller uses server-side cases in both assessment modes', async () => {
    let currentTask;
    const attempts = [];
    const sandbox = { module: {exports:{}}, console, require(name) {
        if (name === 'mongoose') return {isValidObjectId: () => true};
        if (name.endsWith('/Task')) return {findOne: async () => currentTask};
        if (name.endsWith('/CodeExecution')) return {countDocuments: async () => 0, create: async x => attempts.push(x)};
        if (name.endsWith('/codeExecutionService')) return runner;
        if (name.endsWith('/taskEvaluationService')) return evaluator;
        throw new Error(name);
    }};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/controllers/codeController.js'),'utf8'), sandbox);
    for (const assessmentMode of ['AI_ASSISTED','NO_AI']) {
        for (const evaluationType of ['FUNCTION','STDIN']) {
            currentTask = {language:'python',evaluationType,functionName:evaluationType === 'FUNCTION' ? 'add' : '',testCases:[{input:evaluationType === 'FUNCTION' ? '[2,3]' : '2\n3',expectedOutput:'5'},{input:evaluationType === 'FUNCTION' ? '[-1,1]' : '-1\n1',expectedOutput:'0'}]};
            const code = evaluationType === 'FUNCTION' ? 'def add(a,b):\n return a+b' : 'a=int(input())\nb=int(input())\nprint(a+b)';
            let body;
            const response = {status() {return this;}, json(value) {body=value; return this;}};
            await sandbox.module.exports.submitSolution({body:{code,taskId:'valid',assessmentMode},learner:{id:'learner'}},response);
            assert.equal(body.testsPassed,2);
            assert.equal(body.correctnessScore,100);
            assert.equal('expectedOutput' in body.results[0],false);
        }
    }
    assert.equal(attempts.length,4);
});
