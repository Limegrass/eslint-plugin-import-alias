import { bar } from "./foo"; // error: import ./foo can be written as #from-preferred-config/foo

export const baz = bar + "baz";
