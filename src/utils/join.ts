function stripSlashes(s: string) {
  while (s.endsWith("/")) s = s.slice(0, -1);
  while (s.startsWith("/")) s = s.slice(1);
  return s;
}

export function join(...args: string[]) {
  if (args.length === 0) return "";

  let nonEmptyArgs = args.filter(Boolean);
  let hasLeadingSlash = nonEmptyArgs[0]?.startsWith("/");

  let trailingPart = nonEmptyArgs.at(-1);
  let hasTrailingSlash = trailingPart?.endsWith("/") && trailingPart !== "/";

  let result = nonEmptyArgs.map(stripSlashes).filter(Boolean).join("/");

  if (hasLeadingSlash) result = `/${result}`;
  if (hasTrailingSlash) result = `${result}/`;

  let head = "";

  if (result.startsWith("//")) head = "//";
  else if (result.includes("://"))
    head = result.slice(0, result.indexOf("://") + 3);

  let tail = result.slice(head.length);

  while (tail.includes("//")) tail = tail.replaceAll("//", "/");

  return `${head}${tail.replace(/\/+/g, "/")}`;
}
