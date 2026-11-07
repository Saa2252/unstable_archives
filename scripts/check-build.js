/*
 * Post-build checks for the generated site.
 *
 * These exist because the Jekyll-to-Eleventy migration shipped a build that
 * looked healthy — every page rendered, every HTTP request returned 200 — while
 * the IIIF viewer was dead on all 52 item pages. The derivative files were
 * being copied through as unrendered Jekyll templates, so they were invalid
 * JSON that only the browser ever tried to parse. Nothing in a page-level
 * comparison could catch that, so it is checked explicitly here.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const { baseurl } = require(path.join(ROOT, "_data", "site.json"));

const failures = [];
const note = (msg) => console.log(`  ${msg}`);

function walk(dir, filter, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, filter, out);
    else if (filter(entry.name)) out.push(full);
  }
  return out;
}

// 1. The site built at all.
if (!fs.existsSync(SITE)) {
  console.error("_site does not exist - run `npm run build` first.");
  process.exit(1);
}

// 2. Every IIIF derivative file is valid JSON. This is the check that would
//    have caught the broken image viewer.
const iiif = walk(path.join(SITE, "img", "derivatives", "iiif"), (n) => n.endsWith(".json"));
let badJson = 0;
for (const file of iiif) {
  try {
    JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    badJson++;
    if (badJson <= 3) failures.push(`invalid JSON: ${path.relative(SITE, file)}`);
  }
}
if (badJson) failures.push(`${badJson} IIIF file(s) are not valid JSON`);
note(`IIIF files: ${iiif.length} checked, ${badJson} invalid`);

// 3. No unrendered template syntax escaped into the output.
const leaked = [...iiif, ...walk(SITE, (n) => n.endsWith(".html"))].filter((f) =>
  /\{\{|\{%|^---\r?\n/.test(fs.readFileSync(f, "utf8"))
);
if (leaked.length) {
  failures.push(`${leaked.length} file(s) contain unrendered template syntax, e.g. ${path.relative(SITE, leaked[0])}`);
}
note(`Template leakage: ${leaked.length} file(s)`);

// 4. Internal links resolve to something on disk.
const pages = walk(SITE, (n) => n.endsWith(".html"));
const broken = new Map();
let linkCount = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  for (const match of html.matchAll(/(?:href|src)=["'](\/[^"'#?]*)/g)) {
    const url = match[1];
    if (url !== baseurl && !url.startsWith(baseurl + "/")) continue;
    linkCount++;
    const target = path.join(SITE, decodeURIComponent(url.slice(baseurl.length) || "/"));
    const ok =
      (fs.existsSync(target) && fs.statSync(target).isFile()) ||
      fs.existsSync(path.join(target, "index.html"));
    if (!ok) broken.set(url, (broken.get(url) || 0) + 1);
  }
}
note(`Internal links: ${linkCount} checked, ${broken.size} broken target(s)`);
for (const [url, n] of broken) note(`  broken: ${url} (${n}x)`);

// img/wax_workflow.jpg is a known-missing asset inherited from the Jekyll site.
// It is reported above but tolerated so the build stays green until the file is
// supplied; any *additional* broken link fails the check.
const KNOWN_MISSING = new Set([`${baseurl}/img/wax_workflow.jpg`]);
const unexpected = [...broken.keys()].filter((u) => !KNOWN_MISSING.has(u));
if (unexpected.length) failures.push(`broken internal link(s): ${unexpected.join(", ")}`);

// 5. The pages that carry the collection are actually present.
const expected = [
  "index.html",
  "collection/index.html",
  "search/index.html",
  "search/index.json",
  "exhibits/index.html",
  "unstable_archives/item1/index.html",
];
for (const rel of expected) {
  if (!fs.existsSync(path.join(SITE, rel))) failures.push(`missing expected page: ${rel}`);
}

const items = fs.existsSync(path.join(SITE, "unstable_archives"))
  ? fs.readdirSync(path.join(SITE, "unstable_archives"), { withFileTypes: true }).filter((e) => e.isDirectory()).length
  : 0;
if (items !== 52) failures.push(`expected 52 archive item pages, found ${items}`);
note(`Archive item pages: ${items}`);

if (failures.length) {
  console.error("\nBuild checks FAILED:");
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
console.log("\nBuild checks passed.");
