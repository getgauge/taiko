# Taiko Docs Dark Sidebar Redesign

Date: 2026-06-12

## Goal

Revamp the generated Taiko documentation website with a dark, responsive layout that uses sidebar navigation. The redesign should keep the existing Eleventy documentation pipeline intact while making the site feel like a modern developer reference: readable, fast to scan, and comfortable for API-heavy pages.

The approved visual direction is **Minimal Reference**: quiet charcoal surfaces, cyan accents, a compact sticky sidebar on desktop, and a wide reading column.

## Existing Context

The documentation site is generated from `packages/taiko/docs` using Eleventy. The current build command is:

```bash
npm run doc --workspace=packages/taiko
```

The relevant implementation files are:

- `packages/taiko/docs/_includes/base.njk`
- `packages/taiko/docs/_includes/page.njk`
- `packages/taiko/docs/_includes/styles.css`
- `packages/taiko/docs/index.html`
- `packages/taiko/docs/api/*.njk`

The existing layout has a large header, centered single-column content, inline CSS, Algolia DocSearch, and per-page table-of-contents output from `eleventy-plugin-toc`.

## Design Direction

The site will use a dark base palette with restrained contrast:

- Page background: near-black charcoal.
- Sidebar surface: slightly lighter charcoal.
- Content surfaces: dark slate panels where framing helps scanning.
- Primary accent: cyan, aligned with the existing Taiko documentation accent.
- Text: high-contrast off-white for headings and readable gray for body copy.
- Code blocks: deep black surface with cyan accent treatment and clear monospace typography.

The design should avoid decorative gradients, oversized hero treatment, nested cards, and marketing-style section layouts. This is a documentation interface, so density and scan speed matter more than visual spectacle.

## Desktop Layout

Desktop and large tablet viewports will use a persistent docs shell:

- A sticky left sidebar with Taiko branding and grouped documentation links.
- A top search area in the main column using the existing `#search` input so DocSearch integration can remain.
- A main content column optimized for long-form reading and API reference pages.
- Existing in-page table-of-contents output stays available inside articles, restyled to fit the dark theme.

The sidebar should include the same documentation groups currently shown on the homepage:

- Introductory
- Intermediate
- Advanced
- API Reference

The current page should receive a visible active or hover state where practical. If Eleventy page metadata does not make robust active-state detection simple, hover and focus states are sufficient for the first pass.

## Mobile Layout

On mobile, the sidebar becomes a slide-out drawer:

- A menu button appears in the top bar.
- The drawer slides in from the left and contains the same grouped navigation.
- A dim overlay covers the rest of the page while the drawer is open.
- Selecting a navigation link closes the drawer.
- The drawer can be closed with a close button, overlay click, and Escape key.
- Body scroll should be locked while the drawer is open.

This behavior should be implemented with small vanilla JavaScript in the base template. No new frontend framework or runtime dependency is needed.

## Content And Navigation

The redesign should preserve existing page URLs, generated API pages, markdown content, and DocSearch input identity. The implementation may introduce shared navigation markup in `base.njk` so the homepage and inner pages use the same sidebar.

The homepage should shift from three plain white sections into a dark docs landing index that still prioritizes the same three groups. It does not need a marketing hero. It should act as a clear entry point into the docs.

## Accessibility

The implementation should include:

- Semantic navigation landmarks.
- Keyboard-focus-visible styles with sufficient contrast.
- Menu button state via `aria-expanded` and `aria-controls`.
- Drawer hidden state reflected through attributes or classes.
- Escape-key support for closing the mobile drawer.
- Color contrast suitable for long reading sessions.
- Responsive text and content widths that avoid horizontal overflow.

## Error Handling And Compatibility

If JavaScript fails, desktop navigation remains visible and content remains readable. On mobile without JavaScript, the menu button may not open the drawer, but all generated pages should still render content correctly.

External DocSearch assets remain as currently loaded. If DocSearch is blocked or unavailable, the search input remains visible without breaking layout.

## Testing And Verification

Verification should include:

```bash
npm run doc --workspace=packages/taiko
```

Then serve `packages/taiko/docs/_site` locally and verify:

- Homepage renders with the dark theme and sidebar navigation.
- A markdown article page renders with readable prose, links, lists, blockquotes, and code blocks.
- An API reference page renders correctly with generated API content.
- Desktop viewport shows sticky sidebar and main content without overlap.
- Mobile viewport shows the menu button, slide-out drawer, overlay, close behavior, and no horizontal overflow.
- Existing DocSearch input remains `#search`.

Browser verification should cover at least one desktop viewport and one mobile viewport.

## Non-Goals

- Changing the Eleventy build pipeline.
- Rewriting docs content.
- Replacing Algolia DocSearch.
- Adding a frontend framework.
- Redesigning Taiko branding beyond layout, colors, and typography treatment for the docs site.
