import { z } from "zod";
import { createURLSchema } from "./index.ts";

let k = 0;

function assert(predicate: boolean) {
  let n = `00${++k}`.slice(-3);

  if (predicate) console.log(n, "passed");
  else {
    console.error(n, "failed");
    console.error();
    console.error("[!] failed");
    process.exit(1);
  }
}

console.log("fixed, params, query");

let { url, validate } = createURLSchema({
  "/": z.object({}),
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

assert(url("/").toString() === "/");
assert(
  url("/sections/:id", { params: { id: 1 } }).toString() === "/sections/1",
);
assert(url("/sections/:id").toString() === "/sections/:id");

assert(
  JSON.stringify(url("/sections/:id").exec("/sections/42")?.params) ===
    '{"id":42}',
);
assert(url("/sections/:id").exec("/sections/42")?.query === undefined);
assert(url("/sections/:id").exec("/x/42") === null);
assert(url("/").exec("/x") === null);

assert(url("/search").toString() === "/search");
assert(
  url("/search", { query: { term: "x" } }).toString() === "/search?term=x",
);
assert(
  url("/search", { query: { term: "x", view: "full" } }).toString() ===
    "/search?term=x&view=full",
);
assert(
  url("/search", { query: { term: "x", view: "full" } }).href ===
    "/search?term=x&view=full",
);

assert(url("/search").exec("/x") === null);
assert(
  JSON.stringify(url("/search").exec("/search?term=test")?.query) ===
    '{"term":"test"}',
);
assert(url("/search").exec("/search?term=test")?.params === undefined);
assert(
  JSON.stringify(url("/search").exec("/search?term=test&view=full")?.query) ===
    '{"term":"test","view":"full"}',
);
assert(url("/search").exec("/search?term=test&view=fulll") === null);
assert(
  JSON.stringify(
    url("/search").exec("/search?term=null&view=compact")?.query,
  ) === '{"term":"null","view":"compact"}',
);
assert(url("/search").exec("/search?view=compact") === null);

assert(url("/sections/:id").compile({ params: { id: 10 } }) === "/sections/10");
assert(
  url("/search").compile({ query: { term: "shape" } }) === "/search?term=shape",
);
assert(
  url("/search").compile({ query: { term: "shape", view: "compact" } }) ===
    "/search?term=shape&view=compact",
);

assert(
  JSON.stringify(url("/sections/:id").exec("/sections/10")?.params) ===
    '{"id":10}',
);

assert(url("/sections/:id").exec("/x") === null);

assert(validate("/sections/10") === true);
assert(validate("/x") === false);

console.log("\nnull schema");

let { url: url2, validate: validate2 } = createURLSchema(null);

assert(url2("/").toString() === "/");
assert(
  url2("/sections/:id", { params: { id: "x" } }).toString() === "/sections/x",
);

assert(
  JSON.stringify(url2("/sections/:id").exec("/sections/10")?.params) ===
    '{"id":"10"}',
);
assert(
  JSON.stringify(url2("/x/:name").exec("/x/intro")?.params) ===
    '{"name":"intro"}',
);
assert(url2("/test").exec("/test")?.params === undefined);
assert(url2("/test").exec("/text") === null);

assert(validate2("/sections/10") === true);
assert(validate2("/x") === true);

console.log("\noptionals");

let { url: url3 } = createURLSchema({
  "/sections/:id": z.object({
    params: z.object({
      id: z.coerce.number(),
    }),
    query: z.optional(
      z.object({
        x: z.coerce.number(),
        y: z.coerce.number(),
      }),
    ),
  }),
  "/x{/:name}": z.object({
    params: z.optional(
      z.object({
        name: z.string(),
      }),
    ),
  }),
});

assert(
  url3("/sections/:id", { params: { id: 1 } }).toString() === "/sections/1",
);
assert(url3("/sections/:id").toString() === "/sections/:id");

assert(
  JSON.stringify(url3("/sections/:id").exec("/sections/42")?.params) ===
    '{"id":42}',
);
assert(url3("/sections/:id").exec("/sections/42")?.query === undefined);
assert(url3("/sections/:id").exec("/x/42") === null);

assert(url3("/x{/:name}", {}).toString() === "/x");
assert(url3("/x{/:name}", { params: undefined }).toString() === "/x");
assert(
  url3("/x{/:name}", { params: { name: "shape" } }).toString() === "/x/shape",
);

assert(url3("/x{/:name}").exec("/x")?.params === undefined);
assert(url3("/x{/:name}").exec("/x")?.query === undefined);
assert(
  JSON.stringify(url3("/x{/:name}").exec("/x/shape")?.params) ===
    '{"name":"shape"}',
);
assert(url3("/x{/:name}").exec("/x/shape")?.query === undefined);
assert(url3("/x{/:name}").exec("/search") === null);

console.log("\nrelative schema");

let { url: url4, validate: validate4 } = createURLSchema("/nested", {
  "/": z.object({}),
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

assert(url4("/").toString() === "/nested");
assert(
  url4("/sections/:id", { params: { id: 1 } }).toString() ===
    "/nested/sections/1",
);
assert(url4("/sections/:id").toString() === "/nested/sections/:id");

assert(
  JSON.stringify(url4("/sections/:id").exec("/nested/sections/42")?.params) ===
    '{"id":42}',
);
assert(url4("/sections/:id").exec("/sections/42")?.query === undefined);
assert(url4("/sections/:id").exec("/nested/sections/42")?.query === undefined);
assert(url4("/sections/:id").exec("/nested/x/42") === null);
assert(url4("/").exec("/nested/x") === null);

assert(url4("/search").toString() === "/nested/search");
assert(
  url4("/search", { query: { term: "x" } }).toString() ===
    "/nested/search?term=x",
);
assert(
  url4("/search", { query: { term: "x", view: "full" } }).toString() ===
    "/nested/search?term=x&view=full",
);
assert(
  url4("/search", { query: { term: "x", view: "full" } }).href ===
    "/nested/search?term=x&view=full",
);

assert(url4("/search").exec("/nested/x") === null);
assert(
  JSON.stringify(url4("/search").exec("/nested/search?term=test")?.query) ===
    '{"term":"test"}',
);
assert(url4("/search").exec("/nested/search?term=test")?.params === undefined);
assert(
  JSON.stringify(url4("/search").exec("/nested/search?term=test&view=full")?.query) ===
    '{"term":"test","view":"full"}',
);
assert(url4("/search").exec("/nested/search?term=test&view=fulll") === null);
assert(
  JSON.stringify(
    url4("/search").exec("/nested/search?term=null&view=compact")?.query,
  ) === '{"term":"null","view":"compact"}',
);
assert(url4("/search").exec("/nested/search?view=compact") === null);

assert(
  url4("/sections/:id").compile({ params: { id: 10 } }) ===
    "/nested/sections/10",
);
assert(
  url4("/search").compile({ query: { term: "shape" } }) ===
    "/nested/search?term=shape",
);
assert(
  url4("/search").compile({ query: { term: "shape", view: "compact" } }) ===
    "/nested/search?term=shape&view=compact",
);

assert(
  JSON.stringify(url4("/sections/:id").exec("/nested/sections/10")?.params) ===
    '{"id":10}',
);

assert(url4("/sections/:id").exec("/nested/x") === null);

assert(validate4("/sections/10") === true);
assert(validate4("/x") === false);

console.log("\npassed");
