# URL Shape

Type-safe schema-based URL builder

## Creating a URL schema

Use a URL schema defined with any validation lib supporting the [Standard Schema](https://github.com/standard-schema/standard-schema#readme) spec, including Zod, ArkType, Valibot, or Yup.

```ts
import { createURLSchema } from "url-shape";
import { z } from "zod";

export const { url, validate } = createURLSchema({
  "/": z.object({}), // No parameters, empty schema
  "/sections/:id": z.object({
    params: z.object({
      id: z.coerce.number(),
    }),
  }),
  "/search": z.object({
    query: z.object({
      term: z.string(),
      view: z.optional(z.enum(["full", "compact"])),
    }),
  }),
});
``` 

⬥ With Zod, mind the `.coerce` part in the schema for non-string parameters so that string URL components are converted to the preferred types.

⬥ Pass an optional `base` URL as the first parameter of `createURLSchema()` to rebase the schema URLs onto the given URL. `base` acts as a prefix, or a replacement to the leading `"/"`, to URLs in the schema.

## Using a URL schema

Use the functions returned from `createURLSchema()` to build and validate URLs in a type-safe manner. A type-aware code editor highlights typos in the URLs and type mismatches in their parameters.

```ts
url("/sections/:id", { params: { id: 10 } }).href // "/sections/10"
url("/sections/:id", { params: { id: 10 } }).toString() // "/sections/10"
String(url("/sections/:id", { params: { id: 10 } })) // "/sections/10"

url("/sections/:id").exec("/sections/42") // { params: { id: 42 } }
url("/sections/:id").exec("/x/42") // null

url("/sections/:id").compile({ params: { id: 10 } }) // "/sections/10"
url("/search").compile({ query: { term: "shape" } }) // "/search?term=shape"

validate("/sections/10") // true, found in the schema
validate("/x") // false, not found in the schema
```

⬥ The optional `base` parameter affects this output, when used. For example, with `createURLSchema("/nested", <same schema above>)`, `url("/sections/:id", { params: { id: 10 } }).href` is `"/nested/sections/10"`.

## Null schema

By having `null` as a URL schema, the URL builder can be used without schema validation:

```ts
const { url, validate } = createURLSchema(null);

url("/sections/:id", { params: { id: "x" } }) // "/sections/x"
url("/x/:name").exec("/x/intro") // { params: { name: "intro" } }
validate("/x") // true, all URLs are fine when there's no schema
```
