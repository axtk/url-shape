# url-shape

URL builder with optional schema-based type safety

Contents: [Building URLs](#building-urls) · [Type safety](#type-safety) · [Validating against a URL schema](#validating-against-a-url-schema)

## Building URLs

Use the URL builder `url()` to produce URLs based on their components, such as path placeholders and query parameters.

```js
import { url } from "url-shape";

url("/sections/:id", { params: { id: 10 } }).href // "/sections/10"
url("/sections/:id", { params: { id: 10 } }).toString() // "/sections/10"
String(url("/sections/:id", { params: { id: 10 } })) // "/sections/10"

url("/sections/:id").exec("/sections/42") // { params: { id: 42 } }
url("/sections/:id").exec("/x/42") // null

url("/sections/:id").compile({ params: { id: 10 } }) // "/sections/10"
url("/search").compile({ query: { term: "shape" } }) // "/search?term=shape"
```

⬥ Use `createURLBuilder()` to create a standalone or customized URL builder. Pass an optional `base` URL as the parameter of `createURLBuilder()` to produce URLs relative to the given URL. `base` acts as a prefix, or a replacement to the leading `/` in the paths, applied to the output URLs. It's a handy way to rebase all URLs produced by the URL builder to another root URL.

```js
import { createURLBuilder } from "url-shape";

const url = createURLBuilder("/nested");

url("/sections/:id", { params: { id: 10 } }).href // "/nested/sections/10"
```

## Type safety

Pass a URL schema to `createURLBuilder()` to make sure that the URL parameters match the URL and that they contain data of the expected type. A URL schema can be defined with any validation lib supporting the [Standard Schema](https://github.com/standard-schema/standard-schema#readme) spec, including Zod, ArkType, Valibot, or Yup.

```ts
import { createURLBuilder } from "url-shape";
import { z } from "zod";

export const url = createURLBuilder({
  "/": z.object({}), // No parameters, empty schema
  "/sections/:id": z.object({
    // Path placeholders
    params: z.object({
      id: z.coerce.number(),
    }),
  }),
  "/search": z.object({
    // Query (or search) parameters
    query: z.object({
      term: z.string(),
      view: z.optional(z.enum(["full", "compact"])),
    }),
  }),
});
```

```ts
url("/sections/:id", { params: { id: 10 } }).href // "/sections/10"
                    // ^ { id: number }

url("/search", { query: { term: "shape" } }).href // "/search?term=shape"
              // ^ { term: string, view?: "full" | "compact" }
```

⬥ With Zod, mind the `.coerce` part in the schema for non-string parameters so that string URL components are converted to the preferred types.

⬥ An entire web app doesn't have to be covered by a single URL schema. Each self-contained section of the app can have its own URL builder on top of its own URL schema.

⬥ The `base` parameter can be used with a URL schema, too. Use `createURLBuilder(base, schema)` to produce URLs relative to the given `base` URL.

## Validating against a URL schema

As an alternative to passing a URL schema directly to `createURLBuilder()` as described above, a URL schema can be created as a standalone object:

```ts
import { URLSchema } from "url-shape";
import { z } from "zod"; 

export const schema = new URLSchema({
  "/sections/:id": z.object({
    params: z.object({
      id: z.coerce.number(),
    }),
  }),
});
```

Use a `URLSchema` object to check whether a URL matches any entries in the schema:

```ts
schema.test("/sections/10") // true, found in the schema
schema.test("/x") // false, not found in the schema
```

⬥ Testing against a comprehensive URL schema can be used to help handle unknown URLs.

⬥ A `URLSchema` object can also be passed to `createURLBuilder()`.

⬥ A URL schema created as `new URLSchema(null)` is technically valid, too. It doesn't set any constraints, testing any URL against it with `schema.test(url)` results in `true`.
