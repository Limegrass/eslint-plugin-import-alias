import { loadAliasConfigs, loadTsconfig } from "#src/alias-config";
import { rules } from "#src/index";
import { ImportAliasOptions } from "#src/rules/import-alias";
import { RuleTester } from "eslint";
import { existsSync, readdirSync } from "fs-extra";
import { mocked } from "jest-mock";
import {
    getMockAliasConfig,
    mockReaddir,
    CUSTOM_CALL_EXPRESSION_FUNCTION,
} from "#root/tests/rules/import-alias.config";
import {
    generateValidTestCase,
    getValidTestCaseParams,
} from "#root/tests/rules/import-alias.valid-cases";
import {
    generateInvalidTestCase,
    getInvalidTestCaseParams,
} from "#root/tests/rules/import-alias.invalid-cases";
import { ConfigLoaderSuccessResult } from "tsconfig-paths";

jest.mock("#src/alias-config");
jest.mock("fs-extra");

const mockLoadAliasConfig = mocked(loadAliasConfigs);
const mockLoadTsconfig = mocked(loadTsconfig);
const mockExistsSync = mocked(existsSync);
const mockReaddirSync = mocked(readdirSync);

// eslint-disable-next-line @typescript-eslint/no-require-imports
import path = require("path"); // object import required for overwriting
jest.mock("path", () => {
    // path must be redefined as object so we can overwrite it
    const original = jest.requireActual("path");
    return {
        ...original,
        posix: {
            ...original.posix,
            // required when running the tests on windows
            join: (...args: string[]) => {
                return original.posix.join(
                    ...args.map((s: string) => s.replace(/\\/g, "/")),
                );
            },
        },
    };
});

const ruleTester = new RuleTester({
    languageOptions: {
        parserOptions: { ecmaVersion: 2015, sourceType: "module" },
    },
});

const cwd = process.cwd();

const projectDirPart = cwd;

const NO_OPTION_OVERRIDES: Partial<ImportAliasOptions> = {};
function runTests(platform: "win32" | "posix") {
    beforeAll(() => {
        const projectDir = cwd;

        Object.assign(path, {
            ...path[platform],
            cwd: projectDir,
        });

        mockReaddirSync.mockImplementation(mockReaddir as typeof readdirSync);

        mockLoadTsconfig.mockReturnValue({
            baseUrl: ".",
            configFileAbsolutePath: path[platform].join(
                projectDir,
                "tsconfig.json",
            ),
        } as Partial<ConfigLoaderSuccessResult> as ConfigLoaderSuccessResult);

        const mockConfigs = getMockAliasConfig(path, platform, projectDir);
        mockLoadAliasConfig.mockReturnValue(mockConfigs);

        mockExistsSync.mockReturnValue(true);
    });

    ruleTester.run("ExportAllDeclaration", rules["import-alias"], {
        valid: [
            ...getValidTestCaseParams(NO_OPTION_OVERRIDES).map((params) =>
                generateValidTestCase("ExportAllDecalaration", params),
            ),
            {
                name: "source-less default export [export default TestFn = () => {}]",
                code: `export default TestFn = () => {}`,
                filename: "src/test.ts",
            },
        ],
        invalid: [
            ...getInvalidTestCaseParams(
                projectDirPart,
                NO_OPTION_OVERRIDES,
            ).map((params) =>
                generateInvalidTestCase("ExportAllDecalaration", params),
            ),
        ],
    });

    ruleTester.run("ExportNamedDeclaration", rules["import-alias"], {
        valid: [
            ...getValidTestCaseParams(NO_OPTION_OVERRIDES).map((params) =>
                generateValidTestCase("ExportNamedDecalaration", params),
            ),
            {
                name: `source-less named export inline [export const TestFn = () => {}]`,
                code: `export const TestFn = () => {}`,
                filename: "src/code.ts",
            },
            {
                name: `source-less named default export [const TestFn = () => {}; export { TestFn };]`,
                code: `const TestFn = () => {}; export { TestFn };`,
                filename: "src/code.ts",
            },
        ],
        invalid: [
            ...getInvalidTestCaseParams(
                projectDirPart,
                NO_OPTION_OVERRIDES,
            ).map((params) =>
                generateInvalidTestCase("ExportNamedDecalaration", params),
            ),
        ],
    });

    ruleTester.run("ImportDeclaration", rules["import-alias"], {
        valid: [
            ...getValidTestCaseParams(NO_OPTION_OVERRIDES).map((params) =>
                generateValidTestCase("ImportDeclaration", params),
            ),
        ],
        invalid: [
            ...getInvalidTestCaseParams(
                projectDirPart,
                NO_OPTION_OVERRIDES,
            ).map((params) =>
                generateInvalidTestCase("ImportDeclaration", params),
            ),
        ],
    });

    describe("CallExpression", () => {
        ruleTester.run("`require` support by default", rules["import-alias"], {
            valid: [
                ...getValidTestCaseParams(NO_OPTION_OVERRIDES).map((params) =>
                    generateValidTestCase("RequireCallExpression", params),
                ),
            ],
            invalid: [
                ...getInvalidTestCaseParams(
                    projectDirPart,
                    NO_OPTION_OVERRIDES,
                ).map((params) =>
                    generateInvalidTestCase("RequireCallExpression", params),
                ),
            ],
        });

        ruleTester.run(
            "`jest.mock` support by default",
            rules["import-alias"],
            {
                valid: [
                    ...getValidTestCaseParams(NO_OPTION_OVERRIDES).map(
                        (params) =>
                            generateValidTestCase(
                                "JestMockCallExpression",
                                params,
                            ),
                    ),
                ],
                invalid: [
                    ...getInvalidTestCaseParams(
                        projectDirPart,
                        NO_OPTION_OVERRIDES,
                    ).map((params) =>
                        generateInvalidTestCase(
                            "JestMockCallExpression",
                            params,
                        ),
                    ),
                ],
            },
        );

        const customCallExpressionOptionOverrides = {
            aliasImportFunctions: [CUSTOM_CALL_EXPRESSION_FUNCTION],
        };
        ruleTester.run("custom CallExpression support", rules["import-alias"], {
            valid: [
                ...getValidTestCaseParams(
                    customCallExpressionOptionOverrides,
                ).map((params) =>
                    generateValidTestCase("CustomCallExpression", params),
                ),
            ],
            invalid: [
                ...getInvalidTestCaseParams(
                    projectDirPart,
                    customCallExpressionOptionOverrides,
                ).map((params) =>
                    generateInvalidTestCase("CustomCallExpression", params),
                ),
            ],
        });
    });
}

describe("Unix", () => {
    runTests("posix");
});

describe("Windows", () => {
    runTests("win32");
});
