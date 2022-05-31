import { loadAliasConfigs } from "#src/alias-config";
import { rules } from "#src/index";
import { RuleTester } from "eslint";
import { existsSync } from "fs-extra";
import { mocked } from "jest-mock";

jest.mock("#src/alias-config");
jest.mock("fs-extra");

const mockLoadAliasConfig = mocked(loadAliasConfigs);
const mockExistsSync = mocked(existsSync);

const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 2015, sourceType: "module" },
});

const cwd = process.cwd();
beforeEach(() => {
    mockExistsSync.mockReturnValue(true);
    mockLoadAliasConfig.mockReturnValue([
        {
            alias: "#src",
            path: {
                absolute: `${cwd}/src`,
            },
        },
        {
            alias: "#rules",
            path: {
                absolute: `${cwd}/src/rules`,
            },
        },
    ]);
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
