# import-alias/import-alias: Encourage use of defined aliases

## Rule Details

Given the following `tsconfig.json`

```jsonc
{
    // ...
    "compilerOptions": {
        // ...
        "paths": {
            "#src/*": ["src/*"],
            "#rules/*": ["src/rules/*"],
        },
    },
}
```

### Valid

```ts
import { Potato } from "#src/potato";
import { garbage } from "#rules/garbage";
import { Foo } from "external-module";

require("#src/potato");
jest.mock("#rules/garbage");
```

### Invalid

Given a file in `./src`

```ts
import { Potato } from "./potato"; // relative paths are not okay
import { garbage } from "#src/rules/garbage"; // import can be shortened

require("./potato");
jest.mock("#src/rules/garbage");
```

## Configuration

To add new functions which takes a single string parameter,
you can define your own functions that are considered import functions.
For example, defining the following in .eslintrc will check the first
parameter of a function named `potato` for aliasing.

```jsonc
{
    // ...
    "rules": {
        // ...
        "@limegrass/import-alias/import-alias": [
            "error",
            {
                "aliasImportFunctions": ["require", "mock", "potato"],
            },
        ],
    },
}
```

This was based off an assumption that custom mock functions will take a similar
parameter to `require` or `jest.mock`, but please submit an issue detailing
your usage if this does not serve your needs.

### Specifying TSConfig

The relative path to `tsconfig.json` can be explicitly specified using the `aliasConfigPath`
configuration key. An example for a tsconfig found in a `config` folder of a project could be

```jsonc
{
    // ...
    "rules": {
        // ...
        "@limegrass/import-alias/import-alias": [
            "error",
            {
                "aliasConfigPath": "config/tsconfig.json",
            },
        ],
    },
}
```

One potentially useful case of this is where you have nested `tsconfig.json` files.
You can the `aliasConfigPath` option with the `__dirname` variable in JavaScript ESLint config files
to configure some dynamic roots against different project roots.
See [this issue](https://github.com/Limegrass/eslint-plugin-import-alias/issues/15#issuecomment-1998548874) for an example usage.

### Enabling relative import overrides

#### Path-based overrides

It is possible to allow relative imports for some paths if desires through configuring
a `relativeImportOverrides` configuration parameter on the rule. Each configuration requires
a path and a depth to be specified, where a depth of `0` allows imports of sibling modules,
a depth of `1` allows imports from siblings of the parent module, and so on.

The follow example would allow sibling imports for the entire project.

```jsonc
{
    // ...
    "rules": {
        // ...
        "@limegrass/import-alias/import-alias": [
            "error",
            {
                "relativeImportOverrides": [{ "path": ".", "depth": 0 }],
            },
        ],
    },
}
```

With a configuration like `{ path: "src/foo", depth: 0 }`

1. Relative paths can be used in `./src/foo`.
2. Relative paths can be used in `./src/foo/bar`.
3. Relative paths can NOT be used in `./src`.

With a configuration like `{ path: "src", depth: 0 }`

1. Relative paths can be used in `./src/foo`.
2. Relative paths can be used in `./src/bar/baz`.
3. Relative paths can be used in `./src`.

In `./src/foo` with `path: "src"`

1. `import "./bar"` for `./src/bar` when `depth` \>= `0`.
2. `import "./bar/baz"` when `depth` \>= `0`.
3. `import "../bar"` when `depth` \>= `1`.

#### Pattern-based overrides

Regular expression patterns serve as a potential alternative to path overrides.

With a configuration like `{ pattern: "index.ts", depth: 0 }`

1. Relative paths can be used in files such as `./src/index.ts`.
1. Relative paths can be used any file in the folder `./src/index.ts/*`.
1. Relative paths can NOT be used in files such as `./src/foo.ts`.

With a configuration like `{ pattern: "index\\.(ts|js)$" depth: 0 }`

1. Relative paths can be used in any file that ends with `index.js` or `index.ts`.
1. Relative paths can be NOT in the folder `./src/index.ts/*`.
1. Relative paths can be NOT used in `./src/foo.ts`.

If a file matches by both patterns and paths, the maximum depth allowed is simply
the largest of all matched overrides.
