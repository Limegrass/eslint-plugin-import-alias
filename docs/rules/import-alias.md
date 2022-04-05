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
            "#rules/*": ["src/rules/*"]
        }
    }
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
                "aliasImportFunctions": ["require", "mock", "potato"]
            }
        ]
    }
}
```

This was based off an assumption that custom mock functions will take a similar
parameter to `require` or `jest.mock`, but please submit an issue detailing
your usage if this does not serve your needs.
