import { Config } from "@jest/types";

const config: Config.InitialOptions = {
    roots: ["<rootDir>/tests"],
    testMatch: ["<rootDir>/tests/**/*.test.ts"],
    preset: "ts-jest",
    transform: {
        "^.+\\.(js|ts)$": [
            "ts-jest",
            {
                isolatedModules: true,
                diagnostics: false,
            },
        ],
    },
    // transformIgnorePatterns: ["node_modules/(?!(@eslint))"],
    moduleNameMapper: {
        "#src/(.*)": "<rootDir>/src/$1",
        "#root/(.*)": "<rootDir>/$1",
    },
    moduleFileExtensions: ["js", "ts"],
};

export = config;
