import { z } from "zod";
import { createURLBuilder, join, URLSchema, url } from "./index.ts";

let k = 0;

function toString(x: unknown) {
  return typeof x === "string" ? x : JSON.stringify(x);
}

function assert(...args: unknown[]) {
  let n = `00${++k}`.slice(-3);
  let actual = args[0];
  let expected = args.length === 1 ? true : args[1];

  if (toString(actual) === toString(expected))
    console.log(n, "passed");
  else {
    console.error(n, "failed");
    console.error("actual:", actual);
    console.error("expected:", expected);
    console.error();
    console.error("[!] failed");
    process.exit(1);
  }
}

function isObject(x: unknown) {
  return x !== null && typeof x === "object";
}

console.log("join");
assert(join("", "/"), "/");
assert(join("", "/sections/:id"), "/sections/:id");
assert(join("/", "sections", ":id"), "/sections/:id");
assert(join("sections", ":id"), "sections/:id");
assert(join("", "sections", ":id"), "sections/:id");
assert(join("", "sections", "", ":id"), "sections/:id");
assert(join("", "sections", ""), "sections");
assert(join("sections", ""), "sections");
assert(join("/", "sections", ""), "/sections");
assert(join("/nested", "/"), "/nested");

console.log("\nno schema, default");

assert(url("/").toString(), "/");
assert(
  url("/sections/:id", { params: { id: "x" } }).toString(), "/sections/x",
);

assert(
  JSON.stringify(url("/sections/:id").exec("/sections/10")?.params),
    '{"id":"10"}',
);
assert(
  JSON.stringify(url("/x/:name").exec("/x/intro")?.params),
    '{"name":"intro"}',
);
assert(url("/test").exec("/test")?.params, undefined);
assert(url("/test").exec("/text"), null);

console.log("\nno schema, rebased");

let url2 = createURLBuilder("/base");

assert(url2("/").toString(), "/base");
assert(
  url2("/sections/:id", { params: { id: "x" } }).toString(),
    "/base/sections/x",
);

assert(
  JSON.stringify(url2("/sections/:id").exec("/sections/10")?.params),
    undefined,
);
assert(
  JSON.stringify(url2("/sections/:id").exec("/base/sections/10")?.params),
    '{"id":"10"}',
);
assert(
  JSON.stringify(url2("/x/:name").exec("/base/x/intro")?.params),
    '{"name":"intro"}',
);
assert(url2("/test").exec("/base/test")?.params, undefined);
assert(url2("/test").exec("/base/text"), null);

console.log("\nschema");

let schema = new URLSchema({
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

let url3 = createURLBuilder(schema);

assert(url3("/").toString(), "/");
assert(
  url3("/sections/:id", { params: { id: 1 } }).toString(), "/sections/1",
);
assert(url3("/sections/:id").toString(), "/sections/:id");

assert(
  JSON.stringify(url3("/sections/:id").exec("/sections/42")?.params),
    '{"id":42}',
);
assert(url3("/sections/:id").exec("/sections/42")?.query, undefined);
assert(
  isObject(url3("/sections/:id", { params: { id: 42 } }).exec("/sections/42")),
);
assert(
  url3("/sections/:id", { params: { id: 42 } }).exec("/sections/42")?.query !==
    undefined,
);
assert(url3("/sections/:id").exec("/x/42"), null);
assert(url3("/").exec("/x"), null);

assert(url3("/search").toString(), "/search");
assert(
  url3("/search", { query: { term: "x" } }).toString(), "/search?term=x",
);
assert(
  url3("/search", { query: { term: "x", view: "full" } }).toString(),
    "/search?term=x&view=full",
);
assert(
  url3("/search", { query: { term: "x", view: "full" } }).href,
    "/search?term=x&view=full",
);

assert(url3("/search").exec("/x"), null);
assert(
  JSON.stringify(url3("/search").exec("/search?term=test")?.query),
    '{"term":"test"}',
);
assert(url3("/search").exec("/search?term=test")?.params, undefined);
assert(
  JSON.stringify(url3("/search").exec("/search?term=test&view=full")?.query),
    '{"term":"test","view":"full"}',
);
assert(url3("/search").exec("/search?term=test&view=fulll"), null);
assert(
  JSON.stringify(
    url3("/search").exec("/search?term=null&view=compact")?.query,
  ), '{"term":"null","view":"compact"}',
);
assert(url3("/search").exec("/search?view=compact"), null);

assert(
  url3("/sections/:id").compile({ params: { id: 10 } }), "/sections/10",
);
assert(
  url3("/search").compile({ query: { term: "shape" } }),
    "/search?term=shape",
);
assert(
  url3("/search").compile({ query: { term: "shape", view: "compact" } }),
    "/search?term=shape&view=compact",
);

assert(
  JSON.stringify(url3("/sections/:id").exec("/sections/10")?.params),
    '{"id":10}',
);

assert(url3("/sections/:id").exec("/x"), null);

assert(schema.test("/sections/10"), true);
assert(schema.test("/x"), false);

console.log("\nnull schema");

let schema2 = new URLSchema(null);

let url4 = createURLBuilder(schema2);

assert(url4("/").toString(), "/");
assert(
  url4("/sections/:id", { params: { id: "x" } }).toString(), "/sections/x",
);

assert(
  JSON.stringify(url4("/sections/:id").exec("/sections/10")?.params),
    '{"id":"10"}',
);
assert(
  JSON.stringify(url4("/x/:name").exec("/x/intro")?.params),
    '{"name":"intro"}',
);
assert(url4("/test").exec("/test")?.params, undefined);
assert(url4("/test").exec("/text"), null);

assert(schema2.test("/sections/10"), true);
assert(schema2.test("/x"), true);

console.log("\nschema with optionals");

let url5 = createURLBuilder({
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
  url5("/sections/:id", { params: { id: 1 } }).toString(), "/sections/1",
);
assert(url5("/sections/:id").toString(), "/sections/:id");

assert(
  JSON.stringify(url5("/sections/:id").exec("/sections/42")?.params),
    '{"id":42}',
);
assert(url5("/sections/:id").exec("/sections/42")?.query, undefined);
assert(url5("/sections/:id").exec("/x/42"), null);

assert(url5("/x{/:name}", {}).toString(), "/x");
assert(url5("/x{/:name}", { params: undefined }).toString(), "/x");
assert(
  url5("/x{/:name}", { params: { name: "shape" } }).toString(), "/x/shape",
);

assert(url5("/x{/:name}").exec("/x")?.params, undefined);
assert(url5("/x{/:name}").exec("/x")?.query, undefined);
assert(
  JSON.stringify(url5("/x{/:name}").exec("/x/shape")?.params),
    '{"name":"shape"}',
);
assert(url5("/x{/:name}").exec("/x/shape")?.query, undefined);
assert(url5("/x{/:name}").exec("/search"), null);

console.log("\nrelative schema");

let url6 = createURLBuilder("/nested", schema);

assert(url6("/").toString(), "/nested");
assert(
  url6("/sections/:id", { params: { id: 1 } }).toString(),
    "/nested/sections/1",
);
assert(url6("/sections/:id").toString(), "/nested/sections/:id");

assert(
  JSON.stringify(url6("/sections/:id").exec("/nested/sections/42")?.params),
    '{"id":42}',
);
assert(url6("/sections/:id").exec("/sections/42")?.query, undefined);
assert(url6("/sections/:id").exec("/nested/sections/42")?.query, undefined);
assert(url6("/sections/:id").exec("/nested/x/42"), null);
assert(url6("/").exec("/nested/x"), null);

assert(url6("/search").toString(), "/nested/search");
assert(
  url6("/search", { query: { term: "x" } }).toString(),
    "/nested/search?term=x",
);
assert(
  url6("/search", { query: { term: "x", view: "full" } }).toString(),
    "/nested/search?term=x&view=full",
);
assert(
  url6("/search", { query: { term: "x", view: "full" } }).href,
    "/nested/search?term=x&view=full",
);

assert(url6("/search").exec("/nested/x"), null);
assert(
  JSON.stringify(url6("/search").exec("/nested/search?term=test")?.query),
    '{"term":"test"}',
);
assert(url6("/search").exec("/nested/search?term=test")?.params, undefined);
assert(
  JSON.stringify(
    url6("/search").exec("/nested/search?term=test&view=full")?.query,
  ), '{"term":"test","view":"full"}',
);
assert(url6("/search").exec("/nested/search?term=test&view=fulll"), null);
assert(
  JSON.stringify(
    url6("/search").exec("/nested/search?term=null&view=compact")?.query,
  ), '{"term":"null","view":"compact"}',
);
assert(url6("/search").exec("/nested/search?view=compact"), null);

assert(
  url6("/sections/:id").compile({ params: { id: 10 } }),
    "/nested/sections/10",
);
assert(
  url6("/search").compile({ query: { term: "shape" } }),
    "/nested/search?term=shape",
);
assert(
  url6("/search").compile({ query: { term: "shape", view: "compact" } }),
    "/nested/search?term=shape&view=compact",
);

assert(
  JSON.stringify(url6("/sections/:id").exec("/nested/sections/10")?.params),
    '{"id":10}',
);

assert(url6("/sections/:id").exec("/nested/x"), null);

console.log("\npassed");
