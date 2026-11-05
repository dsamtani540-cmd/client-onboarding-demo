// Builds the static site into a folder and stamps it with the commit and environment.
// Usage: node scripts/build.mjs --env staging --sha <commit> --out dist
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const env = arg("env", "local");
const sha = arg("sha", "local");
const out = arg("out", "dist");
if (!["local", "staging", "production"].includes(env)) throw new Error(`Unknown environment "${env}"`);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync("index.html", join(out, "index.html"));
cpSync("src", join(out, "src"), { recursive: true });
writeFileSync(join(out, "version.json"), JSON.stringify({ sha, env, builtAt: new Date().toISOString() }, null, 2) + "\n");
writeFileSync(join(out, ".nojekyll"), "");
console.log(`Built ${env} from ${sha} into ${out}`);
