module.exports = function(eleventyConfig) {
  // ---------------------------------------------------------------
  // IGNORE FILES - Don't process these
  // ---------------------------------------------------------------
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("MIGRATION_DOC.md");
  eleventyConfig.ignores.add("Gemfile");
  eleventyConfig.ignores.add("Rakefile");
  eleventyConfig.ignores.add("wax_theme.gemspec");
  eleventyConfig.ignores.add("_config.yml");
  eleventyConfig.ignores.add("vendor/**");
  eleventyConfig.ignores.add("spec/**");
  eleventyConfig.ignores.add("_sass/**");
  eleventyConfig.ignores.add("_layouts/**");
  eleventyConfig.ignores.add("src/**");
  eleventyConfig.ignores.add("_data/raw_images/**");

  // ---------------------------------------------------------------
  // PASSTHROUGH COPY - Static assets copied as-is
  // ---------------------------------------------------------------
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("img");

  // ---------------------------------------------------------------
  // COLLECTIONS
  // ---------------------------------------------------------------
  eleventyConfig.addCollection("unstable_archives", collection => {
    return collection.getFilteredByGlob("_unstable_archives/*.md")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  eleventyConfig.addCollection("exhibits", collection => {
    return collection.getFilteredByGlob("_exhibits/*.md");
  });

  // ---------------------------------------------------------------
  // CUSTOM FILTERS - Match Jekyll/Liquid behavior
  // ---------------------------------------------------------------

  // absolute_url - Most critical filter for URL handling
  eleventyConfig.addFilter("absolute_url", (url) => {
    const baseurl = "/unstable_archives";
    if (!url) return baseurl + "/";
    if (url.startsWith("http")) return url;
    return baseurl + (url.startsWith("/") ? url : "/" + url);
  });

  // relative_url - Same as absolute_url for this project
  eleventyConfig.addFilter("relative_url", (url) => {
    const baseurl = "/unstable_archives";
    if (!url) return baseurl + "/";
    if (url.startsWith("http")) return url;
    return baseurl + (url.startsWith("/") ? url : "/" + url);
  });

  // where - Filter array by property value
  eleventyConfig.addFilter("where", (array, key, value) => {
    if (!array) return [];
    return array.filter(item => {
      const itemValue = item.data ? item.data[key] : item[key];
      return itemValue === value;
    });
  });

  // where_exp - Filter array by expression (simplified)
  eleventyConfig.addFilter("where_exp", (array, itemName, expression) => {
    if (!array) return [];
    // Simple implementation - handle common patterns
    return array.filter(item => {
      // Handle "item.data.key contains value" pattern
      const containsMatch = expression.match(/(\w+)\.data\.(\w+)\s+contains\s+['"]([^'"]+)['"]/);
      if (containsMatch) {
        const key = containsMatch[2];
        const value = containsMatch[3];
        const itemData = item.data || item;
        return itemData[key] && itemData[key].includes(value);
      }
      return true;
    });
  });

  // map - Extract property from array items
  eleventyConfig.addFilter("map", (array, key) => {
    if (!array) return [];
    return array.map(item => {
      const data = item.data || item;
      return data[key];
    });
  });

  // slugify - Convert string to URL-safe slug
  eleventyConfig.addFilter("slugify", (str) => {
    if (!str) return "";
    return str.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');
  });

  // jsonify - Convert object to JSON string
  eleventyConfig.addFilter("jsonify", (obj) => {
    return JSON.stringify(obj);
  });

  // date_to_xmlschema - Convert date to ISO 8601 format
  eleventyConfig.addFilter("date_to_xmlschema", (date) => {
    if (!date) return "";
    return new Date(date).toISOString();
  });

  // date_to_string - Format date for display
  eleventyConfig.addFilter("date_to_string", (date) => {
    if (!date) return "";
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  });

  // first - Get first element of array
  eleventyConfig.addFilter("first", (array) => {
    if (!array || !array.length) return null;
    return array[0];
  });

  // last - Get last element of array
  eleventyConfig.addFilter("last", (array) => {
    if (!array || !array.length) return null;
    return array[array.length - 1];
  });

  // strip_newlines - Remove newlines from string
  eleventyConfig.addFilter("strip_newlines", (str) => {
    if (!str) return "";
    return str.toString().replace(/\n/g, "");
  });

  // newline_to_br - Convert newlines to <br> tags
  eleventyConfig.addFilter("newline_to_br", (str) => {
    if (!str) return "";
    return str.toString().replace(/\n/g, "<br>");
  });

  // uniq - Remove duplicates from array
  eleventyConfig.addFilter("uniq", (array) => {
    if (!array) return [];
    return [...new Set(array)];
  });

  // size - Get length of array or string
  eleventyConfig.addFilter("size", (input) => {
    if (!input) return 0;
    return input.length;
  });

  // split - Split string into array
  eleventyConfig.addFilter("split", (str, separator) => {
    if (!str) return [];
    return str.toString().split(separator);
  });

  // join - Join array into string
  eleventyConfig.addFilter("join", (array, separator) => {
    if (!array) return "";
    return array.join(separator || ", ");
  });

  // strip_html - Remove HTML tags from string
  eleventyConfig.addFilter("strip_html", (str) => {
    if (!str) return "";
    return str.toString().replace(/<[^>]*>/g, "");
  });

  // truncate - Truncate string to specified length
  eleventyConfig.addFilter("truncate", (str, length) => {
    if (!str) return "";
    if (str.length <= length) return str;
    return str.substring(0, length) + "...";
  });

  // truncatewords - Truncate to specified number of words
  eleventyConfig.addFilter("truncatewords", (str, words) => {
    if (!str) return "";
    const arr = str.toString().split(/\s+/);
    if (arr.length <= words) return str;
    return arr.slice(0, words).join(" ") + "...";
  });

  // escape - HTML escape special characters
  eleventyConfig.addFilter("escape", (str) => {
    if (!str) return "";
    return str.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  });

  // markdownify - Convert markdown to HTML
  const markdownIt = require("markdown-it");
  const md = markdownIt({ html: true });
  eleventyConfig.addFilter("markdownify", (str) => {
    if (!str) return "";
    return md.render(str.toString());
  });

  // sortBy - Sort array by property
  eleventyConfig.addFilter("sortBy", (array, key) => {
    if (!array) return [];
    return [...array].sort((a, b) => {
      const aVal = a.data ? a.data[key] : a[key];
      const bVal = b.data ? b.data[key] : b[key];
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
  });

  // sort - Sort array (optionally by property)
  eleventyConfig.addFilter("sort", (array, key) => {
    if (!array) return [];
    if (!key) return [...array].sort();
    return [...array].sort((a, b) => {
      const aVal = a.data ? a.data[key] : a[key];
      const bVal = b.data ? b.data[key] : b[key];
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
  });

  // plus - Add to number
  eleventyConfig.addFilter("plus", (num, add) => {
    return (parseInt(num) || 0) + (parseInt(add) || 0);
  });

  // minus - Subtract from number
  eleventyConfig.addFilter("minus", (num, sub) => {
    return (parseInt(num) || 0) - (parseInt(sub) || 0);
  });

  // append - Append string
  eleventyConfig.addFilter("append", (str, suffix) => {
    return (str || "") + (suffix || "");
  });

  // prepend - Prepend string
  eleventyConfig.addFilter("prepend", (str, prefix) => {
    return (prefix || "") + (str || "");
  });

  // replace - Replace substring
  eleventyConfig.addFilter("replace", (str, search, replace) => {
    if (!str) return "";
    return str.toString().split(search).join(replace || "");
  });

  // default - Provide default value for falsy values
  eleventyConfig.addFilter("default", (value, defaultValue) => {
    return value ? value : defaultValue;
  });

  // ---------------------------------------------------------------
  // SHORTCODES
  // ---------------------------------------------------------------

  // Include image shortcode (to handle Jekyll's include with parameters)
  eleventyConfig.addShortcode("image", function(src, alt, caption) {
    const baseurl = "/unstable_archives";
    const fullSrc = src.startsWith("http") ? src : baseurl + (src.startsWith("/") ? src : "/" + src);
    let html = `<figure class="inline-image">
      <img src="${fullSrc}" alt="${alt || ''}" />`;
    if (caption) {
      html += `<figcaption>${caption}</figcaption>`;
    }
    html += `</figure>`;
    return html;
  });

  // ---------------------------------------------------------------
  // MARKDOWN CONFIGURATION
  // ---------------------------------------------------------------
  const markdownItLib = markdownIt({
    html: true,
    typographer: true
  }).use(require("markdown-it-footnote"));

  eleventyConfig.setLibrary("md", markdownItLib);

  // ---------------------------------------------------------------
  // WATCH TARGETS
  // ---------------------------------------------------------------
  eleventyConfig.addWatchTarget("src/sass/");

  // ---------------------------------------------------------------
  // ELEVENTY CONFIGURATION
  // ---------------------------------------------------------------
  return {
    dir: {
      input: ".",
      includes: "_includes",
      layouts: "_includes/layouts",
      data: "_data",
      output: "_site"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: "/unstable_archives/"
  };
};
