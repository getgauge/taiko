# Taiko Starlight Docs Design

## Goal

Add a new Starlight documentation site for Taiko without replacing or deleting the existing Eleventy documentation pipeline.

The new site will live in a separate workspace package at `packages/docs`, so it can be developed, built, and reviewed independently before the project decides whether to switch production docs hosting.

## Current State

Taiko currently builds documentation from `packages/taiko/docs` using Eleventy:

- `npm run doc --workspace=packages/taiko` runs `npm run doc:api` and then `eleventy`.
- `npm run doc:api --workspace=packages/taiko` runs `packages/taiko/lib/documentation.js`.
- `packages/taiko/lib/documentation.js` generates `packages/taiko/lib/api.json` from JSDoc comments in `packages/taiko/lib/taiko.js` and `packages/taiko/lib/elementWrapper/*.js`.
- `packages/taiko/docs/_data/apis.js` reads `lib/api.json` and splits entries into classes and functions for Nunjucks templates.
- `packages/taiko/docs/api/*.njk` renders the generated API pages.
- `netlify.toml` currently publishes `packages/taiko/docs/_site`.

The existing markdown pages use Eleventy frontmatter such as `layout: page.njk` and old absolute links such as `/api/attach`.

## Desired Architecture

Create a new Astro/Starlight workspace package:

```text
packages/docs/
  astro.config.mjs
  package.json
  src/
    content.config.ts
    content/
      docs/
        index.mdx
        overview.md
        installing.md
        record-and-run-tests.md
        api/
          reference.md
          attach.md
          ...
  public/
    assets/
      images/
        taiko_favicon.ico
  scripts/
    generate-api-docs.mjs
```

The existing `packages/taiko/docs` directory remains in place and continues to support `npm run doc` and `npm run doc:serve`.

## Starlight Project Setup

`packages/docs/package.json` will define the new docs package and scripts:

- `dev`: generate API docs, then run `astro dev`.
- `build`: generate API docs, then run `astro build`.
- `preview`: run `astro preview`.
- `generate:api`: run `scripts/generate-api-docs.mjs`.

The root `package.json` will add separate Starlight scripts without changing existing Eleventy scripts:

- `doc:starlight`
- `doc:starlight:dev`
- `doc:starlight:preview`

The new package will depend on Astro and Starlight. It will be included automatically by the root workspace pattern `packages/*`.

## Starlight Configuration

`packages/docs/astro.config.mjs` will configure:

- Site title: `Taiko Documentation`.
- Favicon copied from the existing docs assets.
- GitHub/social links pointing to `https://github.com/getgauge/taiko`.
- Sidebar groups based on the current docs home page:
  - Introductory
  - Intermediate
  - Advanced
  - API Reference

Manual sidebar configuration is preferred over Starlight's filesystem-generated sidebar because the existing documentation has a deliberate learning sequence that should be preserved.

## Content Migration

The existing markdown pages from `packages/taiko/docs/*.md` will be copied into `packages/docs/src/content/docs/` and converted for Starlight:

- Replace Eleventy frontmatter with Starlight frontmatter.
- Add explicit `title` values instead of deriving titles from URLs.
- Rename files from snake_case to kebab-case where that improves URL readability.
- Rewrite internal links to match Starlight routes.
- Preserve existing prose unless a change is required for routing, formatting, or correctness.
- Convert the current `packages/taiko/docs/index.html` home page into `src/content/docs/index.mdx`.

The migrated Starlight routes should preserve the important public URL intent. Where route names change from snake_case to kebab-case, deployment redirects can be added later when production hosting switches.

## API Reference Generation

The new Starlight site will continue using the existing source of truth for API metadata:

1. Run `npm run doc:api --workspace=packages/taiko`.
2. Read `packages/taiko/lib/api.json`.
3. Generate Markdown pages in `packages/docs/src/content/docs/api/`.

`packages/docs/scripts/generate-api-docs.mjs` will:

- Split API entries into functions and classes using the existing `kind` field.
- Generate one page per function or class.
- Generate an `api/reference.md` page grouped from `metadata` exported by `packages/taiko/lib/taiko.js`.
- Render descriptions, parameters, return values, examples, and links from the existing documentation.js JSON shape.
- Write deterministic output so generated API docs can be reviewed in git without noisy ordering changes.

The generator replaces the current Nunjucks templates for the Starlight site only. The old Eleventy Nunjucks templates stay untouched.

## Assets

Static assets required by the new site will be copied to `packages/docs/public/assets`.

The initial migration only needs the favicon and any images already referenced by migrated markdown. Fonts and old Eleventy-only styling will not be copied unless content depends on them, because Starlight provides the layout and base visual system.

## Deployment

The initial implementation will not switch Netlify production publishing.

`netlify.toml` can keep publishing `packages/taiko/docs/_site` until the Starlight site is reviewed. A later production-switch change can update:

- Build command to build `packages/docs`.
- Publish directory to `packages/docs/dist`.
- Redirects for old snake_case URLs and API URLs if route names change.

## Testing And Verification

The migration is complete when:

- `npm run doc:starlight` builds the Starlight site successfully from the repo root.
- `npm run doc:starlight:dev` starts a local Astro server.
- The generated API reference page and at least one function API page render.
- At least one migrated guide page renders with working internal links.
- The sidebar shows Introductory, Intermediate, Advanced, and API Reference groups.
- Existing Eleventy scripts still exist and are not intentionally changed.

## Decisions

The approved direction is to add the new Starlight site under `packages/docs` and keep the existing Eleventy docs intact. Production deployment switching is out of scope for the first implementation.
