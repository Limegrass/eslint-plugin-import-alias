import { loadAliasConfigs } from "#src/alias-config";
import { rules } from "#src/index";
import { RuleTester } from "eslint";
import { existsSync } from "fs-extra";
import { mocked } from "jest-mock";

jest.mock("#src/alias-config");
jest.mock("fs-extra");

const mockLoadAliasConfig = mocked(loadAliasConfigs);
const mockExistsSync = mocked(existsSync);

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
                    ...args.map((s: string) => s.replace(/\\/g, "/"))
                );
            },
        },
    };
});

const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 2015, sourceType: "module" },
});
const cwd = process.cwd();

function runTests(platform: "win32" | "posix") {
    beforeAll(() => {
        Object.assign(path, {
            sep: path[platform].sep,
            join: path[platform].join,
        });

        mockExistsSync.mockReturnValue(true);
        mockLoadAliasConfig.mockReturnValue([
            {
                alias: "#src",
                path: {
                    absolute: path.join(cwd, "src"),
                },
            },
            {
                alias: "#src-test",
                path: {
                    absolute: path.join(cwd, "src"),
                },
            },
            {
                alias: "#rules",
                path: {
                    absolute: path.join(cwd, "src", "rules"),
                },
            },
        ]);
    });

    ruleTester.run("ExportAllDeclaration", rules["import-alias"], {
        valid: [
            // most specific aliases
            {
                code: `export * from '#src/potato';`,
                filename: "src/test.ts",
            },
            {
                code: `export * from '#rules/potato';`,
                filename: "src/test.ts",
            },
            // does not apply for partial path match
            {
                code: `export * from '../src-app/rules/potato';`,
                filename: "src/test.ts",
            },
            // selects correct alias despite #src being a partial match
            // and comes first/is shorter as an alias
            {
                code: `export * from '../src-test/rules/potato';`,
                filename: "src/test.ts",
            },
            // does not affect source-less exports
            {
                code: `export default TestFn = () => {}`,
                filename: "src/test.ts",
            },
        ],
        invalid: [
            // more specific alias
            {
                code: `export * from '#src/rules/potato';`,
                errors: 1,
                filename: "src/test.ts",
                output: "export * from '#rules/potato';",
            },
            // relative path with more specific alias
            {
                code: `export * from './rules/potato';`,
                errors: 1,
                filename: "src/test.ts",
                output: "export * from '#rules/potato';",
            },
            // knows specific alias from path of current file
            {
                code: `export * from './potato';`,
                errors: 1,
                filename: "src/rules/test.ts",
                output: "export * from '#rules/potato';",
            },
            // relative path backwards with more specific alias
            {
                code: `export * from '../src/rules/potato';`,
                errors: 1,
                filename: "src/test.ts",
                output: "export * from '#rules/potato';",
            },
        ],
    });

    ruleTester.run("ExportNamedDeclaration", rules["import-alias"], {
        valid: [
            // most specific aliases
            {
                code: `export { Potato } from '#src/potato';`,
                filename: "src/test.ts",
            },
            {
                code: `export { Potato } from '#rules/potato';`,
                filename: "src/test.ts",
            },
            // does not apply for partial path match
            {
                code: `export { Potato } from '../src-app/rules/potato';`,
                filename: "src/test.ts",
            },
            // selects correct alias despite #src being a partial match
            // and comes first/is shorter as an alias
            {
                code: `export { Potato } from '../src-test/rules/potato';`,
                filename: "src/test.ts",
            },
            // does not affect source-less named exports
            {
                code: `export const TestFn = () => {}`,
                filename: "src/test.ts",
            },
            // does not affect source-less named exports
            {
                code: `const TestFn = () => {}; export { TestFn };`,
                filename: "src/test.ts",
            },
        ],
        invalid: [
            // more specific alias
            {
                code: `export { Potato } from '#src/rules/potato';`,
                errors: 1,
                filename: "src/test.ts",
                output: "export { Potato } from '#rules/potato';",
            },
            // relative path with more specific alias
            {
                code: `export { Potato } from './rules/potato';`,
                errors: 1,
                filename: "src/test.ts",
                output: "export { Potato } from '#rules/potato';",
            },
            // knows specific alias from path of current file
            {
                code: `export { Potato } from './potato';`,
                errors: 1,
                filename: "src/rules/test.ts",
                output: "export { Potato } from '#rules/potato';",
            },
            // relative path backwards with more specific alias
            {
                code: `export { Potato } from '../src/rules/potato';`,
                errors: 1,
                filename: "src/test.ts",
                output: "export { Potato } from '#rules/potato';",
            },
        ],
    });

    ruleTester.run("ImportDeclaration", rules["import-alias"], {
        valid: [
            // most specific aliases
            {
                code: `import { Potato } from '#src/potato';`,
                filename: "src/test.ts",
            },
            {
                code: `import { Potato } from '#rules/potato';`,
                filename: "src/test.ts",
            },
            // does not apply for partial path match
            {
                code: `import { Potato } from '../src-app/rules/potato';`,
                filename: "src/test.ts",
            },
            // selects correct alias despite #src being a partial match
            // and comes first/is shorter as an alias
            {
                code: `import { Potato } from '../src-test/rules/potato';`,
                filename: "src/test.ts",
            },
        ],
        invalid: [
            // more specific alias
            {
                code: `import { Potato } from '#src/rules/potato';`,
                errors: 1,
                filename: "src/test.ts",
                output: "import { Potato } from '#rules/potato';",
            },
            // relative path with more specific alias
            {
                code: `import { Potato } from './rules/potato';`,
                errors: 1,
                filename: "src/test.ts",
                output: "import { Potato } from '#rules/potato';",
            },
            // knows specific alias from path of current file
            {
                code: `import { Potato } from './potato';`,
                errors: 1,
                filename: "src/rules/test.ts",
                output: "import { Potato } from '#rules/potato';",
            },
            // relative path backwards with more specific alias
            {
                code: `import { Potato } from '../src/rules/potato';`,
                errors: 1,
                filename: "src/test.ts",
                output: "import { Potato } from '#rules/potato';",
            },
        ],
    });

    describe("CallExpression", () => {
        ruleTester.run("require support by default", rules["import-alias"], {
            valid: [
                // most specific aliases
                {
                    code: `require("#src/potato")`,
                    filename: "src/test.ts",
                },
                {
                    code: `require("#rules/potato")`,
                    filename: "src/test.ts",
                },
                // does not apply for partial path match
                {
                    code: `require('../src-app/rules/potato')`,
                    filename: "src/test.ts",
                },
                // selects correct alias despite #src being a partial match
                // and comes first/is shorter as an alias
                {
                    code: `require('../src-test/rules/potato')`,
                    filename: "src/test.ts",
                },
            ],
            invalid: [
                // more specific alias
                {
                    code: `require("#src/rules/potato")`,
                    errors: 1,
                    filename: "src/test.ts",
                    output: `require("#rules/potato")`,
                },
                // relative path with more specific alias
                {
                    code: `require("./rules/potato")`,
                    errors: 1,
                    filename: "src/test.ts",
                    output: `require("#rules/potato")`,
                },
                // knows specific alias from path of current file
                {
                    code: `require("./potato")`,
                    errors: 1,
                    filename: "src/rules/test.ts",
                    output: `require("#rules/potato")`,
                },
                // relative path backwards with more specific alias
                {
                    code: `require("../src/rules/potato")`,
                    errors: 1,
                    filename: "src/test.ts",
                    output: `require("#rules/potato")`,
                },
            ],
        });

        ruleTester.run("jest.mock support by default", rules["import-alias"], {
            valid: [
                // most specific aliases
                {
                    code: `jest.mock("#src/potato")`,
                    filename: "src/test.ts",
                },
                {
                    code: `jest.mock("#rules/potato")`,
                    filename: "src/test.ts",
                },
                // does not apply for partial path match
                {
                    code: `jest.mock('../src-app/rules/potato')`,
                    filename: "src/test.ts",
                },
                // selects correct alias despite #src being a partial match
                // and comes first/is shorter as an alias
                {
                    code: `jest.mock('../src-test/rules/potato')`,
                    filename: "src/test.ts",
                },
            ],
            invalid: [
                // more specific alias
                {
                    code: `jest.mock("#src/rules/potato")`,
                    errors: 1,
                    filename: "src/test.ts",
                    output: `jest.mock("#rules/potato")`,
                },
                // relative path with more specific alias
                {
                    code: `jest.mock("./rules/potato")`,
                    errors: 1,
                    filename: "src/test.ts",
                    output: `jest.mock("#rules/potato")`,
                },
                // knows specific alias from path of current file
                {
                    code: `jest.mock("./potato")`,
                    errors: 1,
                    filename: "src/rules/test.ts",
                    output: `jest.mock("#rules/potato")`,
                },
                // relative path backwards with more specific alias
                {
                    code: `jest.mock("../src/rules/potato")`,
                    errors: 1,
                    filename: "src/test.ts",
                    output: `jest.mock("#rules/potato")`,
                },
            ],
        });

        ruleTester.run(
            "rudimentary custom function support",
            rules["import-alias"],
            {
                valid: [
                    // most specific aliases
                    {
                        code: `potato("#src/potato")`,
                        filename: "src/test.ts",
                        options: [{ aliasImportFunctions: ["potato"] }],
                    },
                    {
                        code: `potato("#rules/potato")`,
                        filename: "src/test.ts",
                        options: [{ aliasImportFunctions: ["potato"] }],
                    },
                    // does not apply for partial path match
                    {
                        code: `potato('../src-app/rules/potato');`,
                        filename: "src/test.ts",
                    },
                    // selects correct alias despite #src being a partial match
                    // and comes first/is shorter as an alias
                    {
                        code: `potato('../src-test/rules/potato')`,
                        filename: "src/test.ts",
                    },
                ],
                invalid: [
                    // more specific alias
                    {
                        code: `potato("#src/rules/potato")`,
                        errors: 1,
                        filename: "src/test.ts",
                        options: [{ aliasImportFunctions: ["potato"] }],
                        output: `potato("#rules/potato")`,
                    },
                    // relative path with more specific alias
                    {
                        code: `potato("./rules/potato")`,
                        errors: 1,
                        filename: "src/test.ts",
                        options: [{ aliasImportFunctions: ["potato"] }],
                        output: `potato("#rules/potato")`,
                    },
                    // knows specific alias from path of current file
                    {
                        code: `potato("./potato")`,
                        errors: 1,
                        filename: "src/rules/test.ts",
                        options: [{ aliasImportFunctions: ["potato"] }],
                        output: `potato("#rules/potato")`,
                    },
                    // relative path backwards with more specific alias
                    {
                        code: `potato("../src/rules/potato")`,
                        errors: 1,
                        filename: "src/test.ts",
                        options: [{ aliasImportFunctions: ["potato"] }],
                        output: `potato("#rules/potato")`,
                    },
                ],
            }
        );
    });
}

describe("Unix", () => {
    runTests("posix");
});

describe("Windows", () => {
    runTests("win32");
});
