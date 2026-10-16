$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$controllerPath = Join-Path $repoRoot "backend\src\controllers\codeController.js"

if (-not (Test-Path $controllerPath)) {
    throw "codeController.js not found at $controllerPath"
}

$source = Get-Content -Raw -Encoding UTF8 $controllerPath
$backupPath = "$controllerPath.before-evaluator-fix-$(Get-Date -Format 'yyyyMMdd-HHmmss').bak"
Set-Content -Path $backupPath -Value $source -Encoding UTF8

# 1. Wire the generic evaluator service without touching the rest of the controller.
if ($source -notmatch 'taskEvaluationService') {
    $needle = 'const Task = require("../models/Task");'
    if (-not $source.Contains($needle)) {
        throw "Could not find Task import marker. Aborting without changing the controller."
    }
    $replacement = @'
const Task = require("../models/Task");
const {
    resolveEvaluation,
    buildFunctionEvaluationWrapper,
    prepareStdin,
    normalizeTextOutput,
    parseFunctionEvaluationResult
} = require("../services/taskEvaluationService");
'@
    $source = $source.Replace($needle, $replacement.TrimEnd())
}

# 2. Remove the old local FUNCTION wrapper so there is only one evaluator implementation.
$oldWrapperPattern = '(?s)\r?\nconst buildFunctionWrapper = \(learnerCode, functionName, args\) => \{.*?\r?\n\};\r?\n\r?\n'
$afterWrapper = [regex]::Replace($source, $oldWrapperPattern, "`r`n", 1)
if ($afterWrapper -eq $source -and $source -match 'const buildFunctionWrapper') {
    throw "Old buildFunctionWrapper was found but could not be removed. Aborting."
}
$source = $afterWrapper

# 3. Replace the task evaluation metadata block with the global resolver.
$metadataPattern = '(?s)        const evaluationType = task\.evaluationType \|\| "STDIN";.*?        const testCases = task\.testCases \|\| \[\];'
$metadataReplacement = @'
        const {
            evaluationType,
            functionName
        } = resolveEvaluation(task);

        if (evaluationType === "INVALID") {
            return res.status(400).json({
                success: false,
                message: "The task has an invalid function evaluation configuration"
            });
        }

        const testCases = task.testCases || [];
'@.TrimEnd()
$metadataMatches = [regex]::Matches($source, $metadataPattern)
if ($metadataMatches.Count -ne 1) {
    throw "Expected exactly one task evaluation metadata block; found $($metadataMatches.Count). Aborting."
}
$source = [regex]::Replace($source, $metadataPattern, $metadataReplacement, 1)

# 4. Replace the per-test evaluation loop. FUNCTION tasks are evaluated by return value;
#    STDIN tasks continue to receive the exact stored test input as stdin.
$loopPattern = '(?s)        const normalizeOutput = \(value\) =>.*?        const totalTests = testCases\.length;'
$loopReplacement = @'
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            let execution;
            let passed = false;

            if (evaluationType === "FUNCTION") {
                const wrappedCode = buildFunctionEvaluationWrapper(
                    code,
                    functionName,
                    testCase.input,
                    testCase.expectedOutput
                );

                execution = await executePython(wrappedCode);

                if (execution.success) {
                    const functionResult = parseFunctionEvaluationResult(execution.output);
                    passed = Boolean(functionResult?.passed);
                }
            } else {
                const testInput = prepareStdin(testCase.input);
                execution = await executePython(code, testInput);

                passed =
                    execution.success &&
                    normalizeTextOutput(execution.output) ===
                        normalizeTextOutput(testCase.expectedOutput);
            }

            if (passed) {
                testsPassed++;
            }

            if (!execution.success) {
                hadRuntimeError = true;
            }

            // Never expose hidden test inputs or expected outputs.
            results.push({
                testCase: i + 1,
                passed,
                status: execution.success
                    ? "EXECUTED"
                    : "RUNTIME_ERROR"
            });
        }

        const totalTests = testCases.length;
'@.TrimEnd()
$loopMatches = [regex]::Matches($source, $loopPattern)
if ($loopMatches.Count -ne 1) {
    throw "Expected exactly one test evaluation loop; found $($loopMatches.Count). Aborting."
}
$source = [regex]::Replace($source, $loopPattern, $loopReplacement, 1)

Set-Content -Path $controllerPath -Value $source -Encoding UTF8

Write-Host "Evaluator fix applied successfully."
Write-Host "Backup created: $backupPath"
Write-Host "Updated: $controllerPath"
