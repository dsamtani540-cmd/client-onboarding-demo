# Client Onboarding (PIL test app)

A small Client Onboarding app used to test PIL end to end: PIL reads this repository, commits a change to a branch, opens a pull request, waits for the tests, deploys to staging, and after the Product Owner approves, merges and releases to production.

All data is sample data, kept in the browser.

## What it does

- **New client intake:** legal name, client type, country and beneficial owners with passport details.
- **Intake check:** required fields, ownership adding up to no more than 100%, a warning when no owner holds 25% or more, and high-risk countries.
- **Intake queue:** three sample cases, each re-checked every time the page loads.

See [CONNECT-TO-PIL.md](CONNECT-TO-PIL.md) to connect this app to PIL and release the passport feature through it.

## Layout

| Path | What it is |
|---|---|
| `index.html`, `src/app.js`, `src/styles.css` | The screens |
| `src/checks.js`, `src/countries.js` | Intake rules (tested) |
| `src/flags.js` | Feature flags |
| `test/` | Tests, run with `npm test` (Node 20 or later, no dependencies) |
| `scripts/build.mjs` | Copies the site into `dist/` and stamps it with the commit and environment |
| `.github/workflows/ci.yml` | Runs the tests on every pull request and push to main |
| `.github/workflows/deploy.yml` | Deploys to GitHub Pages: `staging` to `/staging/`, `production` to the site root |
| `.pil/system-map.json` | What PIL shows as the system map when it reads this repository |

## Run it locally

```bash
npm test
npm start          # http://localhost:8080
```

## Environments

Both environments are served by GitHub Pages from the `gh-pages` branch:

- Production: `https://<owner>.github.io/client-onboarding-demo/`
- Staging: `https://<owner>.github.io/client-onboarding-demo/staging/`

Each page shows its commit and environment in the footer, and staging has a yellow banner. `version.json` in each environment says which commit is live; PIL reads it to confirm a deploy has landed.

Production can only be deployed from `main`.
