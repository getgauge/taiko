import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const sourceDir = path.join(repoRoot, "packages/taiko/docs");
const targetDir = path.join(repoRoot, "packages/docs/src/content/docs");

const pages = [
  { source: "overview.md", target: "overview.md", title: "Overview", description: "Learn what Taiko is and how its browser automation API works." },
  { source: "installing.md", target: "installing.md", title: "Installing", description: "Install Taiko globally, locally, or with npx." },
  { source: "record_and_run_tests.md", target: "record-and-run-tests.md", title: "Record and run tests", description: "Use Taiko's recorder and run generated JavaScript test scripts." },
  { source: "frequently_asked_questions.md", target: "frequently-asked-questions.md", title: "Frequently asked questions", description: "Answers to common questions about Taiko support and behavior." },
  { source: "getting_help.md", target: "getting-help.md", title: "Getting Help", description: "Find the right support channel for Taiko questions and issues." },
  { source: "taking_screenshots.md", target: "taking-screenshots.md", title: "Taking Screenshots", description: "Capture page and element screenshots with Taiko." },
  { source: "assertions.md", target: "assertions.md", title: "Assertions", description: "Understand Taiko implicit assertions and custom assertion usage." },
  { source: "file_upload_and_download.md", target: "file-upload-and-download.md", title: "File Upload and Download", description: "Attach files and download files in Taiko scripts." },
  { source: "working_with_element_lists.md", target: "working-with-element-lists.md", title: "Working with element lists", description: "Use Taiko selectors when multiple page elements match." },
  { source: "integrating_with_test_runners.md", target: "integrating-with-test-runners.md", title: "Integrating with test runners", description: "Run Taiko scripts with Gauge, Mocha, and other test runners." },
  { source: "configuring_taiko.md", target: "configuring-taiko.md", title: "Configuring Taiko", description: "Configure Taiko behavior with environment variables and settings." },
  { source: "plugins.md", target: "plugins.md", title: "Plugins", description: "Use community Taiko plugins and load plugins in runners." },
  { source: "running_scripts_inside_the_browser.md", target: "running-scripts-inside-the-browser.md", title: "Running scripts inside the browser", description: "Use evaluate to run JavaScript in the page context." },
  { source: "taiko_in_docker.md", target: "taiko-in-docker.md", title: "Taiko in Docker", description: "Set up Taiko tests in Docker for local or CI execution." },
  { source: "writing_plugins.md", target: "writing-plugins.md", title: "Writing plugins", description: "Extend Taiko with plugins and custom command behavior." },
  { source: "experimental_features.md", target: "experimental-features.md", title: "Experimental Features", description: "Use experimental Taiko features such as Firefox and TypeScript support." },
  { source: "CONTRIBUTING.md", target: "contributing.md", title: "Contributing", description: "Contribute issues, fixes, and improvements to Taiko." },
];

const routeMap = new Map([
  ["overview", "/overview/"],
  ["installing", "/installing/"],
  ["record_and_run_tests", "/record-and-run-tests/"],
  ["using_the_recorder", "/record-and-run-tests/"],
  ["frequently_asked_questions", "/frequently-asked-questions/"],
  ["getting_help", "/getting-help/"],
  ["taking_screenshots", "/taking-screenshots/"],
  ["assertions", "/assertions/"],
  ["file_upload_and_download", "/file-upload-and-download/"],
  ["working_with_element_lists", "/working-with-element-lists/"],
  ["integrating_with_test_runners", "/integrating-with-test-runners/"],
  ["configuring_taiko", "/configuring-taiko/"],
  ["plugins", "/plugins/"],
  ["running_scripts_inside_the_browser", "/running-scripts-inside-the-browser/"],
  ["taiko_in_docker", "/taiko-in-docker/"],
  ["writing_plugins", "/writing-plugins/"],
  ["experimental_features", "/experimental-features/"],
  ["contributing", "/contributing/"],
]);

const oldDocsLinkMap = new Map([
  ["https://docs.taiko.dev/#taiko-env-variables", "/configuring-taiko/#using-environment-variables"],
  ["https://docs.taiko.dev/devices", "https://github.com/getgauge/taiko/blob/master/packages/taiko/lib/data/devices.js"],
  ["https://docs.taiko.dev/devices/", "https://github.com/getgauge/taiko/blob/master/packages/taiko/lib/data/devices.js"],
  ["google", "https://www.google.com/"],
]);

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

function starlightFrontmatter({ title, description }) {
  return [
    "---",
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    "---",
    "",
  ].join("\n");
}

function splitUrlSuffix(url) {
  const hashIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");
  const suffixIndex =
    hashIndex === -1
      ? queryIndex
      : queryIndex === -1
        ? hashIndex
        : Math.min(hashIndex, queryIndex);

  if (suffixIndex === -1) {
    return { base: url, suffix: "" };
  }

  return {
    base: url.slice(0, suffixIndex),
    suffix: url.slice(suffixIndex),
  };
}

function rewriteApiUrl(url) {
  const { base, suffix } = splitUrlSuffix(url);
  const apiMatch = base.match(/^(?:https:\/\/docs\.taiko\.dev)?\/api\/([^/]+)\/?$/);

  if (!apiMatch) {
    return url;
  }

  return `/api/${apiMatch[1].toLowerCase()}/${suffix}`;
}

function rewriteGuideUrl(url) {
  const oldDocsUrl = oldDocsLinkMap.get(url);
  if (oldDocsUrl) {
    return oldDocsUrl;
  }

  const apiUrl = rewriteApiUrl(url);
  if (apiUrl !== url) {
    return apiUrl;
  }

  const docsOrigin = "https://docs.taiko.dev";
  const { base, suffix } = splitUrlSuffix(url);
  const internalBase = base.startsWith(docsOrigin)
    ? base.slice(docsOrigin.length)
    : base;

  if (/^[a-z][a-z0-9+.-]*:/i.test(internalBase)) {
    return url;
  }

  const key = internalBase.replace(/^\/+/, "").replace(/\/+$/, "");
  const route = routeMap.get(key);

  if (!route) {
    return url;
  }

  return `${route}${suffix}`;
}

function rewriteMarkdownLinks(markdown) {
  return markdown
    .replace(/(\[[^\]]*\]\()([^)]+)(\))/g, (_, prefix, url, suffix) => {
      return `${prefix}${rewriteGuideUrl(url)}${suffix}`;
    })
    .replace(/^(\s*\[[^\]]+\]:\s*)(\S+)/gm, (_, prefix, url) => {
      return `${prefix}${rewriteGuideUrl(url)}`;
    })
    .replace(/(href=["'])([^"']+)(["'])/g, (_, prefix, url, suffix) => {
      return `${prefix}${rewriteGuideUrl(url)}${suffix}`;
    });
}

function normalizeGeneratedContent(content) {
  return `${content.trimEnd()}\n`;
}

function transformGuide(markdown, page) {
  return normalizeGeneratedContent(
    `${starlightFrontmatter(page)}${rewriteMarkdownLinks(stripFrontmatter(markdown)).trimStart()}`,
  );
}

function homePage() {
  return `---
title: "Taiko Documentation"
description: "Documentation for Taiko, a Node.js browser automation library."
template: splash
hero:
  tagline: "Automate browsers with readable JavaScript commands."
  actions:
    - text: "Get started"
      link: "/overview/"
      icon: "right-arrow"
    - text: "API Reference"
      link: "/api/reference/"
      icon: "document"
      variant: "minimal"
---

import { Card, CardGrid } from "@astrojs/starlight/components";

## Start Here

<CardGrid>
  <Card title="Overview" icon="open-book" href="/overview/">Learn what Taiko is and how its browser automation API works.</Card>
  <Card title="Installing" icon="setting" href="/installing/">Install Taiko globally, locally, or with npx.</Card>
  <Card title="Record and run tests" icon="pencil" href="/record-and-run-tests/">Use Taiko's recorder and run generated JavaScript test scripts.</Card>
  <Card title="API Reference" icon="document" href="/api/reference/">Browse Taiko commands, selectors, options, and examples.</Card>
</CardGrid>

## Writing Tests

<CardGrid>
  <Card title="Assertions" icon="approve-check-circle" href="/assertions/">Understand Taiko implicit assertions and custom assertion usage.</Card>
  <Card title="Working with element lists" icon="list-format" href="/working-with-element-lists/">Use Taiko selectors when multiple page elements match.</Card>
  <Card title="Taking Screenshots" icon="seti:image" href="/taking-screenshots/">Capture page and element screenshots with Taiko.</Card>
  <Card title="File Upload and Download" icon="cloud-download" href="/file-upload-and-download/">Attach files and download files in Taiko scripts.</Card>
  <Card title="Running scripts inside the browser" icon="code" href="/running-scripts-inside-the-browser/">Use evaluate to run JavaScript in the page context.</Card>
</CardGrid>

## Running and Integrating

<CardGrid>
  <Card title="Integrating with test runners" icon="rocket" href="/integrating-with-test-runners/">Run Taiko scripts with Gauge, Mocha, and other test runners.</Card>
  <Card title="Configuring Taiko" icon="setting" href="/configuring-taiko/">Configure Taiko behavior with environment variables and settings.</Card>
  <Card title="Taiko in Docker" icon="seti:docker" href="/taiko-in-docker/">Set up Taiko tests in Docker for local or CI execution.</Card>
</CardGrid>

## Extending Taiko

<CardGrid>
  <Card title="Plugins" icon="add-document" href="/plugins/">Use community Taiko plugins and load plugins in runners.</Card>
  <Card title="Writing plugins" icon="puzzle" href="/writing-plugins/">Extend Taiko with plugins and custom command behavior.</Card>
  <Card title="Experimental Features" icon="star" href="/experimental-features/">Use experimental Taiko features such as Firefox and TypeScript support.</Card>
</CardGrid>

## Help and Community

<CardGrid>
  <Card title="Frequently asked questions" icon="information" href="/frequently-asked-questions/">Answers to common questions about Taiko support and behavior.</Card>
  <Card title="Getting Help" icon="comment" href="/getting-help/">Find the right support channel for Taiko questions and issues.</Card>
  <Card title="Contributing" icon="github" href="/contributing/">Contribute issues, fixes, and improvements to Taiko.</Card>
</CardGrid>
`;
}

await mkdir(targetDir, { recursive: true });

for (const page of pages) {
  const sourcePath = path.join(sourceDir, page.source);
  const targetPath = path.join(targetDir, page.target);
  const markdown = await readFile(sourcePath, "utf8");

  await writeFile(targetPath, transformGuide(markdown, page), "utf8");
}

await writeFile(path.join(targetDir, "index.mdx"), normalizeGeneratedContent(homePage()), "utf8");

console.log(`Synced ${pages.length + 1} Starlight guide pages.`);
