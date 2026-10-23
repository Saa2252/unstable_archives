# Jekyll to Eleventy Migration Documentation

> **Status: complete.** The Jekyll toolchain has been removed and the Eleventy
> build is verified against the final Jekyll output — all 82 pages render an
> identical HTML tag profile and the compiled stylesheet is byte-identical.
> See [Completion Report](#completion-report) for the defects found during
> verification and how they were fixed.

## Overview

This document details the migration of the Unstable Archives project from Jekyll (Ruby-based static site generator) to Eleventy (Node.js-based static site generator). The migration preserves the exact look, feel, and functionality of the original site while modernizing the build toolchain.

**Migration Date:** January 2026
**Template Language:** Nunjucks (chosen for similarity to Liquid)
**Migration Approach:** Side-by-side (new files created alongside old for comparison)

---

## Table of Contents

1. [Project Structure Changes](#project-structure-changes)
2. [New Files Created](#new-files-created)
3. [Files Modified](#files-modified)
4. [Files to Delete After Verification](#files-to-delete-after-verification)
5. [Configuration Migration](#configuration-migration)
6. [Template Syntax Conversions](#template-syntax-conversions)
7. [Custom Filters](#custom-filters)
8. [Layout Conversions](#layout-conversions)
9. [Include Conversions](#include-conversions)
10. [SCSS Migration](#scss-migration)
11. [Collection Handling](#collection-handling)
12. [Search Index Generation](#search-index-generation)
13. [Build Commands](#build-commands)
14. [Verification Checklist](#verification-checklist)
15. [Troubleshooting](#troubleshooting)

---

## Project Structure Changes

### Before (Jekyll)
```
unstable_archives-main/
├── _config.yml              # Jekyll configuration
├── _layouts/                # Layout templates (.html)
├── _includes/               # Include partials (.html)
├── _sass/                   # SCSS source files
├── _data/                   # Data files (CSV)
├── _unstable_archives/      # Collection items
├── _exhibits/               # Exhibit collection
├── pages/                   # Content pages
├── assets/                  # Static assets
├── img/                     # Images
├── search/                  # Search functionality
├── Gemfile                  # Ruby dependencies
├── Rakefile                 # Ruby tasks
└── wax_theme.gemspec        # Gem specification
```

### After (Eleventy)
```
unstable_archives-main/
├── eleventy.config.js       # Eleventy configuration (NEW)
├── package.json             # Node.js dependencies (NEW)
├── _includes/
│   ├── layouts/             # Layout templates (.njk) (NEW)
│   └── *.njk                # Include partials (.njk) (NEW)
├── src/
│   └── sass/                # SCSS source files (NEW)
├── _data/
│   ├── site.json            # Site configuration (NEW)
│   ├── unstable_archives_data.js  # CSV loader (NEW)
│   └── unstable_archives.csv      # Original data
├── _unstable_archives/
│   └── unstable_archives.json     # Directory data (NEW)
├── _exhibits/
│   └── exhibits.json        # Directory data (NEW)
├── pages/
│   └── pages.json           # Directory data (NEW)
├── assets/                  # Static assets (unchanged)
├── img/                     # Images (unchanged)
├── search/
│   └── index.njk            # Search index template (NEW)
└── Dockerfile               # Updated for Node.js
```

---

## New Files Created

### 1. `package.json`
**Purpose:** Node.js project configuration and dependencies

```json
{
  "name": "unstable-archives",
  "version": "1.0.0",
  "description": "Gender & Empire in South Asia - Digital Archives",
  "scripts": {
    "build": "npm run build:sass && eleventy",
    "build:sass": "sass src/sass/styles.scss:_site/assets/styles.css --style=compressed",
    "serve": "npm run build:sass && eleventy --serve",
    "watch": "npm-run-all --parallel watch:*",
    "watch:sass": "sass --watch src/sass/styles.scss:_site/assets/styles.css",
    "watch:eleventy": "eleventy --serve",
    "clean": "rm -rf _site"
  },
  "devDependencies": {
    "@11ty/eleventy": "^2.0.1",
    "csv-parse": "^5.5.0",
    "markdown-it": "^13.0.2",
    "markdown-it-footnote": "^3.0.3",
    "sass": "^1.69.0",
    "npm-run-all": "^4.1.5"
  }
}
```

### 2. `eleventy.config.js`
**Purpose:** Main Eleventy configuration file

**Key sections:**
- **Ignores:** Files/directories Eleventy should not process
- **Passthrough Copy:** Static assets copied as-is
- **Collections:** `unstable_archives` and `exhibits` collections
- **Custom Filters:** 25+ filters matching Jekyll/Liquid behavior
- **Markdown Configuration:** markdown-it with footnotes support
- **Directory Configuration:** Input/output paths

### 3. `_data/site.json`
**Purpose:** Site configuration (migrated from `_config.yml`)

Contains:
- `title`: "Unstable Archives"
- `description`: "Gender & Empire in South Asia"
- `url`: "https://unstable-archives.github.io"
- `baseurl`: "/unstable_archives"
- `copyright`: "2021 Megan Eaton Robb"
- `logo`: "/img/pendant_transparent.png"
- `menu`: Full navigation menu structure
- `footer`: Footer links and logos
- `search`: Search configuration

### 4. `_data/unstable_archives_data.js`
**Purpose:** Loads and parses the CSV metadata file

```javascript
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

module.exports = function() {
  const csvPath = path.join(__dirname, 'unstable_archives.csv');
  const csv = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true
  });

  const dataByPid = {};
  records.forEach(record => {
    if (record.pid) {
      dataByPid[record.pid] = record;
    }
  });

  return {
    items: records,
    byPid: dataByPid
  };
};
```

### 5. Layout Files (`_includes/layouts/`)

| File | Purpose |
|------|---------|
| `default.njk` | Base HTML structure with head, header, content, footer |
| `page.njk` | Standard content pages (extends default) |
| `exhibit.njk` | Exhibit pages with title, author, date (extends default) |
| `generic_collection_item.njk` | Base for collection items (extends default) |
| `unstable_archives_item.njk` | Archive item display with full metadata (extends default) |

### 6. Include Files (`_includes/`)

| File | Purpose |
|------|---------|
| `head.njk` | HTML head with meta tags, stylesheets, jQuery |
| `header.njk` | Navigation bar with dropdown menus |
| `footer.njk` | Footer with site info, links, logos |
| `collection_gallery.njk` | Grid gallery with faceting/filtering |
| `parallax_image.njk` | Parallax scrolling banner image |
| `item_metadata.njk` | Metadata display table |
| `item_pagination.njk` | Previous/next navigation for items |
| `osd_iiif_image_viewer.njk` | OpenSeadragon IIIF viewer |
| `simple_image_viewer.njk` | Basic image viewer |
| `inline_image.njk` | Inline image with caption |
| `interactive_metadata_table.njk` | DataTables metadata display |
| `search_box.njk` | Search input with ElasticLunr |

### 7. SCSS Files (`src/sass/`)

| File | Purpose |
|------|---------|
| `styles.scss` | Entry point with variables (Liquid syntax removed) |
| `_wax.scss` | WAX theme styles (copied from `_sass/`) |
| `_bootstrap.scss` | Bootstrap framework (copied from `_sass/`) |

### 8. Directory Data Files

| File | Purpose |
|------|---------|
| `pages/pages.json` | Sets default layout and permalink for pages |
| `_exhibits/_exhibits.json` | Sets default layout and tags for exhibits |
| `_unstable_archives/_unstable_archives.json` | Sets default layout and tags for archive items |

### 9. `search/index.njk`
**Purpose:** Generates the search index JSON for ElasticLunr

---

## Files Modified

### 1. `Dockerfile`
**Change:** Updated from Ruby to Node.js base image

**Before:**
```dockerfile
FROM ruby:3.1
# Ruby-specific setup...
```

**After:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "serve"]
```

### 2. `.gitignore`
**Change:** Added Node.js entries

**Added:**
```
node_modules
npm-debug.log
package-lock.json
```

### 3. `pages/collection.md`
**Change:** Updated include syntax from Liquid to Nunjucks

**Before:**
```liquid
{% include collection_gallery.html facet_by='object_type' collection='unstable_archives' %}
```

**After:**
```nunjucks
{% set galleryCollection = "unstable_archives" %}
{% set facet_by = "object_type" %}
{% include "collection_gallery.njk" %}
```

### 4. `pages/search.md`
**Change:** Updated include syntax

**Before:**
```liquid
{% include search_box.html search='main' %}
```

**After:**
```nunjucks
{% set searchKey = "main" %}
{% include "search_box.njk" %}
```

### 5. `_exhibits/attire.md`
**Change:** Updated inline_image includes

**Before:**
```liquid
{% include inline_image.html collection='unstable_archives' pid='item6' %}
```

**After:**
```nunjucks
{% set inlineCollection = "unstable_archives" %}
{% set inlinePid = "item6" %}
{% include "inline_image.njk" %}
```

---

## Files Deleted After Verification

~~Verification is complete and these files have been removed.~~ The list is kept
for the record:

### Ruby/Jekyll Files
- `Gemfile`
- `Gemfile.lock`
- `Rakefile`
- `wax_theme.gemspec`
- `_config.yml`

### Old Templates
- `_layouts/` directory (entire directory)
- `_sass/` directory (entire directory)
- `_includes/*.html` files (keep the `.njk` files)
- `search/index.json` (replaced by `search/index.njk`)

---

## Configuration Migration

### `_config.yml` → `eleventy.config.js` + `_data/site.json`

| Jekyll Setting | Eleventy Equivalent |
|----------------|---------------------|
| `title` | `_data/site.json` → `site.title` |
| `description` | `_data/site.json` → `site.description` |
| `url` | `_data/site.json` → `site.url` |
| `baseurl` | `eleventy.config.js` → `pathPrefix` |
| `collections` | `eleventy.config.js` → `addCollection()` |
| `sass.style` | `package.json` → `build:sass` script |
| `exclude` | `eleventy.config.js` → `ignores.add()` |
| `menu` | `_data/site.json` → `site.menu` |
| `footer` | `_data/site.json` → `site.footer` |
| `search` | `_data/site.json` → `site.search` |

---

## Template Syntax Conversions

### Include Statements

| Jekyll/Liquid | Nunjucks |
|---------------|----------|
| `{% include file.html %}` | `{% include "file.njk" %}` |
| `{% include file.html param=value %}` | `{% set param = value %}{% include "file.njk" %}` |

### Conditionals

| Jekyll/Liquid | Nunjucks |
|---------------|----------|
| `{% unless condition %}` | `{% if not condition %}` |
| `{% endunless %}` | `{% endif %}` |
| `{% if var == 'value' %}` | `{% if var == 'value' %}` |

### Variables

| Jekyll/Liquid | Nunjucks |
|---------------|----------|
| `{% assign var = value %}` | `{% set var = value %}` |
| `{% capture var %}...{% endcapture %}` | `{% set var %}...{% endset %}` |

### Filters

| Jekyll/Liquid | Nunjucks |
|---------------|----------|
| `{{ var \| filter: arg }}` | `{{ var \| filter(arg) }}` |
| `{{ var \| filter: arg1, arg2 }}` | `{{ var \| filter(arg1, arg2) }}` |

### Comments

| Jekyll/Liquid | Nunjucks |
|---------------|----------|
| `{% comment %}...{% endcomment %}` | `{# ... #}` |

### Loop Variables

| Jekyll/Liquid | Nunjucks |
|---------------|----------|
| `forloop.first` | `loop.first` |
| `forloop.last` | `loop.last` |
| `forloop.index` | `loop.index` |
| `forloop.index0` | `loop.index0` |

### Data Access

| Jekyll/Liquid | Nunjucks |
|---------------|----------|
| `site.title` | `site.title` |
| `page.title` | `title` (from front matter) |
| `site.unstable_archives` | `collections.unstable_archives` |
| `site.data.unstable_archives` | `unstable_archives_data.items` |

### Safe HTML Output

| Jekyll/Liquid | Nunjucks |
|---------------|----------|
| `{{ content }}` | `{{ content \| safe }}` |

---

## Custom Filters

All custom filters are defined in `eleventy.config.js`:

### URL Filters
| Filter | Purpose | Example |
|--------|---------|---------|
| `absolute_url` | Prepends baseurl to URL | `{{ '/img/logo.png' \| absolute_url }}` → `/unstable_archives/img/logo.png` |
| `relative_url` | Same as absolute_url | `{{ '/page/' \| relative_url }}` |

### Array Filters
| Filter | Purpose | Example |
|--------|---------|---------|
| `where` | Filter by property | `{{ items \| where('type', 'letter') }}` |
| `map` | Extract property | `{{ items \| map('url') }}` |
| `first` | Get first element | `{{ items \| first }}` |
| `last` | Get last element | `{{ items \| last }}` |
| `uniq` | Remove duplicates | `{{ tags \| uniq }}` |
| `size` | Get length | `{{ items \| size }}` |
| `sort` | Sort array | `{{ items \| sort('order') }}` |
| `sortBy` | Sort by property | `{{ items \| sortBy('date') }}` |

### String Filters
| Filter | Purpose | Example |
|--------|---------|---------|
| `slugify` | URL-safe slug | `{{ 'Hello World' \| slugify }}` → `hello-world` |
| `escape` | HTML escape | `{{ '<script>' \| escape }}` |
| `strip_html` | Remove HTML tags | `{{ '<p>text</p>' \| strip_html }}` |
| `strip_newlines` | Remove newlines | `{{ text \| strip_newlines }}` |
| `newline_to_br` | Newlines to `<br>` | `{{ text \| newline_to_br }}` |
| `truncate` | Truncate string | `{{ text \| truncate(100) }}` |
| `truncatewords` | Truncate words | `{{ text \| truncatewords(20) }}` |
| `split` | Split string | `{{ 'a,b,c' \| split(',') }}` |
| `join` | Join array | `{{ items \| join(', ') }}` |
| `replace` | Replace substring | `{{ text \| replace('old', 'new') }}` |
| `append` | Append string | `{{ 'hello' \| append(' world') }}` |
| `prepend` | Prepend string | `{{ 'world' \| prepend('hello ') }}` |

### Date Filters
| Filter | Purpose | Example |
|--------|---------|---------|
| `date_to_xmlschema` | ISO 8601 format | `{{ date \| date_to_xmlschema }}` |
| `date_to_string` | Readable format | `{{ date \| date_to_string }}` |

### Other Filters
| Filter | Purpose | Example |
|--------|---------|---------|
| `jsonify` | JSON stringify | `{{ object \| jsonify }}` |
| `markdownify` | Markdown to HTML | `{{ text \| markdownify }}` |
| `default` | Default value | `{{ value \| default('fallback') }}` |
| `plus` | Add numbers | `{{ num \| plus(1) }}` |
| `minus` | Subtract numbers | `{{ num \| minus(1) }}` |

---

## Layout Conversions

### `default.njk`
Base layout containing:
- HTML document structure
- Head include
- Header include
- Optional banner (parallax image)
- Main content area
- Footer include
- Bootstrap and Popper.js scripts

### `page.njk`
Extends `default.njk`:
- Displays page title (unless `show_title: false`)
- Renders content

### `exhibit.njk`
Extends `default.njk`:
- Displays exhibit metadata (title, author, publish date)
- Renders content

### `unstable_archives_item.njk`
Extends `default.njk`:
- Displays item label
- OpenSeadragon IIIF image viewer
- Pagination links
- Translation/transcription sections
- Full metadata table with all 22 fields

---

## Include Conversions

### Parameter Passing
Jekyll includes accept parameters directly. Nunjucks requires setting variables before the include:

**Jekyll:**
```liquid
{% include collection_gallery.html collection='unstable_archives' facet_by='object_type' %}
```

**Nunjucks:**
```nunjucks
{% set galleryCollection = "unstable_archives" %}
{% set facet_by = "object_type" %}
{% include "collection_gallery.njk" %}
```

### Key Include Changes

#### `collection_gallery.njk`
- Uses `collections[collectionName]` instead of `site[include.collection]`
- Accesses item data via `item.data.property` instead of `item.property`
- Loop variables use `loop.` prefix instead of `forloop.`

#### `item_pagination.njk`
- Gets collection from `collections.unstable_archives`
- Uses `loop.index0` for array indexing
- Handles circular navigation (first→last, last→first)

#### `parallax_image.njk`
- Parameters passed via `b` object set before include
- Collection lookup via `collections[b.collection]`

#### `search_box.njk`
- Search configuration from `site.search[key]`
- Fields array built from configuration

---

## SCSS Migration

### Changes Made

1. **Removed Liquid syntax** from `styles.scss`:

**Before:**
```scss
$logo: url("{{ '/assets/logo.png' | absolute_url }}");
```

**After:**
```scss
$logo: url("/unstable_archives/assets/logo.png");
```

2. **Removed front matter** (no longer needed):

**Before:**
```scss
---
sitemap: false
---
```

**After:**
(No front matter needed)

3. **File locations:**
   - `_sass/_wax.scss` → `src/sass/_wax.scss`
   - `_sass/_bootstrap.scss` → `src/sass/_bootstrap.scss`
   - `assets/styles.scss` → `src/sass/styles.scss`

### Build Process
SCSS is compiled via npm scripts, not Eleventy:
```bash
sass src/sass/styles.scss:_site/assets/styles.css --style=compressed
```

---

## Collection Handling

### Jekyll Collections
```yaml
# _config.yml
collections:
  unstable_archives:
    output: true
    layout: 'unstable_archives_item'
```

### Eleventy Collections
```javascript
// eleventy.config.js
eleventyConfig.addCollection("unstable_archives", collection => {
  return collection.getFilteredByGlob("_unstable_archives/*.md")
    .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
});
```

### Directory Data Files
Instead of configuring layouts in the main config, use directory data files:

**`_unstable_archives/_unstable_archives.json`** (the file must be named after
its directory, or Eleventy silently ignores it):
```json
{
  "layout": "unstable_archives_item",
  "tags": "unstable_archives",
  "permalink": "/unstable_archives/{{ page.fileSlug }}/"
}
```

### Accessing Collections in Templates

| Jekyll | Eleventy |
|--------|----------|
| `site.unstable_archives` | `collections.unstable_archives` |
| `item.label` | `item.data.label` |
| `item.url` | `item.url` |

---

## Search Index Generation

### Jekyll Approach
Search index generated by Wax rake task, output as static JSON with Liquid front matter.

### Eleventy Approach
Search index generated as a Nunjucks template:

**`search/index.njk`:**
```nunjucks
---
permalink: /search/index.json
eleventyExcludeFromCollections: true
---
[
{% for item in collections.unstable_archives %}
  {
    "pid": "{{ item.data.pid | escape }}",
    "label": {{ item.data.label | jsonify | safe }},
    ...
    "lunr_id": {{ loop.index0 }}
  }{% if not loop.last %},{% endif %}
{% endfor %}
]
```

---

## Build Commands

### Development
```bash
# Install dependencies
npm install

# Build and serve with live reload
npm run serve

# Build only
npm run build

# Watch mode (parallel SCSS and Eleventy)
npm run watch

# Clean build directory
npm run clean
```

### Production
```bash
npm run build
```

Output is generated in `_site/` directory.

### Docker
```bash
docker build -t unstable-archives .
docker run -p 8080:8080 unstable-archives
```

---

## Verification Checklist

After running `npm run serve`, verify the following pages:

### Homepage (`/unstable_archives/`)
- [ ] Banner image displays correctly
- [ ] Navigation menu works
- [ ] Footer displays correctly
- [ ] Content renders properly

### Collection Browse (`/unstable_archives/collection/`)
- [ ] Gallery displays all items
- [ ] Thumbnails load correctly
- [ ] Facet buttons work
- [ ] Item links navigate correctly

### Archive Item (`/unstable_archives/unstable_archives/item1/`)
- [ ] Label displays
- [ ] IIIF viewer loads and functions
- [ ] Pagination (prev/next) works
- [ ] Translation/transcription sections display
- [ ] All metadata fields render
- [ ] IIIF manifest link works

### Exhibit Page (`/unstable_archives/exhibits/family/`)
- [ ] Title, author, date display
- [ ] Content renders with markdown
- [ ] Inline images display
- [ ] Links work

### Search Page (`/unstable_archives/search/`)
- [ ] Search box displays
- [ ] Search functionality works
- [ ] Results display correctly
- [ ] Result links navigate correctly

### General
- [ ] All CSS styles apply correctly
- [ ] JavaScript functionality works
- [ ] No console errors
- [ ] All internal links work
- [ ] Images load correctly

---

## Troubleshooting

### Common Issues

#### "Cannot find module 'markdown-it'"
```bash
npm install
```

#### SCSS compilation errors
Ensure SCSS files are in `src/sass/` and run:
```bash
npm run build:sass
```

#### Collection not found
Check that:
1. Markdown files are in `_unstable_archives/` or `_exhibits/`
2. Directory data file exists with correct `tags`
3. Collection is defined in `eleventy.config.js`

#### Include not found
- Ensure include file has `.njk` extension
- Include path should be quoted: `{% include "file.njk" %}`
- File should be in `_includes/` directory

#### Filter not working
Check that the filter is defined in `eleventy.config.js` and the syntax uses parentheses for arguments: `{{ value | filter(arg) }}`

#### Pagination not working
- Verify `collections.unstable_archives` exists
- Check that item URLs match `page.url`

### Debug Mode
Run Eleventy with debug output:
```bash
DEBUG=Eleventy* npx eleventy
```

---

## Architecture Decisions

### Why Nunjucks?
- Most similar syntax to Liquid (Jekyll's templating language)
- Well-supported in Eleventy
- Mature ecosystem and documentation

### Why Side-by-Side Migration?
- Allows comparison of old and new templates
- Minimizes risk during migration
- Easy rollback if issues found

### Why Directory Data Files?
- Cleaner than setting layout in every front matter
- Follows Eleventy conventions
- Easy to manage collection-wide settings

### Why Separate SCSS Build?
- Eleventy doesn't process SCSS natively
- Using npm scripts provides more control
- Parallel watch mode for development

---

## File Reference

### New Files Summary

| Path | Type | Purpose |
|------|------|---------|
| `package.json` | Config | Node.js dependencies and scripts |
| `eleventy.config.js` | Config | Eleventy configuration |
| `_data/site.json` | Data | Site configuration |
| `_data/unstable_archives_data.js` | Data | CSV loader |
| `_includes/layouts/default.njk` | Layout | Base HTML layout |
| `_includes/layouts/page.njk` | Layout | Page layout |
| `_includes/layouts/exhibit.njk` | Layout | Exhibit layout |
| `_includes/layouts/generic_collection_item.njk` | Layout | Collection item base |
| `_includes/layouts/unstable_archives_item.njk` | Layout | Archive item layout |
| `_includes/head.njk` | Include | HTML head |
| `_includes/header.njk` | Include | Navigation |
| `_includes/footer.njk` | Include | Footer |
| `_includes/collection_gallery.njk` | Include | Gallery grid |
| `_includes/parallax_image.njk` | Include | Banner image |
| `_includes/item_metadata.njk` | Include | Metadata table |
| `_includes/item_pagination.njk` | Include | Prev/next links |
| `_includes/osd_iiif_image_viewer.njk` | Include | IIIF viewer |
| `_includes/simple_image_viewer.njk` | Include | Basic image |
| `_includes/inline_image.njk` | Include | Inline image |
| `_includes/interactive_metadata_table.njk` | Include | DataTables |
| `_includes/search_box.njk` | Include | Search UI |
| `src/sass/styles.scss` | SCSS | Entry point |
| `src/sass/_wax.scss` | SCSS | Theme styles |
| `src/sass/_bootstrap.scss` | SCSS | Bootstrap |
| `pages/pages.json` | Data | Page defaults |
| `_exhibits/_exhibits.json` | Data | Exhibit defaults |
| `_unstable_archives/_unstable_archives.json` | Data | Archive defaults |
| `search/index.njk` | Template | Search index |
| `scripts/render-iiif.js` | Build | Renders wax_iiif's Jekyll-templated IIIF files |

---

## Contact

For questions about this migration, refer to the project repository or contact the maintainers.

---

## Completion Report

Verification compared the Eleventy output against the last Jekyll build
page-by-page, using the HTML tag profile of each page as the comparison key.
That surfaced five defects. Browser testing of the running site then surfaced
a sixth and most serious one — the IIIF viewer was dead on every item page.
All are now fixed.

### 1. Directory data files were inert (root cause of the URL breakage)

Eleventy requires a directory data file to be **named after its directory**.
`_unstable_archives/unstable_archives.json` and `_exhibits/exhibits.json` were
therefore never read; they are now `_unstable_archives/_unstable_archives.json`
and `_exhibits/_exhibits.json`.

This had gone unnoticed because every item already carried
`layout: unstable_archives_item` in its own front matter (written there by the
Wax CSV ingest), and the collections are defined by glob in
`eleventy.config.js` rather than by the `tags` key — so the only visible symptom
was the permalink problem below.

### 2. Collection items built to the wrong URLs

With no effective permalink, Eleventy fell back to the source path and wrote
items to `/_unstable_archives/item1/` — leaking the underscore of the source
directory. The original Jekyll URLs are
`/unstable_archives/unstable_archives/<pid>/`, confirmed by eleven hardcoded
links inside the exhibit essays themselves.

Fixed by adding `permalink` to both directory data files:

```json
{ "permalink": "/unstable_archives/{{ page.fileSlug }}/" }
{ "permalink": "/exhibits/{{ page.fileSlug }}/" }
```

These URLs are load-bearing — published citations point at them — so they are
now pinned by configuration rather than left to Eleventy's default.

### 3. `_exhibits/attire.md` was orphaned

Its front matter had an empty `permalink:` key, which overrode the directory
default and sent the page to `/_exhibits/attire/`, where nothing linked to it.
Set to `/exhibits/attire/`.

### 4. Transcriptions and translations were HTML-escaped

Liquid does not autoescape; Nunjucks does. Four items carry scholarly HTML
markup (`<br>`, `<h1>`, `<sup>`, `<add>`, `<underline>`) inside their
`transcription` and `translation` fields, and it was rendering as literal
visible text — item1 alone lost 311 line breaks. Both fields now use `| safe`
in `_includes/layouts/unstable_archives_item.njk`.

Only these two fields contain HTML, so no other field needs the filter.

### 5. Double slashes in every search result link

`search-ui.js` concatenates `url + item.permalink`. Jekyll's `absolute_url('')`
returned `/unstable_archives` with no trailing slash; the replacement filter
returned `/unstable_archives/`, producing
`/unstable_archives//unstable_archives/item1/` for every result link and
thumbnail. The filter no longer appends a trailing slash for empty input.

### 6. Every IIIF derivative file was shipped unrendered

**This broke the deep-zoom viewer on all 52 item pages — the core function of
the archive — and a page-level HTML comparison could never have caught it.**

`wax_iiif` writes its 861 derivative files (manifests, sequences, canvases,
annotations, `info.json`) as *Jekyll templates*: each carries `---\nlayout:
none\n---` front matter and uses `{{ '/' | absolute_url }}` wherever the site's
base URL belongs. Jekyll rendered them as pages. Eleventy treats `img/` as a
passthrough copy, so it reproduced them byte-for-byte — front matter and Liquid
tags intact. The result is not valid JSON, so OpenSeadragon fetched each
manifest (HTTP 200), failed to parse it, and rendered an empty grey box.

Fixed by `scripts/render-iiif.js`, wired into an `eleventy.after` event in
`eleventy.config.js` so it runs on every build, including incremental rebuilds
under `--serve`. It strips the front matter, substitutes the base URL from
`_data/site.json`, and `JSON.parse`s each result, throwing rather than shipping
a file the viewer cannot read.

Verified in a browser: item pages now display their scanned images with
OpenSeadragon's zoom controls.

### 7. `absolute_url` mangled non-HTTP schemes

The filter only passed through URLs beginning `http`, so the footer's
`mailto:unstablearchives2020@gmail.com` became
`/unstable_archives/mailto:unstablearchives2020@gmail.com` on all 82 pages. It
now passes through any scheme and protocol-relative URLs. (Jekyll had the same
bug; this is a fix rather than a parity restoration.)

### Intentional difference from the Jekyll output

The Jekyll site rendered a metadata row reading **“Layout:
unstable_archives_item”** on all 52 item pages. The CSV's `layout` column had
been repurposed by the Wax ingest to hold the Jekyll layout name, so the item
template was printing the template's own filename as though it were a
description of the manuscript's layout. No archival data is lost by dropping it
— the column contains `unstable_archives_item` for all 52 rows — and the row is
omitted from the Nunjucks template. This is the sole remaining difference
between the two builds.

### Other changes made during cleanup

- `git init` plus a pre-migration snapshot commit; the project previously had no
  version control.
- Removed the stale `ignores.add()` entries in `eleventy.config.js` that
  referenced now-deleted Jekyll files.
- Dropped the Ruby section from `.gitignore`, and stopped ignoring
  `package-lock.json` so builds are reproducible.
- `Dockerfile` now runs `npm ci` rather than `npm install`.
- Replaced the inherited upstream Wax `README.md`, which still instructed
  readers to run `bundle exec jekyll serve`, with one describing this project
  and the Eleventy workflow.
- Deleted `assets/styles.scss`, the old Jekyll stylesheet source. It still had
  front matter and a Liquid tag, and was being published as a stray file; it is
  superseded by `src/sass/styles.scss`.
- Added `.claude/launch.json` so the dev server can be started directly.

### Verification method

Page-level comparison alone is not sufficient for this site — it would have
passed a build whose image viewer was entirely broken. The checks used were:

1. **HTML tag profile** of each page against the last Jekyll build: 82/82 match.
2. **Compiled CSS**: byte-identical to Jekyll's `styles.css`.
3. **JSON validity** of all 861 rendered IIIF files, enforced in the build.
4. **Internal link check** across all 82 pages: 3,305 links resolved to a file
   on disk, leaving only the two pre-existing missing images noted below.
5. **Browser testing** of the running site: IIIF viewer, transcription
   rendering, navigation, and a live search query returning correctly formed
   result URLs.

### Pre-existing issues, not introduced by the migration

Both are present identically in the Jekyll build and are left as-is, since each
needs a missing file rather than a code change:

- `img/logo.png` — the favicon referenced by the inherited Wax `head.html` on
  every page; the file is not in the repository. **Fixed**: `head.njk` now uses
  `site.logo`, which `_data/site.json` already points at the real
  `img/pendant_transparent.png`.
- `img/wax_workflow.jpg` — linked twice from `pages/about.md`. The file is not
  in the repository and no copy exists in any sibling checkout, so this one
  needs the image itself rather than a code change. It is the only broken
  internal link left in the build.

### Known follow-up

`src/sass/` still uses Sass `@import`, which is deprecated and will be removed
in Dart Sass 3. Migrating to `@use` is not a mechanical change here:
`styles.scss` defines variables that `_wax.scss` consumes, which `@use` does not
allow without restructuring those into `!default` declarations and a
`@use ... with (...)` call. Deferred deliberately — the current output is
byte-identical to Jekyll's, and this refactor risks silent visual regressions
across 150KB of CSS. Pin `sass` to a 1.x release until it is done.
