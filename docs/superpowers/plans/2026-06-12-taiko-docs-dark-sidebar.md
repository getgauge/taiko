# Taiko Docs Dark Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved dark, responsive Taiko documentation layout with desktop sidebar navigation and a mobile slide-out drawer.

**Architecture:** Keep the existing Eleventy pipeline and generated URLs intact. Add a shared docs shell in `base.njk`, keep article-specific structure in `page.njk`, restyle the site in the existing inlined `styles.css`, and add a small vanilla JavaScript drawer controller in the base template. Add a generated-HTML regression test that verifies the layout contracts after `npm run doc`.

**Tech Stack:** Eleventy 3, Nunjucks, Markdown, vanilla CSS, vanilla JavaScript, Node.js `node:test`/`assert`, existing npm workspace scripts.

---

## File Structure

- Modify `package.json`: add a root script for the docs layout regression test.
- Create `tests/docs-layout.test.js`: builds assertions against generated files in `packages/taiko/docs/_site`.
- Modify `packages/taiko/docs/_includes/base.njk`: replace the old hero header with a docs app shell, shared sidebar navigation, mobile menu controls, search, overlay, and drawer script.
- Modify `packages/taiko/docs/_includes/page.njk`: remove the duplicated home breadcrumb section and add article classes that work with the new shell.
- Modify `packages/taiko/docs/_includes/api.njk`: remove the duplicated breadcrumb section and use the same content container as markdown pages.
- Modify `packages/taiko/docs/_includes/styles.css`: replace the old light theme and header styles with the approved dark theme, sidebar layout, content typography, DocSearch overrides, and responsive drawer styles.
- Modify `packages/taiko/docs/index.html`: add a homepage intro and classes for the grouped docs index while keeping the same links and sections.

## Task 1: Add Generated-HTML Layout Contract Test

**Files:**
- Modify: `package.json`
- Create: `tests/docs-layout.test.js`

- [ ] **Step 1: Add the failing test script**

Add this script entry to the root `package.json` `scripts` object after `test-docs`:

```json
"test:docs-layout": "npm run doc --workspace=packages/taiko && node --test tests/docs-layout.test.js"
```

Create `tests/docs-layout.test.js`:

```javascript
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const siteDir = path.join(__dirname, "..", "packages", "taiko", "docs", "_site");

function readGenerated(relativePath) {
  return fs.readFileSync(path.join(siteDir, relativePath, "index.html"), "utf-8");
}

test("generated docs pages include the shared dark docs shell", () => {
  const homepage = readGenerated(".");
  const overview = readGenerated("overview");
  const apiReference = readGenerated(path.join("api", "reference"));

  for (const html of [homepage, overview, apiReference]) {
    assert.match(html, /class="docs-shell"/);
    assert.match(html, /class="docs-sidebar"/);
    assert.match(html, /id="docs-navigation"/);
    assert.match(html, /class="docs-main"/);
    assert.match(html, /id="search"/);
    assert.match(html, /data-docs-menu-toggle/);
    assert.match(html, /data-docs-overlay/);
  }
});

test("generated docs navigation keeps core documentation links", () => {
  const homepage = readGenerated(".");

  assert.match(homepage, /href="\/overview"/);
  assert.match(homepage, /href="\/installing"/);
  assert.match(homepage, /href="\/api\/reference"/);
  assert.match(homepage, /href="\/writing_plugins"/);
});

test("inlined stylesheet contains dark theme, sidebar, and drawer rules", () => {
  const homepage = readGenerated(".");

  assert.match(homepage, /--color-bg: #070b12/);
  assert.match(homepage, /\.docs-sidebar/);
  assert.match(homepage, /position: sticky/);
  assert.match(homepage, /\.docs-overlay/);
  assert.match(homepage, /transform: translateX\(-100%\)/);
  assert.match(homepage, /body\.docs-menu-open/);
});

test("drawer controller exposes accessible state changes", () => {
  const homepage = readGenerated(".");

  assert.match(homepage, /aria-expanded="false"/);
  assert.match(homepage, /aria-controls="docs-navigation"/);
  assert.match(homepage, /docs-menu-open/);
  assert.match(homepage, /event\.key === "Escape"/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm run test:docs-layout
```

Expected: fail because the generated HTML does not yet include `docs-shell`, `docs-sidebar`, drawer controls, or the new CSS variables.

- [ ] **Step 3: Commit the failing test**

Run:

```bash
git add package.json tests/docs-layout.test.js
git commit -m "test: add docs layout contract"
```

## Task 2: Add Shared Docs Shell Markup

**Files:**
- Modify: `packages/taiko/docs/_includes/base.njk`

- [ ] **Step 1: Replace the old header/body shell**

Replace the `<body>` contents in `base.njk` with this structure, preserving the existing inline CSS include, DocSearch script import, and footer copyright:

```njk
	<body>
		<div class="docs-shell">
			<div class="docs-overlay" data-docs-overlay hidden></div>
			<aside class="docs-sidebar" id="docs-navigation" aria-label="Documentation navigation">
				<div class="docs-sidebar-header">
					<a class="docs-brand" href="/">
						<span class="docs-brand-mark">T</span>
						<span>
							<span class="docs-brand-name">Taiko</span>
							<span class="docs-brand-subtitle">Documentation</span>
						</span>
					</a>
					<button class="docs-sidebar-close" type="button" data-docs-menu-close aria-label="Close navigation">×</button>
				</div>

				<nav class="docs-nav" aria-label="Documentation sections">
					<p class="docs-nav-label">Introductory</p>
					<a href="/overview">Overview</a>
					<a href="/installing">Installing</a>
					<a href="/record_and_run_tests">Record and run tests</a>
					<a href="/api/reference">API Reference</a>
					<a href="/frequently_asked_questions">Frequently asked questions</a>
					<a href="/getting_help">Getting Help</a>

					<p class="docs-nav-label">Intermediate</p>
					<a href="/taking_screenshots">Taking Screenshots</a>
					<a href="/assertions">Assertions</a>
					<a href="/file_upload_and_download">File Upload and Download</a>
					<a href="/working_with_element_lists">Working with element lists</a>
					<a href="/integrating_with_test_runners">Integrating with test runners</a>
					<a href="/configuring_taiko">Configuring Taiko</a>
					<a href="/plugins">Plugins</a>

					<p class="docs-nav-label">Advanced</p>
					<a href="/running_scripts_inside_the_browser">Running scripts inside the browser</a>
					<a href="/taiko_in_docker">Taiko in Docker</a>
					<a href="/writing_plugins">Writing plugins</a>
					<a href="/experimental_features">Experimental Features</a>
					<a href="/contributing">Contributing</a>
				</nav>
			</aside>

			<div class="docs-main">
				<header class="docs-topbar">
					<button class="docs-menu-button" type="button" data-docs-menu-toggle aria-controls="docs-navigation" aria-expanded="false">
						<span></span>
						<span></span>
						<span></span>
						<span class="visually-hidden">Open navigation</span>
					</button>
					<form class="search">
						<input type="text" id="search" placeholder="Search Taiko Docs"/>
					</form>
					<a class="docs-github-link" href="https://github.com/getgauge/taiko">GitHub</a>
				</header>

				<main class="docs-content" id="main-content">
					{{ content | safe }}
				</main>

				<footer>
					<div class="footer">
						<div><strong>Copyright &copy; <a href="https://taiko.dev">Taiko</a>,</strong> <a href="https://github.com/getgauge/taiko/blob/master/LICENSE">MIT license</a></div>
						<div>
							<a href="https://www.netlify.com">
								<img src="https://www.netlify.com/img/global/badges/netlify-light.svg" alt="Deploys by Netlify" />
							</a>
						</div>
					</div>
				</footer>
			</div>
		</div>
```

- [ ] **Step 2: Add the drawer controller before `</body>`**

Add this script after the DocSearch initialization script and before the footer if the footer was not moved, or after the footer if it was moved into `.docs-main` as shown above:

```html
		<script>
			(function docsNavigation() {
				const body = document.body;
				const toggle = document.querySelector("[data-docs-menu-toggle]");
				const close = document.querySelector("[data-docs-menu-close]");
				const overlay = document.querySelector("[data-docs-overlay]");
				const nav = document.querySelector("#docs-navigation");

				if (!toggle || !close || !overlay || !nav) {
					return;
				}

				function setOpen(isOpen) {
					body.classList.toggle("docs-menu-open", isOpen);
					toggle.setAttribute("aria-expanded", String(isOpen));
					overlay.hidden = !isOpen;
				}

				toggle.addEventListener("click", () => setOpen(true));
				close.addEventListener("click", () => setOpen(false));
				overlay.addEventListener("click", () => setOpen(false));
				nav.addEventListener("click", (event) => {
					if (event.target.closest("a")) {
						setOpen(false);
					}
				});
				document.addEventListener("keydown", (event) => {
					if (event.key === "Escape") {
						setOpen(false);
					}
				});
			})();
		</script>
```

- [ ] **Step 3: Run the layout test**

Run:

```bash
npm run test:docs-layout
```

Expected: still fail because CSS rules and content classes are not implemented yet.

## Task 3: Normalize Article And API Content Containers

**Files:**
- Modify: `packages/taiko/docs/_includes/page.njk`
- Modify: `packages/taiko/docs/_includes/api.njk`
- Modify: `packages/taiko/docs/index.html`

- [ ] **Step 1: Replace `page.njk` with article-first markup**

Use:

```njk
---
layout: base.njk
---
<article class="docs-article">
  <nav class="docs-breadcrumb" aria-label="Breadcrumb">
    <a href="/">Home</a>
  </nav>
  <h1>{{ page.url | heading }}</h1>
  <aside class="docs-toc" aria-label="On this page">
    {{ content |  toc | safe }}
  </aside>
  {{ content | safe }}
</article>
```

- [ ] **Step 2: Replace `api.njk` with article-first markup**

Use:

```njk
---
layout: base.njk
---
<article class="docs-article">
    <nav class="docs-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <a href="/api/reference">API Reference</a>
    </nav>
    {{ content | safe }}
</article>
```

- [ ] **Step 3: Add homepage landing copy and classed sections**

In `packages/taiko/docs/index.html`, keep all existing links but wrap the page with:

```html
<section class="docs-home-hero">
  <h1>Taiko Documentation</h1>
  <p>Automate Chromium browsers with a clear, readable API and documentation built for fast reference.</p>
</section>
```

Change each existing `<section class="home-section">` to:

```html
<section class="home-section docs-index-section">
```

- [ ] **Step 4: Run the layout test**

Run:

```bash
npm run test:docs-layout
```

Expected: still fail until stylesheet contracts are added.

## Task 4: Implement Dark Theme, Sidebar, Content, And Drawer CSS

**Files:**
- Modify: `packages/taiko/docs/_includes/styles.css`

- [ ] **Step 1: Replace the current stylesheet**

Replace `styles.css` with a dark-theme stylesheet that includes these required contracts:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap");

:root {
  --color-bg: #070b12;
  --color-sidebar: #0d1420;
  --color-panel: #101927;
  --color-panel-strong: #121f30;
  --color-border: #243244;
  --color-border-strong: #334155;
  --color-text: #e5eefb;
  --color-muted: #9fb0c6;
  --color-subtle: #718096;
  --color-accent: #22d3ee;
  --color-accent-strong: #67e8f9;
  --shadow-panel: 0 18px 48px rgba(0, 0, 0, 0.28);
  --sidebar-width: 18rem;
  --content-width: 58rem;
}

html {
  min-height: 100%;
  box-sizing: border-box;
  background: var(--color-bg);
}

*,
*:before,
*:after {
  box-sizing: inherit;
}

body {
  min-height: 100%;
  margin: 0;
  font-family: Inter, "Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 16px;
  line-height: 1.75;
  color: var(--color-text);
  background: var(--color-bg);
}

body.docs-menu-open {
  overflow: hidden;
}

a,
a:visited,
a:active {
  color: var(--color-accent-strong);
}

a:hover {
  color: #ffffff;
}

a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

img {
  max-width: 100%;
  height: auto;
  border: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.docs-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100vh;
}

.docs-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  padding: 1.5rem 1rem;
  background: var(--color-sidebar);
  border-right: 1px solid var(--color-border);
}

.docs-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.docs-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text);
  text-decoration: none;
}

.docs-brand-mark {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  color: #041016;
  background: var(--color-accent);
  font-weight: 800;
}

.docs-brand-name,
.docs-brand-subtitle {
  display: block;
  line-height: 1.2;
}

.docs-brand-name {
  font-weight: 800;
}

.docs-brand-subtitle {
  color: var(--color-muted);
  font-size: 0.8rem;
}

.docs-sidebar-close {
  display: none;
}

.docs-nav {
  display: grid;
  gap: 0.15rem;
}

.docs-nav-label {
  margin: 1.25rem 0 0.35rem;
  color: var(--color-subtle);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.docs-nav a {
  display: block;
  padding: 0.48rem 0.65rem;
  border-radius: 0.45rem;
  color: var(--color-muted);
  text-decoration: none;
  font-size: 0.92rem;
  line-height: 1.35;
}

.docs-nav a:hover,
.docs-nav a:focus-visible {
  color: var(--color-text);
  background: rgba(34, 211, 238, 0.1);
}

.docs-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.docs-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem clamp(1rem, 4vw, 3rem);
  background: rgba(7, 11, 18, 0.92);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(14px);
}

.docs-menu-button {
  display: none;
}

form.search {
  flex: 1;
  max-width: 44rem;
  padding: 0;
  margin: 0;
}

form.search input {
  box-sizing: border-box;
  width: 100%;
  height: 2.75rem;
  padding: 0 1rem;
  color: var(--color-text);
  background: var(--color-panel);
  border: 1px solid var(--color-border-strong);
  border-radius: 0.55rem;
  font: inherit;
  outline: none;
}

form.search input::placeholder {
  color: var(--color-subtle);
}

.docs-github-link {
  color: var(--color-muted);
  font-size: 0.9rem;
  text-decoration: none;
}

.docs-content {
  width: min(100%, var(--content-width));
  margin: 0 auto;
  padding: 3rem clamp(1rem, 4vw, 3rem);
}

.docs-home-hero {
  margin: 0 0 2rem;
  padding: 0;
  background: transparent;
}

.docs-home-hero h1,
.docs-article h1 {
  margin: 0 0 1rem;
  color: var(--color-text);
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.05;
}

.docs-home-hero p {
  max-width: 42rem;
  margin: 0;
  color: var(--color-muted);
  font-size: 1.1rem;
}

.home-section,
.docs-article {
  margin: 0 0 1.25rem;
  padding: 1.5rem;
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-panel);
}

.home-section h2,
.docs-article h2,
.docs-article h3,
.docs-article h4,
.docs-article h5,
.docs-article h6 {
  color: var(--color-text);
  line-height: 1.25;
}

.docs-index-section ul {
  columns: 15em;
}

ul,
ol {
  padding-inline-start: 1.2rem;
  margin-bottom: 2em;
}

li {
  line-height: 1.9;
}

li::marker {
  color: var(--color-accent);
}

.home-section ul {
  list-style: none;
}

.home-section ul li::before,
li::before {
  content: none;
}

p {
  margin: 1em 0;
}

blockquote {
  margin-inline-start: 0;
  padding: 0.75rem 1rem;
  color: var(--color-muted);
  background: rgba(34, 211, 238, 0.08);
  border-left: 4px solid var(--color-accent);
  border-radius: 0.25rem;
}

code {
  padding: 0.16rem 0.32rem;
  color: #cffafe;
  background: #07111f;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 0.25rem;
  font-family: "Roboto Mono", ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.9em;
}

pre code {
  display: block;
  max-width: 100%;
  padding: 1rem;
  overflow: auto;
  color: #e0f2fe;
  background: #020617;
  border: 1px solid rgba(34, 211, 238, 0.22);
  border-left: 4px solid var(--color-accent);
  border-radius: 0.5rem;
}

.docs-breadcrumb,
.docs-toc {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.docs-breadcrumb {
  margin-bottom: 1rem;
}

.docs-breadcrumb a {
  text-decoration: none;
}

.docs-toc {
  padding: 1rem;
  margin: 1.5rem 0;
  background: rgba(2, 6, 23, 0.35);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
}

.docs-toc ol,
.docs-toc ul {
  margin: 0;
}

a.direct-link {
  padding-left: 0.35rem;
  color: var(--color-subtle);
  font-size: 0.85em;
  text-decoration: none;
}

article hr {
  height: 1px;
  background-color: var(--color-border);
  border: none;
}

details {
  padding: 1rem;
  background: rgba(2, 6, 23, 0.35);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
}

summary {
  cursor: pointer;
  color: var(--color-text);
  font-weight: 700;
}

dl {
  margin: 1rem 0;
}

dt {
  color: var(--color-text);
  font-weight: 700;
}

dd {
  margin: 0.5rem 0 1rem 1rem;
  color: var(--color-muted);
}

footer {
  width: min(100%, var(--content-width));
  margin: auto auto 0;
  padding: 1.5rem clamp(1rem, 4vw, 3rem) 2rem;
  color: var(--color-subtle);
}

.footer {
  display: flex;
  flex-flow: row wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
}

.footer img {
  max-width: 8rem;
}

.algolia-autocomplete,
.algolia-autocomplete .ds-dropdown-menu {
  max-width: 100%;
}

.docs-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(2, 6, 23, 0.68);
}

@media (max-width: 920px) {
  .docs-shell {
    display: block;
  }

  .docs-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 50;
    width: min(82vw, 21rem);
    transform: translateX(-100%);
    transition: transform 180ms ease;
    box-shadow: var(--shadow-panel);
  }

  body.docs-menu-open .docs-sidebar {
    transform: translateX(0);
  }

  .docs-sidebar-close,
  .docs-menu-button {
    display: inline-grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-text);
    background: var(--color-panel);
    border: 1px solid var(--color-border-strong);
    border-radius: 0.5rem;
  }

  .docs-sidebar-close {
    font-size: 1.5rem;
    line-height: 1;
  }

  .docs-menu-button span:not(.visually-hidden) {
    width: 1rem;
    height: 2px;
    margin: 2px 0;
    background: currentColor;
    border-radius: 99px;
  }

  .docs-topbar {
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .docs-github-link {
    display: none;
  }

  .docs-content {
    padding: 1.5rem 1rem 2rem;
  }

  .home-section,
  .docs-article {
    padding: 1rem;
  }

  .docs-home-hero h1,
  .docs-article h1 {
    font-size: 2.2rem;
  }
}

@media (max-width: 560px) {
  body {
    font-size: 15px;
  }

  .docs-topbar {
    align-items: stretch;
  }

  form.search input {
    height: 2.5rem;
  }

  .docs-index-section ul {
    columns: 1;
  }
}
```

- [ ] **Step 2: Run the layout test and verify GREEN**

Run:

```bash
npm run test:docs-layout
```

Expected: pass.

- [ ] **Step 3: Commit the template and style implementation**

Run:

```bash
git add packages/taiko/docs/_includes/base.njk packages/taiko/docs/_includes/page.njk packages/taiko/docs/_includes/api.njk packages/taiko/docs/_includes/styles.css packages/taiko/docs/index.html
git commit -m "docs: add dark responsive docs layout"
```

## Task 5: Browser QA And Responsive Fixes

**Files:**
- Modify: `packages/taiko/docs/_includes/styles.css` if browser QA reveals layout issues.
- Modify: `packages/taiko/docs/_includes/base.njk` if drawer behavior needs markup adjustments.

- [ ] **Step 1: Build the docs**

Run:

```bash
npm run doc --workspace=packages/taiko
```

Expected: exit code 0 and generated files under `packages/taiko/docs/_site`.

- [ ] **Step 2: Serve generated docs**

Run:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

from:

```bash
/Users/zabilcm/projects/taiko/packages/taiko/docs/_site
```

Expected: local static server available at `http://127.0.0.1:8080/`.

- [ ] **Step 3: Verify desktop in Browser**

Open:

```text
http://127.0.0.1:8080/
```

Check:

- Sidebar is visible and sticky.
- Search input is visible in the top bar.
- Homepage uses dark theme and no old cyan hero background.
- Grouped docs links are readable.
- No horizontal overflow.

- [ ] **Step 4: Verify article and API pages in Browser**

Open:

```text
http://127.0.0.1:8080/overview/
http://127.0.0.1:8080/api/reference/
```

Check:

- Article headings, paragraphs, links, lists, blockquotes, and code blocks are readable.
- API index details block and generated API links fit the dark theme.
- In-page table of contents is framed and readable.

- [ ] **Step 5: Verify mobile drawer in Browser**

Set a mobile viewport around `390x844`, reload the homepage, and check:

- Sidebar is hidden by default.
- Menu button is visible.
- Clicking the menu button slides in the drawer and shows overlay.
- Close button closes drawer.
- Overlay click closes drawer.
- Escape key closes drawer.
- Clicking a nav link closes drawer.
- Body does not horizontally overflow.

- [ ] **Step 6: Fix any QA issues with the smallest CSS/markup change**

If text wraps poorly, controls overlap, or the drawer does not close correctly, patch only the relevant rule or script branch and rerun:

```bash
npm run test:docs-layout
npm run doc --workspace=packages/taiko
```

- [ ] **Step 7: Commit QA fixes if any**

If QA fixes were needed, run:

```bash
git add packages/taiko/docs/_includes/base.njk packages/taiko/docs/_includes/styles.css packages/taiko/docs/index.html
git commit -m "docs: polish responsive docs layout"
```

## Task 6: Final Verification

**Files:**
- No planned file changes.

- [ ] **Step 1: Run automated verification**

Run:

```bash
npm run test:docs-layout
```

Expected: pass.

- [ ] **Step 2: Run the docs build**

Run:

```bash
npm run doc --workspace=packages/taiko
```

Expected: exit code 0.

- [ ] **Step 3: Inspect git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only intentional docs layout, test, and script changes are present. Existing unrelated modified files from before this work should not be staged or reverted.

## Self-Review

- Spec coverage: tasks cover the dark palette, desktop sidebar, mobile slide-out drawer, DocSearch `#search`, homepage index, generated API pages, accessibility attributes, Escape/overlay/link close behavior, Eleventy build, and browser QA.
- Placeholder scan: no TBD/TODO/fill-in-later placeholders are present.
- Type and selector consistency: test selectors match the planned template attributes and classes: `docs-shell`, `docs-sidebar`, `docs-main`, `docs-navigation`, `data-docs-menu-toggle`, `data-docs-overlay`, `docs-menu-open`, and CSS variable `--color-bg`.
