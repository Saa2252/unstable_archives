# Unstable Archives

__Gender & Empire in South Asia__ — a digital exhibition of archival material
documenting the life of Elizabeth Sharaf un-Nisa and the Ducarel family in
late-eighteenth-century India and England.

By Megan Eaton Robb. Live at
<https://unstable-archives.github.io/unstable_archives/>.

The site presents 52 archival objects — letters, legal documents, a penmanship
book, jewellery and textiles — with IIIF deep-zoom viewers, transcriptions and
translations, a faceted browse gallery, client-side search, and eight
interpretive exhibits.

## Prerequisites

Node.js 18 or newer. That's all — image derivatives and IIIF manifests are
pre-built and committed under `img/`.

## Getting started

```sh
npm install
npm run serve
```

Then open the localhost URL the terminal prints. Note that the site is built
with a path prefix, so the homepage lives at `/unstable_archives/`.

## Commands

| Command | What it does |
|---|---|
| `npm run serve` | Build and serve with live reload |
| `npm run build` | Production build into `_site/` |
| `npm run watch` | Watch Sass and templates in parallel |
| `npm run clean` | Delete `_site/` |
| `npm run check` | Validate the built site (run after `build`) |

`npm run build` compiles Sass first, then runs Eleventy. Running `eleventy`
alone will not refresh the stylesheet.

## How it is put together

Built with [Eleventy](https://www.11ty.dev/) and Nunjucks templates, migrated
from the Jekyll-based [Wax](https://github.com/minicomp/wax) theme in January
2026. See [MIGRATION_DOC.md](MIGRATION_DOC.md) for the full record.

```
eleventy.config.js    Build config, collections, and Liquid-compatible filters
_data/site.json       Site title, navigation, footer, search config
_data/*.csv           Item metadata, loaded by unstable_archives_data.js
_unstable_archives/   One Markdown file per archival object (front matter = metadata)
_exhibits/            Interpretive essays
pages/                Standalone content pages
_includes/            Nunjucks partials; layouts/ holds the page layouts
src/sass/             Stylesheet sources
img/                  Images, including pre-built IIIF tiles and manifests
search/index.njk      Generates the ElasticLunr search index
scripts/render-iiif.js  Renders the IIIF files wax_iiif emits as templates
```

### IIIF derivatives

`wax_iiif` wrote the 861 files under `img/derivatives/iiif/` as Jekyll
templates, with front matter and a Liquid placeholder for the base URL. Eleventy
copies `img/` through untouched, so `scripts/render-iiif.js` re-renders them
over the copies after every build (wired to Eleventy's `eleventy.after` event).
Without it the manifests are invalid JSON and the image viewer silently shows
nothing. If you regenerate derivatives, that step handles them automatically.

### URLs

Archival items are served at `/unstable_archives/unstable_archives/<pid>/` and
exhibits at `/unstable_archives/exhibits/<name>/`. These paths are set by the
`permalink` keys in `_unstable_archives/_unstable_archives.json` and
`_exhibits/_exhibits.json`. They are load-bearing: published citations and
in-text links across the exhibits point at them, so don't change them.

### Adding an item

Add a row to `_data/unstable_archives.csv` and a matching Markdown file in
`_unstable_archives/` whose front matter carries the metadata fields. Items are
ordered by their `order` field. Fields may contain inline HTML; `transcription`
and `translation` are rendered unescaped.

## Deployment

Pushing to `main` builds the site and publishes it to GitHub Pages via
`.github/workflows/deploy.yml`. In the repository's **Settings → Pages**, the
source must be set to **GitHub Actions** (not "Deploy from a branch" — that
setting is for Jekyll, which GitHub Pages builds natively and Eleventy is not).

### The repository name matters

The site is built with the path prefix `/unstable_archives`, and a GitHub Pages
project site is served from `/<repository-name>/`. **If the repository is named
anything else, every link and stylesheet on the deployed site breaks** — with no
build error, because nothing is wrong until a browser asks for a path that isn't
there. The deploy workflow checks this up front and fails with an explanation
rather than publishing a broken site.

To host under a different name, change the prefix in all four places:
`baseurl` in `_data/site.json`, the `absolute_url` and `relative_url` filters in
`eleventy.config.js`, and `$logo` in `src/sass/styles.scss`.

## Docker

```sh
docker build -t unstable-archives .
docker run -p 8080:8080 unstable-archives
```

## License

Code is MIT licensed (see [LICENSE.txt](LICENSE.txt)). Archival images and
transcriptions carry their own rights statements, recorded per item in the
`copyright_statement` and `terms_use` metadata fields.
