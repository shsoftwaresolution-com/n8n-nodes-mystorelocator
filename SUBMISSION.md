# n8n – publishing checklist

Checked against docs.n8n.io ("Submit community nodes", "Verification guidelines") on 2026-10-25. **Nothing was published.**

## What is needed
- An **npm account** (or organisation) that owns the name `n8n-nodes-mystorelocator` (free).
- A **public GitHub repository** with the package source – required for verification (README/docs links and provenance).
  The monorepo `msl-integrations` is private; making anything public needs Sajjad's OK. Plan: a new public repo
  `shsoftwaresolution-com/n8n-nodes-mystorelocator` with the contents of `n8n/` (the docs URLs in the nodes already point there).
- An **n8n Creator Portal** account for the verification request (free). No fees.

## Rules the package already meets
- Name starts with `n8n-nodes-`, keyword `n8n-community-node-package`, nodes/credentials listed under `n8n` in package.json.
- `@n8n/node-cli` ≥ 0.23 as devDependency (0.53.4), `npm run lint` clean, **no runtime dependencies** (only `n8n-workflow` as peer).
- README in the package, MIT licence, light + dark SVG icons, English UI texts.
- Errors are thrown as `NodeApiError` / `NodeOperationError`; `continueOnFail` supported.

## Publishing (since 1 May 2026 verified nodes must be published from GitHub Actions with npm provenance)
1. Create the public repo, copy `n8n/` into it, add `ci/publish.yml` as `.github/workflows/publish.yml`.
2. On npmjs.com: package settings → **Trusted Publishers** → GitHub Actions, repo `shsoftwaresolution-com/n8n-nodes-mystorelocator`,
   workflow `publish.yml` (no token needed). For the very first publish npm may require the package to exist – then use a granular
   token once as repo secret `NPM_TOKEN`.
3. Locally `npm run release` (lint, build, version bump, changelog, tag, push) → the workflow publishes with provenance.
4. Creator Portal → submit `n8n-nodes-mystorelocator` for verification. Reviewers need a working API key → a test company with
   Starter or higher (see zapier/APP-NEEDS.md, point 5). n8n may reject nodes that compete with its paid features – not the case here.
5. Unverified community nodes can be installed by self-hosted users right after the npm publish; n8n Cloud shows only verified nodes.

## Notes
- The webhook trigger registers and removes its webhook through the Customer API (app PR #65 must be live first).
