# Security Review Report

Review date: 2026-05-25

Scope reviewed:

- CLI entry points in `packages/taiko/bin`
- Browser installation and launch code in `packages/taiko/lib/browser`
- Plugin loading in `packages/taiko/lib/plugins.js` and `packages/taiko/lib/taiko.js`
- REPL code generation and history handling
- Runtime/page evaluation helpers
- Production dependency audit from `package-lock.json`

## Findings

### 1. Chromium download disables TLS certificate validation when a proxy is configured

Severity: High

Status: Fixed in this branch.

Location:

- `packages/taiko/lib/browser/fetcher.js:193`
- `packages/taiko/lib/browser/fetcher.js:204`
- `packages/taiko/lib/browser/fetcher.js:211`

The Chromium downloader honors proxy environment variables through `proxy-from-env` and `https-proxy-agent`. When a proxy is present, the request options set `rejectUnauthorized = false`.

This disables certificate validation during the install-time Chromium download path. A user installing Taiko behind a configured proxy can receive and extract a forged Chromium archive without TLS certificate verification failing. Because the downloaded archive is later used as the browser executable, this creates a supply-chain code execution risk in environments where proxy settings can be influenced or where an untrusted proxy is used.

Relevant flow:

- `packages/taiko/lib/install.js` calls `browserFetcher.download(...)`
- `download(...)` calls `downloadFile(this.downloadURL, zipPath, ...)`
- `downloadFile(...)` uses `httpRequest(...)`
- `httpRequest(...)` sets `options.rejectUnauthorized = false` whenever `getProxyForUrl(url)` returns a proxy

Recommendation:

- Do not disable TLS verification by default. This branch removes `options.rejectUnauthorized = false`.
- If a custom corporate CA is required, let Node's standard trust configuration handle it through `NODE_EXTRA_CA_CERTS` or documented npm/Node certificate settings.
- This branch adds a regression test that asserts proxied Chromium download requests keep TLS verification enabled.

### 2. Downloaded Chromium archives are extracted without integrity verification

Severity: Medium

Location:

- `packages/taiko/lib/browser/fetcher.js:96`
- `packages/taiko/lib/browser/fetcher.js:97`
- `packages/taiko/package.json:22`

The installer downloads a Chromium archive from the URL stored in `packages/taiko/package.json` and extracts it directly. The code relies on HTTPS transport security only and does not verify a pinned checksum or signature before extraction.

This increases impact if transport security is weakened by misconfiguration, proxy behavior, compromised download metadata, or registry/package metadata tampering. The issue is especially relevant because this path runs during package installation and produces an executable that Taiko launches later.

Recommendation:

- Store expected SHA-256 checksums for each platform archive alongside the download URLs.
- Verify the downloaded file before extraction.
- Fail closed if the checksum is missing or mismatched.

### 3. Production dependency audit reports vulnerable transitive dependencies through `documentation`

Severity: High

Location:

- `packages/taiko/package.json:68`
- `package-lock.json`

Command run:

```sh
npm.cmd audit --workspace=packages/taiko --omit=dev --json
```

Result summary:

- 12 total vulnerabilities
- 5 high severity
- 7 moderate severity
- No automatic fix available for the top-level `documentation` dependency chain

Notable advisories reported by `npm audit`:

- `lodash` code injection and prototype pollution advisories through `documentation`
- `minimatch` ReDoS advisories through `glob`
- `picomatch` ReDoS / method injection advisories through `chokidar`
- `postcss` XSS advisory through `@vue/compiler-sfc`
- `vue-template-compiler` XSS advisory

The `documentation` package is currently listed under production dependencies, and Taiko runs documentation generation in the package lifecycle:

- `packages/taiko/package.json:18` has `postinstall: node lib/documentation.js`
- `packages/taiko/package.json:68` lists `"documentation": "^14.0.1"` under `dependencies`

Recommendation:

- Move documentation generation out of the install path if possible.
- Move `documentation` and related build-only packages to `devDependencies` if they are not needed at runtime.
- If generated API data is required in the published package, generate it during release/build and publish the generated artifact.
- Re-run `npm audit --omit=dev` after dependency changes to ensure runtime installs no longer include these vulnerable chains.

## Reviewed behavior considered expected

The following areas were reviewed and were not treated as vulnerabilities because they are core Taiko behavior or require already-trusted local input:

- `taiko <script.js>` executes local user-provided JavaScript.
- The REPL evaluates user-entered commands and can write generated code to user-provided paths.
- Taiko plugins are loaded from local project or global `node_modules`; installing a malicious plugin already grants code execution through Node package installation/loading.
- `evaluate(...)` intentionally executes user-provided callbacks inside the browser context.
- Browser launch options can be customized by caller-provided `options.args` and `TAIKO_BROWSER_ARGS`.

## Suggested PR scope

A focused upstream PR could:

1. Remove `rejectUnauthorized = false` from `packages/taiko/lib/browser/fetcher.js`.
2. Add or update unit tests around proxied Chromium downloads.
3. Move documentation tooling out of runtime dependencies and the install lifecycle, or document why it must remain.
4. Add checksum verification for Chromium archives as a follow-up hardening change.
