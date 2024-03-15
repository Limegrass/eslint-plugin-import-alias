import { sync as findUpSync } from "find-up";
import micromatch from "micromatch";
import { join as joinPath } from "path";
import {
    ConfigLoaderResult,
    ConfigLoaderSuccessResult,
    loadConfig,
} from "tsconfig-paths";

type AliasConfig = {
    alias: string;
    path: {
        /** Glob values using absolute paths */
        absolute: string;
    };
};

function resolveTsconfigFilePath(
    startDirs: string[],
    aliasConfigPath?: string
) {
    const configFilePath = startDirs
        .map((dir) => {
            return findUpSync(
                [aliasConfigPath, "tsconfig.json", "jsconfig.json"].filter(
                    Boolean
                ) as string[],
                { cwd: dir }
            );
        })
        .find((tsconfigPath) => !!tsconfigPath);

    if (!configFilePath) {
        throw new Error(
            "cannot find TSConfig or JSConfig, try assigning aliasConfigPath"
        );
    }

    return configFilePath;
}

function loadTsconfig(configFilePath: string) {
    let config: ConfigLoaderResult;
    try {
        config = loadConfig(configFilePath);
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(
                `SyntaxError in TSConfig/JSConfig: ${error.message}`
            );
        }
        throw error;
    }

    if (config.resultType !== "success") {
        throw new Error(
            `validate tsconfig or jsconfig provided and ensure compilerOptions.baseUrl is set: ${config.message}`
        );
    }

    return config;
}

function loadAliasConfigs(
    config: ConfigLoaderSuccessResult,
    projectBaseDir: string
): AliasConfig[] {
    return Object.entries(config.paths).reduce(
        (configs, [aliasGlob, aliasPaths]) => {
            aliasPaths.forEach((aliasPath) => {
                const relativePathBase = micromatch.scan(aliasPath).base;
                configs.push({
                    alias: micromatch.scan(aliasGlob).base,
                    path: {
                        absolute: joinPath(projectBaseDir, relativePathBase),
                    },
                });
            });
            return configs;
        },
        [] as AliasConfig[]
    );
}

export { AliasConfig, loadAliasConfigs, loadTsconfig, resolveTsconfigFilePath };
