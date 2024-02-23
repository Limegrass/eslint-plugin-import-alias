import {
    loadAliasConfigs,
    loadTsconfig,
    resolveTsconfigFilePath,
} from "#src/alias-config";
import { rules } from "#src/index";
import { RuleTester } from "eslint";
import { existsSync } from "fs-extra";
import { mocked } from "jest-mock";

jest.mock("#src/alias-config");
jest.mock("fs-extra");

const mockLoadAliasConfig = mocked(loadAliasConfigs);
const mockLoadTsconfig = mocked(loadTsconfig);
const mockResolveTsconfigFilePath = mocked(resolveTsconfigFilePath);
const mockExistsSync = mocked(existsSync);

import path = require("path"); // object import required for overwriting
import { ConfigLoaderSuccessResult } from "tsconfig-paths";
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

const projectDirPart = "home";
function runTests(platform: "win32" | "posix") {
    beforeAll(() => {
        Object.assign(path, {
            sep: path[platform].sep,
            join: path[platform].join,
        });

        mockLoadTsconfig.mockReturnValue({
            baseUrl: ".",
        } as Partial<ConfigLoaderSuccessResult> as ConfigLoaderSuccessResult);

        const projectDir = path.join(
            "/",
            projectDirPart,
            "user",
            "git",
            "project"
        );
        mockResolveTsconfigFilePath.mockReturnValue(projectDir);

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

            // relative path overridden for root and exports from sibling module
            {
                code: `export * from "./rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: ".",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // relative path overridden for a specified directory and exports from sibling module
            {
                code: `export * from "./rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // relative path overridden for root and exports from parent module
            {
                code: `export * from "../rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: ".",
                                depth: 1,
                            },
                        ],
                    },
                ],
            },

            // relative path overridden for a specified directory and exports from parent module
            {
                code: `export * from "../rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 1,
                            },
                        ],
                    },
                ],
            },

            // pattern override for a glob pattern, exporting a sibling module
            {
                code: `export * from "./rules/bar";`,
                filename: "src/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index\\.(ts|js)$",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // pattern matches as RegExp for exporting sibling module
            {
                code: `export * from "./rules/bar";`,
                filename: "src/index.ts/foo.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index.ts",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // mixing relative path override with path and pattern
            {
                code: `export * from "./rules/foobar";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // depth priority by path when multiple overrides match
            {
                code: `export * from "../rules/potato";`,
                filename: "src/foo/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 0,
                            },
                            {
                                path: "src",
                                depth: 1,
                            },
                        ],
                    },
                ],
            },

            // depth priority by pattern when multiple overrides match
            {
                code: `export * from "../rules/potato";`,
                filename: "src/foo/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 1,
                            },
                        ],
                    },
                ],
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

            // (root) relative export from parent when only depth of 0 (sibling) is allowed
            {
                code: `export * from "../potato";`,
                errors: 1,
                filename: "src/rules/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: ".",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `export * from "#src/potato";`,
            },

            // (specified) relative export from parent when only depth of 0 (sibling) is allowed
            {
                code: `export * from "../potato";`,
                errors: 1,
                filename: "src/rules/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `export * from "#src/potato";`,
            },

            // relative path used in file that does not fall within override
            {
                code: `export * from "./potato";`,
                errors: 1,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src/rules",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `export * from "#src/potato";`,
            },

            // relative path used to too large of a depth
            {
                code: `export * from "../../potato";`,
                errors: 1,
                filename: "src/rules/foo/bar.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 1,
                            },
                        ],
                    },
                ],
                output: `export * from "#src/potato";`,
            },

            // override pattern used in file that does not fall within override
            {
                code: `export * from "./potato";`,
                errors: 1,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `export * from "#src/potato";`,
            },

            // does not match directory parts not a part of the project
            {
                code: `export * from "../rules/potato"`,
                errors: 1,
                filename: "src/foo/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: projectDirPart,
                                depth: 1,
                            },
                        ],
                    },
                ],
                output: `export * from "#rules/potato"`,
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

            // relative path overridden for root and exports from sibling module
            {
                code: `export { Potato } from "./rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: ".",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // relative path overridden for a specified directory and exports from sibling module
            {
                code: `export { Potato } from "./rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // relative path overridden for root and exports from parent module
            {
                code: `export { Potato } from "../rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: ".",
                                depth: 1,
                            },
                        ],
                    },
                ],
            },

            // relative path overridden for a specified directory and exports from parent module
            {
                code: `export { Potato } from "../rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 1,
                            },
                        ],
                    },
                ],
            },

            // pattern override for a glob pattern, exporting a sibling module
            {
                code: `export { Potato } from "./rules/bar";`,
                filename: "src/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index\\.(ts|js)$",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // pattern matches as RegExp for exporting sibling module
            {
                code: `export { Potato } from "./rules/bar";`,
                filename: "src/index.ts/foo.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index.ts",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // mixing relative path override with path and pattern
            {
                code: `export { Potato } from "./rules/foobar";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // depth priority by path when multiple overrides match
            {
                code: `export { Potato } from "../rules/potato";`,
                filename: "src/foo/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 0,
                            },
                            {
                                path: "src",
                                depth: 1,
                            },
                        ],
                    },
                ],
            },

            // depth priority by pattern when multiple overrides match
            {
                code: `export { Potato } from "../rules/potato";`,
                filename: "src/foo/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 1,
                            },
                        ],
                    },
                ],
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

            // (root) relative export from parent when only depth of 0 (sibling) is allowed
            {
                code: `export { Potato } from "../potato";`,
                errors: 1,
                filename: "src/rules/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: ".",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `export { Potato } from "#src/potato";`,
            },

            // (specified) relative export from parent when only depth of 0 (sibling) is allowed
            {
                code: `export { Potato } from "../potato";`,
                errors: 1,
                filename: "src/rules/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `export { Potato } from "#src/potato";`,
            },

            // relative path used in file that does not fall within override
            {
                code: `export { Potato } from "./potato";`,
                errors: 1,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src/rules",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `export { Potato } from "#src/potato";`,
            },

            // relative path used to too large of a depth
            {
                code: `export { Potato } from "../../potato";`,
                errors: 1,
                filename: "src/rules/foo/bar.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 1,
                            },
                        ],
                    },
                ],
                output: `export { Potato } from "#src/potato";`,
            },

            // override pattern used in file that does not fall within override
            {
                code: `export { Potato } from "./potato";`,
                errors: 1,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `export { Potato } from "#src/potato";`,
            },

            // does not match directory parts not a part of the project
            {
                code: `export { Potato } from "../rules/potato"`,
                errors: 1,
                filename: "src/foo/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: projectDirPart,
                                depth: 1,
                            },
                        ],
                    },
                ],
                output: `export { Potato } from "#rules/potato"`,
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

            // relative path overridden for root and imports from sibling module
            {
                code: `import { Potato } from "./rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: ".",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // relative path overridden for a specified directory and imports from sibling module
            {
                code: `import { Potato } from "./rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // relative path overridden for root and imports from parent module
            {
                code: `import { Potato } from "../rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: ".",
                                depth: 1,
                            },
                        ],
                    },
                ],
            },

            // relative path overridden for a specified directory and imports from parent module
            {
                code: `import { Potato } from "../rules/potato";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 1,
                            },
                        ],
                    },
                ],
            },

            // pattern override for a glob pattern, exporting a sibling module
            {
                code: `import { Potato } from "./rules/foobar"`,
                filename: "src/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index\\.(ts|js)$",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // pattern matches as RegExp for exporting sibling module
            {
                code: `import { Potato } from "./rules/bar";`,
                filename: "src/index.ts/foo.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index.ts",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // mixing relative path override with path and pattern
            {
                code: `import { Potato } from "./rules/foobar";`,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 0,
                            },
                        ],
                    },
                ],
            },

            // depth priority by path when multiple overrides match
            {
                code: `import { Potato } from "../rules/potato";`,
                filename: "src/foo/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 0,
                            },
                            {
                                path: "src",
                                depth: 1,
                            },
                        ],
                    },
                ],
            },

            // depth priority by pattern when multiple overrides match
            {
                code: `import { Potato } from "../rules/potato";`,
                filename: "src/foo/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 1,
                            },
                        ],
                    },
                ],
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

            // (root) relative import from parent when only depth of 0 (sibling) is allowed
            {
                code: `import { Potato } from "../potato";`,
                errors: 1,
                filename: "src/rules/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: ".",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `import { Potato } from "#src/potato";`,
            },

            // (specified) relative import from parent when only depth of 0 (sibling) is allowed
            {
                code: `import { Potato } from "../potato";`,
                errors: 1,
                filename: "src/rules/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `import { Potato } from "#src/potato";`,
            },

            // relative path used in file that does not fall within override
            {
                code: `import { Potato } from "./potato";`,
                errors: 1,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src/rules",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `import { Potato } from "#src/potato";`,
            },

            // relative path used to too large of a depth
            {
                code: `import { Potato } from "../../potato";`,
                errors: 1,
                filename: "src/rules/foo/bar.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                path: "src",
                                depth: 1,
                            },
                        ],
                    },
                ],
                output: `import { Potato } from "#src/potato";`,
            },

            // override pattern used in file that does not fall within override
            {
                code: `import { Potato } from "./potato";`,
                errors: 1,
                filename: "src/test.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: "index\\.(ts|js)",
                                depth: 0,
                            },
                        ],
                    },
                ],
                output: `import { Potato } from "#src/potato";`,
            },

            // does not match directory parts not a part of the project
            {
                code: `import { Potato } from "../rules/potato"`,
                errors: 1,
                filename: "src/foo/index.ts",
                options: [
                    {
                        relativeImportOverrides: [
                            {
                                pattern: projectDirPart,
                                depth: 1,
                            },
                        ],
                    },
                ],
                output: `import { Potato } from "#rules/potato"`,
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

                // relative path overridden for root and imports from sibling module
                {
                    code: `require("./rules/potato")`,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: ".",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                },

                // relative path overridden for a specified directory and imports from sibling module
                {
                    code: `require("./rules/potato")`,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                },

                // relative path overridden for root and imports from parent module
                {
                    code: `require("../rules/potato")`,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: ".",
                                    depth: 1,
                                },
                            ],
                        },
                    ],
                },

                // relative path overridden for a specified directory and imports from parent module
                {
                    code: `require("../rules/potato")`,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 1,
                                },
                            ],
                        },
                    ],
                },

                // pattern override for a glob pattern, exporting a sibling module
                {
                    code: `require("./rules/foobar")`,
                    filename: "src/index.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    pattern: "index\\.(ts|js)$",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                },

                // pattern matches as RegExp for exporting sibling module
                {
                    code: `require("./rules/foobar")`,
                    filename: "src/index.ts/foo.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    pattern: "index.ts",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                },

                // mixing relative path override with path and pattern
                {
                    code: `require("./rules/foobar")`,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 0,
                                },
                                {
                                    pattern: "index\\.(ts|js)",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                },

                // depth priority by path when multiple overrides match
                {
                    code: `require("../rules/potato")`,
                    filename: "src/foo/index.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    pattern: "index\\.(ts|js)",
                                    depth: 0,
                                },
                                {
                                    path: "src",
                                    depth: 1,
                                },
                            ],
                        },
                    ],
                },

                // depth priority by pattern when multiple overrides match
                {
                    code: `require("../rules/potato")`,
                    filename: "src/foo/index.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 0,
                                },
                                {
                                    pattern: "index\\.(ts|js)",
                                    depth: 1,
                                },
                            ],
                        },
                    ],
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
                // (root) relative import from parent when only depth of 0 (sibling) is allowed
                {
                    code: `require("../potato")`,
                    errors: 1,
                    filename: "src/rules/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: ".",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                    output: `require("#src/potato")`,
                },

                // (specified) relative import from parent when only depth of 0 (sibling) is allowed
                {
                    code: `require("../potato")`,
                    errors: 1,
                    filename: "src/rules/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                    output: `require("#src/potato")`,
                },

                // relative path used in file that does not fall within override
                {
                    code: `require("./potato")`,
                    errors: 1,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src/rules",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                    output: `require("#src/potato")`,
                },

                // relative path used to too large of a depth
                {
                    code: `require("../../potato")`,
                    errors: 1,
                    filename: "src/rules/foo/bar.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 1,
                                },
                            ],
                        },
                    ],
                    output: `require("#src/potato")`,
                },

                // override pattern used in file that does not fall within override
                {
                    code: `require("./potato")`,
                    errors: 1,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    pattern: "index\\.(ts|js)",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                    output: `require("#src/potato")`,
                },

                // does not match directory parts not a part of the project
                {
                    code: `require("../rules/potato")`,
                    errors: 1,
                    filename: "src/foo/index.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    pattern: projectDirPart,
                                    depth: 1,
                                },
                            ],
                        },
                    ],
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
                // relative path overridden for root and imports from sibling module
                {
                    code: `jest.mock("./rules/potato")`,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: ".",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                },
                // relative path overridden for a specified directory and imports from sibling module
                {
                    code: `jest.mock("./rules/potato")`,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                },
                // relative path overridden for root and imports from parent module
                {
                    code: `jest.mock("../rules/potato")`,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: ".",
                                    depth: 1,
                                },
                            ],
                        },
                    ],
                },
                // relative path overridden for a specified directory and imports from parent module
                {
                    code: `jest.mock("../rules/potato")`,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 1,
                                },
                            ],
                        },
                    ],
                },

                // pattern override for a glob pattern, exporting a sibling module
                {
                    code: `jest.mock("./rules/foobar")`,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    pattern: "test\\.(ts|js)$",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                },

                // pattern matches as RegExp for exporting sibling module
                {
                    code: `jest.mock("./rules/foobar")`,
                    filename: "src/index.ts/foo.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    pattern: "index.ts",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                },

                // mixing relative path override with path and pattern
                {
                    code: `jest.mock("./rules/foobar")`,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 0,
                                },
                                {
                                    pattern: "index\\.(ts|js)",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                },
                // depth priority by path when multiple overrides match
                {
                    code: `jest.mock("../rules/potato")`,
                    filename: "src/foo/index.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    pattern: "index\\.(ts|js)",
                                    depth: 0,
                                },
                                {
                                    path: "src",
                                    depth: 1,
                                },
                            ],
                        },
                    ],
                },

                // depth priority by pattern when multiple overrides match
                {
                    code: `jest.mock("../rules/potato")`,
                    filename: "src/foo/index.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 0,
                                },
                                {
                                    pattern: "index\\.(ts|js)",
                                    depth: 1,
                                },
                            ],
                        },
                    ],
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

                // (root) relative import from parent when only depth of 0 (sibling) is allowed
                {
                    code: `jest.mock("../potato")`,
                    errors: 1,
                    filename: "src/rules/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: ".",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                    output: `jest.mock("#src/potato")`,
                },

                // (specified) relative import from parent when only depth of 0 (sibling) is allowed
                {
                    code: `jest.mock("../potato")`,
                    errors: 1,
                    filename: "src/rules/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                    output: `jest.mock("#src/potato")`,
                },

                // relative path used in file that does not fall within override
                {
                    code: `jest.mock("./potato")`,
                    errors: 1,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src/rules",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                    output: `jest.mock("#src/potato")`,
                },

                // relative path used to too large of a depth
                {
                    code: `jest.mock("../../potato")`,
                    errors: 1,
                    filename: "src/rules/foo/bar.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    path: "src",
                                    depth: 1,
                                },
                            ],
                        },
                    ],
                    output: `jest.mock("#src/potato")`,
                },

                // override pattern used in file that does not fall within override
                {
                    code: `jest.mock("./potato")`,
                    errors: 1,
                    filename: "src/test.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    pattern: "index\\.(ts|js)",
                                    depth: 0,
                                },
                            ],
                        },
                    ],
                    output: `jest.mock("#src/potato")`,
                },

                // does not match directory parts not a part of the project
                {
                    code: `jest.mock("../rules/potato")`,
                    errors: 1,
                    filename: "src/foo/index.ts",
                    options: [
                        {
                            relativeImportOverrides: [
                                {
                                    pattern: projectDirPart,
                                    depth: 1,
                                },
                            ],
                        },
                    ],
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
                        code: `potato("../src-app/rules/potato");`,
                        filename: "src/test.ts",
                        options: [{ aliasImportFunctions: ["potato"] }],
                    },
                    // selects correct alias despite #src being a partial match
                    // and comes first/is shorter as an alias
                    {
                        code: `potato("../src-test/rules/potato")`,
                        filename: "src/test.ts",
                        options: [{ aliasImportFunctions: ["potato"] }],
                    },

                    // relative path overridden for root and imports from sibling module
                    {
                        code: `potato("./rules/potato")`,
                        filename: "src/test.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        path: ".",
                                        depth: 0,
                                    },
                                ],
                            },
                        ],
                    },

                    // relative path overridden for a specified directory and imports from sibling module
                    {
                        code: `potato("./rules/potato")`,
                        filename: "src/test.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        path: "src",
                                        depth: 0,
                                    },
                                ],
                            },
                        ],
                    },

                    // relative path overridden for root and imports from parent module
                    {
                        code: `potato("../rules/potato")`,
                        filename: "src/test.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        path: ".",
                                        depth: 1,
                                    },
                                ],
                            },
                        ],
                    },

                    // relative path overridden for a specified directory and imports from parent module
                    {
                        code: `potato("../rules/potato")`,
                        filename: "src/test.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        path: "src",
                                        depth: 1,
                                    },
                                ],
                            },
                        ],
                    },

                    // pattern override for a glob pattern, exporting a sibling module
                    {
                        code: `potato("./rules/foobar")`,
                        filename: "src/index.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        pattern: "index\\.(ts|js)$",
                                        depth: 0,
                                    },
                                ],
                            },
                        ],
                    },

                    // pattern matches as RegExp for exporting sibling module
                    {
                        code: `potato("./rules/foobar")`,
                        filename: "src/index.ts/foo.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        pattern: "index.ts",
                                        depth: 0,
                                    },
                                ],
                            },
                        ],
                    },

                    // mixing relative path override with path and pattern
                    {
                        code: `potato("./rules/foobar")`,
                        filename: "src/test.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        path: "src",
                                        depth: 0,
                                    },
                                    {
                                        pattern: "index\\.(ts|js)",
                                        depth: 0,
                                    },
                                ],
                            },
                        ],
                    },

                    // depth priority by path when multiple overrides match
                    {
                        code: `potato("../rules/potato")`,
                        filename: "src/foo/index.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        pattern: "index\\.(ts|js)",
                                        depth: 0,
                                    },
                                    {
                                        path: "src",
                                        depth: 1,
                                    },
                                ],
                            },
                        ],
                    },

                    // depth priority by pattern when multiple overrides match
                    {
                        code: `potato("../rules/potato")`,
                        filename: "src/foo/index.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        path: "src",
                                        depth: 0,
                                    },
                                    {
                                        pattern: "index\\.(ts|js)",
                                        depth: 1,
                                    },
                                ],
                            },
                        ],
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

                    // (root) relative import from parent when only depth of 0 (sibling) is allowed
                    {
                        code: `potato("../potato")`,
                        errors: 1,
                        filename: "src/rules/test.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        path: ".",
                                        depth: 0,
                                    },
                                ],
                            },
                        ],
                        output: `potato("#src/potato")`,
                    },

                    // (specified) relative import from parent when only depth of 0 (sibling) is allowed
                    {
                        code: `potato("../potato")`,
                        errors: 1,
                        filename: "src/rules/test.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        path: "src",
                                        depth: 0,
                                    },
                                ],
                            },
                        ],
                        output: `potato("#src/potato")`,
                    },

                    // relative path used in file that does not fall within override
                    {
                        code: `potato("./potato")`,
                        errors: 1,
                        filename: "src/test.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        path: "src/rules",
                                        depth: 0,
                                    },
                                ],
                            },
                        ],
                        output: `potato("#src/potato")`,
                    },

                    // relative path used to too large of a depth
                    {
                        code: `potato("../../potato")`,
                        errors: 1,
                        filename: "src/rules/foo/bar.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        path: "src",
                                        depth: 1,
                                    },
                                ],
                            },
                        ],
                        output: `potato("#src/potato")`,
                    },

                    // override pattern used in file that does not fall within override
                    {
                        code: `potato("./potato")`,
                        errors: 1,
                        filename: "src/test.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        pattern: "index\\.(ts|js)",
                                        depth: 0,
                                    },
                                ],
                            },
                        ],
                        output: `potato("#src/potato")`,
                    },

                    // does not match directory parts not a part of the project
                    {
                        code: `potato("../rules/potato")`,
                        errors: 1,
                        filename: "src/foo/index.ts",
                        options: [
                            {
                                aliasImportFunctions: ["potato"],
                                relativeImportOverrides: [
                                    {
                                        pattern: projectDirPart,
                                        depth: 1,
                                    },
                                ],
                            },
                        ],
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
