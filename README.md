# url-shape

URL builder with optional schema-based type safety

## Building URLs

Use the URL builder returned from `createURLBuilder()` to produce URLs based on their components, such as path placeholders and query parameters.

```js
import { createURLBuilder } from "url-shape";

let url = createURLBuilder();

url("/sections/:id", { params: { id: 10 } }).href // "/sections/10"
url("/sections/:id", { params: { id: 10 } }).toString() // "/sections/10"
String(url("/sections/:id", { params: { id: 10 } })) // "/sections/10"

url("/sections/:id").exec("/sections/42") // { params: { id: 42 } }
url("/sections/:id").exec("/x/42") // null

url("/sections/:id").compile({ params: { id: 10 } }) // "/sections/10"
url("/search").compile({ query: { term: "shape" } }) // "/search?term=shape"
```

⬥ Pass an optional `base` URL as the parameter of `createURLBuilder()` to produce URLs relative to the given URL. `base` acts as a prefix, or a replacement to the leading `/`, to URLs in the schema. It's a handy way to rebase all URLs to another root URL.

```js
let url = createURLBuilder("/nested");

url("/sections/:id", { params: { id: 10 } }).href // "/nested/sections/10"
```

## Type safety

Pass a URL schema to `createURLBuilder()` to make sure that the URL parameters match the URL and they contain data of the expected type. A URL schema can be defined with any validation lib supporting the [Standard Schema](https://github.com/standard-schema/standard-schema#readme) spec, including Zod, ArkType, Valibot, or Yup.

```ts
import { createURLBuilder } from "url-shape";
import { z } from "zod";

export const url = createURLBuilder({
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

```ts
url("/sections/:id", { params: { id: 10 } })
                    // ^ { id: number }
```

⬥ With Zod, mind the `.coerce` part in the schema for non-string parameters so that string URL components are converted to the preferred types.

⬥ An entire web app doesn't have to be covered by a single URL schema. Each self-contained section of the app can have its own URL builder on top of its own URL schema.

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

⬥ A `URLSchema` object can also be passed to `createURLBuilder()`.
