import { Config } from "@jest/types";

const config: Config.InitialOptions = {
    roots: ["<rootDir>/tests"],
    testMatch: ["<rootDir>/tests/**/*.test.ts"],
    testEnvironment: "node",
    transform: {
        "^.+\\.(js|ts)$": ["ts-jest", {
            isolatedModules: true,
            diagnostics: false,
        }],
    },
    moduleNameMapper: {
        "#src/(.*)": "<rootDir>/src/$1",
        "#root/(.*)": "<rootDir>/$1",
    },
    moduleFileExtensions: ["js", "ts"],
};

// eslint-disable-next-line import/no-default-export
export default config;
