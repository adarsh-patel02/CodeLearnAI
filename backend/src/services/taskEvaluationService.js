const FUNCTION_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

const extractFunctionName = (starterCode = "") => {
    const match = String(starterCode).match(/^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/m);
    return match ? match[1] : null;
};

const isFunctionStyleTask = (task) => {
    const explicitName = String(task?.functionName || "").trim();
    if (FUNCTION_NAME_RE.test(explicitName)) {
        return true;
    }

    const starterCode = String(task?.starterCode || "");
    const description = String(task?.description || "").toLowerCase();
    const inferredName = extractFunctionName(starterCode);

    // Existing tasks were sometimes stored as STDIN even though the learner
    // is explicitly asked to implement a function. Infer FUNCTION only when
    // the starter code is function-shaped and there is no obvious stdin API.
    const hasStdin = /\binput\s*\(|sys\.stdin|sys\.argv/.test(starterCode);
    const asksForFunction = /\bwrite\s+(a|an)\s+function\b|\bfunction\s+that\b|\breturn\b/.test(description);

    return Boolean(inferredName && !hasStdin && asksForFunction);
};

const resolveEvaluation = (task) => {
    const explicitType = String(task?.evaluationType || "STDIN").toUpperCase();
    const explicitName = String(task?.functionName || "").trim();
    const inferredName = extractFunctionName(task?.starterCode || "");

    if (explicitType === "FUNCTION" && FUNCTION_NAME_RE.test(explicitName)) {
        return { evaluationType: "FUNCTION", functionName: explicitName };
    }

    if (isFunctionStyleTask(task) && FUNCTION_NAME_RE.test(inferredName || explicitName)) {
        return {
            evaluationType: "FUNCTION",
            functionName: inferredName || explicitName
        };
    }

    if (explicitType === "FUNCTION") {
        return {
            evaluationType: "INVALID",
            functionName: explicitName || null
        };
    }

    return { evaluationType: "STDIN", functionName: null };
};

const buildFunctionEvaluationWrapper = (
    learnerCode,
    functionName,
    rawInput,
    expectedOutput
) => {
    const serializedCode = JSON.stringify(learnerCode);
    const serializedInput = JSON.stringify(String(rawInput ?? ""));
    const serializedExpected = JSON.stringify(String(expectedOutput ?? ""));
    const serializedFunctionName = JSON.stringify(functionName);

    return `
import ast as __codelearn_ast
import contextlib as __codelearn_contextlib
import inspect as __codelearn_inspect
import io as __codelearn_io
import json as __codelearn_json

__codelearn_namespace = {}
__codelearn_stdout = __codelearn_io.StringIO()

with __codelearn_contextlib.redirect_stdout(__codelearn_stdout):
    exec(
        compile(
            __codelearn_json.loads(${JSON.stringify(serializedCode)}),
            "<learner_code>",
            "exec"
        ),
        __codelearn_namespace
    )

__codelearn_function_name = __codelearn_json.loads(${JSON.stringify(serializedFunctionName)})
__codelearn_function = __codelearn_namespace.get(__codelearn_function_name)

if not callable(__codelearn_function):
    raise TypeError("Learner function was not defined: " + __codelearn_function_name)

__codelearn_raw_input = __codelearn_json.loads(${serializedInput})
__codelearn_raw_expected = __codelearn_json.loads(${serializedExpected})

try:
    __codelearn_parsed_input = __codelearn_ast.literal_eval(__codelearn_raw_input)
except Exception:
    __codelearn_parsed_input = __codelearn_raw_input

__codelearn_parameters = [
    p for p in __codelearn_inspect.signature(__codelearn_function).parameters.values()
    if p.kind in (
        __codelearn_inspect.Parameter.POSITIONAL_ONLY,
        __codelearn_inspect.Parameter.POSITIONAL_OR_KEYWORD
    )
]

if len(__codelearn_parameters) == 1:
    __codelearn_args = [__codelearn_parsed_input]
elif isinstance(__codelearn_parsed_input, (tuple, list)):
    __codelearn_args = list(__codelearn_parsed_input)
else:
    __codelearn_args = [__codelearn_parsed_input]

with __codelearn_contextlib.redirect_stdout(__codelearn_stdout):
    __codelearn_actual = __codelearn_function(*__codelearn_args)

try:
    __codelearn_expected = __codelearn_ast.literal_eval(__codelearn_raw_expected)
except Exception:
    __codelearn_expected = __codelearn_raw_expected.strip()

__codelearn_passed = __codelearn_actual == __codelearn_expected

print(__codelearn_json.dumps({
    "passed": bool(__codelearn_passed),
    "actualType": type(__codelearn_actual).__name__
}, separators=(",", ":")))
`;
};

const prepareStdin = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    const normalized = String(value).replace(/\r\n/g, "\n");
    return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
};

const normalizeTextOutput = (value) =>
    String(value ?? "").replace(/\r\n/g, "\n").trim();

const parseFunctionEvaluationResult = (output) => {
    try {
        return JSON.parse(String(output || "").trim());
    } catch (error) {
        return null;
    }
};

module.exports = {
    extractFunctionName,
    resolveEvaluation,
    buildFunctionEvaluationWrapper,
    prepareStdin,
    normalizeTextOutput,
    parseFunctionEvaluationResult
};
