# @limegrass/eslint-plugin-import-alias

Enforce use of defined aliases in TSConfig/JSConfig through ESLint.

## Why

- Automatic imports by tsserver resolve to relative paths that can be normalized.
- It's easier to refactor by finding and replacing an absolute module path
  without worrying about crafting the regex for `../` and `./`

## Requirements

- Node 14+

## Install

```shell
npm install --save-dev @limegrass/eslint-plugin-import-alias eslint
```

This plugin relies on an alias configuration in `tsconfig.json`, `jsconfig.json`,
or a config with the same schema and a path given as `aliasConfigPath` in its rules
settings. See the [rules documentation][docs-import-alias] for more detail.

## Configuration

This plugin supports multiple configuration parameters which can affect how it handles
relative paths, base URLs, and more. Check the [rules documentation][docs-import-alias]
and [example configurations](./examples) for more detailed configurations.

```jsonc
// .eslintrc
{
    "plugins": ["@limegrass/import-alias"],
    "rules": {
        "@limegrass/import-alias/import-alias": "error",
    },
}
```

The configuration above is also equivalent to

```jsonc
// .eslintrc
{
    "extends": [
        // ... - your other extends, such as `"eslint:recommended"`
        "plugin:@limegrass/import-alias/recommended",
    ],
}
```

Note that while the above is for the deprecated `.eslintrc` format,
this package does support ESLint@^9 and its flat config format.

See [the flat-config example](./examples/flat-config/) for details.

[docs-import-alias]: docs/rules/import-alias.md
