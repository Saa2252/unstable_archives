/*
 * Renders the IIIF derivative files that wax_iiif emits as Jekyll templates.
 *
 * wax_iiif writes every manifest, sequence, canvas, annotation and info.json
 * with YAML front matter and a Liquid placeholder for the site's base URL, on
 * the assumption that Jekyll will render them. Eleventy treats `img/` as a
 * passthrough copy, so without this step those files reach `_site/` with their
 * front matter and `{{ ... }}` placeholders intact — which is invalid JSON, and
 * leaves the OpenSeadragon viewer unable to load any image.
 *
 * This runs after Eleventy and overwrites the passthrough copies in place.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "img");

// Matches the leading `---\n...\n---\n` front matter block only.
const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

// The sole Liquid expression wax_iiif emits, e.g. "{{ '/' | absolute_url }}img/...".
// Jekyll's absolute_url on '/' yields "<baseurl>/", so the trailing slash stays here.
const BASE_URL_TAG = /\{\{\s*'\/'\s*\|\s*absolute_url\s*\}\}/g;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith(".json")) yield full;
  }
}

module.exports = function renderIiif(outputDir) {
  const site = require(path.join(ROOT, "_data", "site.json"));
  // wax_iiif's placeholder is Jekyll's `absolute_url`, which resolves to
  // `site.url + site.baseurl + "/"` -- a full URL, not a path. IIIF identifiers
  // are meant to be dereferenceable, and the archive is destined for Penn's
  // OPenn, so an external consumer needs the host. Mirrors eleventy.config.js:
  // SITE_URL when set, otherwise _data/site.json.
  const host = (process.env.SITE_URL !== undefined ? process.env.SITE_URL : site.url)
    .replace(/\/+$/, "");
  const baseurl = host + site.baseurl;
  const output = path.join(outputDir, "img");

  let rendered = 0;
  let skipped = 0;

  for (const file of walk(SOURCE)) {
    const raw = fs.readFileSync(file, "utf8");
    if (!FRONT_MATTER.test(raw)) {
      skipped++;
      continue;
    }

    const body = raw.replace(FRONT_MATTER, "").replace(BASE_URL_TAG, `${baseurl}/`);

    // Fail loudly rather than shipping a file the IIIF viewer cannot parse.
    try {
      JSON.parse(body);
    } catch (error) {
      throw new Error(
        `${path.relative(ROOT, file)} is not valid JSON after rendering: ${error.message}`
      );
    }

    const target = path.join(output, path.relative(SOURCE, file));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body);
    rendered++;
  }

  return { rendered, skipped };
};
