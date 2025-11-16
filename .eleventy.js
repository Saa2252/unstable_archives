module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({"assets": "assets"});
  eleventyConfig.addPassthroughCopy({"img": "img"});
  eleventyConfig.addPassthroughCopy({"search": "search"});

  // Make Jekyll-style `absolute_url` work in Eleventy.
  // For now, we just return the URL unchanged.
  eleventyConfig.addFilter("absolute_url", function(url) {
    return url;
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dataTemplateEngine: "liquid"
  };
};
