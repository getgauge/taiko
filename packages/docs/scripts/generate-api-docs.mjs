import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const apiJsonPath = path.join(repoRoot, "packages/taiko/lib/api.json");
const apiTargetDir = path.join(repoRoot, "packages/docs/src/content/docs/api");
const { metadata } = require(path.join(repoRoot, "packages/taiko/lib/taiko"));

let generatedApiSlugs = new Set();
let generatedApiMemberAnchors = new Map();

const externalTypeLinks = new Map([
  ["Array", "https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array"],
  ["Boolean", "https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean"],
  ["Date", "https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date"],
  ["Error", "https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error"],
  ["Function", "https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function"],
  ["Number", "https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number"],
  ["Object", "https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object"],
  ["Promise", "https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise"],
  ["RegExp", "https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp"],
  ["String", "https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String"],
  ["Element", "https://developer.mozilla.org/docs/Web/API/Element"],
  ["Buffer", "https://nodejs.org/api/buffer.html"],
]);

function apiSlug(name) {
  return name.toLowerCase();
}

function headingAnchor(name) {
  return name.toLowerCase();
}

function titleFor(entry) {
  return entry.kind === "class" ? `${entry.name} class` : `${entry.name}()`;
}

function frontmatter(title, description) {
  const cleanDescription = description.replace(/\s+/g, " ").trim();
  return `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(cleanDescription)}\n---\n\n`;
}

function escapeTableCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n+/g, "<br>");
}

function fenceCode(code) {
  const ticks = code.match(/`{3,}/g) || [];
  const fenceLength = Math.max(3, ...ticks.map((tick) => tick.length + 1));
  return "`".repeat(fenceLength);
}

function normalizeDocLink(url) {
  if (
    /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url) ||
    url.startsWith("/") ||
    url.startsWith("#") ||
    url.startsWith("./") ||
    url.startsWith("../")
  ) {
    return url;
  }

  const memberMatch = url.match(/^([^#]+)#(.+)$/);
  if (memberMatch) {
    const [, type, member] = memberMatch;
    const slug = apiSlug(type);
    const anchor = headingAnchor(member);
    if (generatedApiSlugs.has(slug) && generatedApiMemberAnchors.get(slug)?.has(anchor)) {
      return `/api/${slug}/#${anchor}`;
    }
    return null;
  }

  const slug = apiSlug(url);
  if (generatedApiSlugs.has(slug)) return `/api/${slug}/`;

  const normalized = url.charAt(0).toUpperCase() + url.slice(1);
  return externalTypeLinks.get(url) || externalTypeLinks.get(normalized) || null;
}

function renderInline(children = []) {
  return children
    .map((child) => {
      if (child.type === "text") return child.value;
      if (child.type === "inlineCode") return `\`${child.value}\``;
      if (child.type === "html") return child.value;
      if (child.type === "link") {
        const label = renderInline(child.children).trim() || child.url;
        const url = normalizeDocLink(child.url);
        return url ? `[${label}](${url})` : `\`${label}\``;
      }
      if (child.type === "strong") return `**${renderInline(child.children)}**`;
      if (child.type === "emphasis") return `_${renderInline(child.children)}_`;
      if (child.children) return renderInline(child.children);
      return "";
    })
    .join("");
}

function renderDescription(description) {
  if (!description) return "";
  if (typeof description === "string") return description;
  if (!description.children?.length) return "";

  return description.children
    .map((child) => {
      if (child.type === "paragraph") return renderInline(child.children);
      if (child.type === "root") return renderDescription(child);
      if (child.type === "html") return child.value;
      if (child.type === "list") {
        return (child.children || [])
          .map((item) => `- ${renderDescription(item).replace(/\n+/g, "\n  ")}`)
          .join("\n");
      }
      if (child.type === "listItem") return renderDescription(child);
      if (child.children) return renderInline(child.children);
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function plainDescription(entry) {
  const description = renderDescription(entry.description);
  return description || `API documentation for ${entry.name}.`;
}

function typeName(type) {
  if (!type) return "unknown";
  if (type.type === "NameExpression") return type.name;
  if (type.name) return type.name;
  if (type.expression) return typeName(type.expression);
  return "unknown";
}

function linkTypeName(name) {
  if (name === "void" || name === "undefined" || name === "null") return `\`${name}\``;

  const normalized = name.charAt(0).toUpperCase() + name.slice(1);
  const externalTypeLink = externalTypeLinks.get(name) || externalTypeLinks.get(normalized);
  if (externalTypeLink) {
    return `[${name}](${externalTypeLink})`;
  }

  const slug = apiSlug(name);
  if (!name.includes(".") && !name.includes("-") && generatedApiSlugs.has(slug)) {
    return `[${name}](/api/${slug}/)`;
  }

  return `\`${name}\``;
}

function renderType(type) {
  if (!type) return "`unknown`";

  if (type.type === "NameExpression" || type.name) {
    return linkTypeName(type.name);
  }

  if (type.type === "TypeApplication") {
    const expression = renderType(type.expression);
    const applications = (type.applications || []).map(renderType).join(", ");
    return `${expression}<${applications}>`;
  }

  if (type.type === "UnionType") {
    return (type.elements || []).map(renderType).join(" | ");
  }

  if (type.type === "OptionalType") {
    return `${renderType(type.expression)} optional`;
  }

  if (type.type === "RestType") {
    return `...${renderType(type.expression)}`;
  }

  if (type.expression) return renderType(type.expression);

  return `\`${typeName(type)}\``;
}

function renderExamples(entry) {
  if (!entry.examples?.length) return "";

  const examples = entry.examples
    .map((example) => {
      const code = String(example.description || "").trimEnd();
      const fence = fenceCode(code);
      return `${fence}js\n${code}\n${fence}`;
    })
    .join("\n\n");

  return `\n## Examples\n\n${examples}\n`;
}

function paramToRows(param) {
  const name = param.name || "parameter";
  const type = renderType(param.type?.expression ?? param.type);
  const description = renderDescription(param.description);
  const defaultValue = param.default ? ` Default: \`${param.default}\`.` : "";
  const row = `| \`${escapeTableCell(name)}\` | ${escapeTableCell(type)} | ${escapeTableCell(description + defaultValue)} |`;
  const propertyRows = (param.properties || []).flatMap(paramToRows);

  return [row, ...propertyRows];
}

function paramRows(entry) {
  return (entry.params || [])
    .filter((param) => param.title === "param")
    .flatMap(paramToRows);
}

function renderParameters(entry, heading = "Parameters") {
  const rows = paramRows(entry);
  if (!rows.length) return `\n## ${heading}\n\nThis API does not have any parameters.\n`;

  return `\n## ${heading}\n\n| Name | Type | Description |\n| --- | --- | --- |\n${rows.join("\n")}\n`;
}

function returnRows(entry) {
  return (entry.returns || [])
    .filter((returns) => returns.title === "returns")
    .map((returns) => {
      const type = renderType(returns.type);
      const description = renderDescription(returns.description);
      return `| ${escapeTableCell(type)} | ${escapeTableCell(description)} |`;
    });
}

function renderReturns(entry, heading = "Returns") {
  const rows = returnRows(entry);
  if (!rows.length) return `\n## ${heading}\n\nThis API does not return any values.\n`;

  return `\n## ${heading}\n\n| Type | Description |\n| --- | --- |\n${rows.join("\n")}\n`;
}

function renderFunction(entry) {
  const description = plainDescription(entry);
  return [
    frontmatter(titleFor(entry), description),
    description,
    renderExamples(entry),
    renderParameters(entry),
    renderReturns(entry),
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

function renderMember(member) {
  const description = plainDescription(member);
  return [
    `### ${member.name}`,
    "",
    description,
    renderExamples(member).replace(/^## /m, "#### "),
    renderParameters(member, "Parameters").replace(/^## /m, "#### "),
    renderReturns(member, "Returns").replace(/^## /m, "#### "),
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

function renderMemberGroup(entry, key, label) {
  const members = entry.members?.[key] || [];
  if (!members.length) return "";

  return [`\n## ${label} Members\n`, ...members.map(renderMember)].join("\n");
}

function renderClass(entry) {
  const description = plainDescription(entry);
  const augments = entry.augments?.length
    ? `\n\nExtends ${entry.augments.map((augmentation) => linkTypeName(augmentation.type.name)).join(", ")}.`
    : "";

  return [
    frontmatter(titleFor(entry), description),
    `${description}${augments}`,
    renderMemberGroup(entry, "global", "Global"),
    renderMemberGroup(entry, "inner", "Inner"),
    renderMemberGroup(entry, "instance", "Instance"),
    renderMemberGroup(entry, "events", "Events"),
    renderMemberGroup(entry, "static", "Static"),
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

function renderReference() {
  const sections = Object.entries(metadata)
    .map(([group, names]) => {
      const links = names
        .map((name) => `- [\`${name}\`](/api/${apiSlug(name)}/)`)
        .join("\n");
      return `## ${group}\n\n${links}`;
    })
    .join("\n\n");

  return `${frontmatter("API Reference", "Index of Taiko's public browser automation APIs.")}Taiko APIs can be used in the recorder and in JavaScript test scripts.\n\n\`\`\`js\nconst { openBrowser, goto, click } = require("taiko");\n\n(async () => {\n  await openBrowser();\n  await goto("google.com");\n  await click("Google search");\n})();\n\`\`\`\n\n${sections}\n`;
}

function memberAnchorsFor(entry) {
  if (entry.kind !== "class") return new Set();

  return new Set(
    ["global", "inner", "instance", "events", "static"].flatMap((key) =>
      (entry.members?.[key] || []).map((member) => headingAnchor(member.name)),
    ),
  );
}

async function cleanApiDirectory() {
  await mkdir(apiTargetDir, { recursive: true });
  const entries = await readdir(apiTargetDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => rm(path.join(apiTargetDir, entry.name))),
  );
}

const apiEntries = JSON.parse(await readFile(apiJsonPath, "utf8"));
generatedApiSlugs = new Set(apiEntries.map((entry) => apiSlug(entry.name)));
generatedApiMemberAnchors = new Map(
  apiEntries
    .filter((entry) => entry.kind === "class")
    .map((entry) => [apiSlug(entry.name), memberAnchorsFor(entry)]),
);
await cleanApiDirectory();
await writeFile(path.join(apiTargetDir, "reference.md"), `${renderReference().trimEnd()}\n`);

for (const entry of apiEntries) {
  const filename = `${apiSlug(entry.name)}.md`;
  const content = entry.kind === "class" ? renderClass(entry) : renderFunction(entry);
  await writeFile(path.join(apiTargetDir, filename), `${content.trimEnd()}\n`);
}

console.log(`Generated ${apiEntries.length + 1} Starlight API pages.`);
