/*
 * markdown-it plugin: close raw HTML blocks the way kramdown does.
 *
 * Jekyll used kramdown, which ends a block-level HTML element at its matching
 * closing tag and resumes parsing markdown afterwards. CommonMark (and so
 * markdown-it) instead ends an HTML block at the next BLANK line.
 *
 * This content depends on kramdown's reading in two ways that break badly
 * under CommonMark:
 *
 *   - pages/exhibits.md emits a <ul> whose <li> items are separated by the
 *     blank lines a Nunjucks {% for %} leaves behind. CommonMark ends the
 *     block at the first of those, drops the first item on the floor and wraps
 *     each remaining <li> in its own <p> -- producing invalid markup and
 *     losing an exhibit from the index.
 *
 *   - pages/scholarship.md and others interleave `<p class="hang">...</p>`
 *     lines with markdown headings and links with no blank lines between, so
 *     CommonMark swallows the markdown into the HTML block and emits it raw.
 *
 * Rather than rewrite the authors' content, this restores kramdown's rule:
 * scan from an opening block-level tag to its matching close, respecting
 * nesting, and treat that whole span as one HTML block.
 */

// Block-level elements kramdown would span to a closing tag. Void and
// inline elements are deliberately absent: `<br>` in particular must stay a
// span so it joins the surrounding paragraph.
const BLOCK_TAGS = new Set([
  "address", "article", "aside", "blockquote", "details", "dialog", "dd",
  "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "main", "nav",
  "ol", "p", "pre", "section", "table", "tbody", "td", "tfoot", "th",
  "thead", "tr", "ul",
]);

const OPEN_TAG = /^ {0,3}<([a-z][a-z0-9]*)(\s[^>]*)?>/i;

module.exports = function kramdownHtmlBlocks(md) {
  function htmlBlockToMatchingClose(state, startLine, endLine, silent) {
    if (!state.md.options.html) return false;

    const start = state.bMarks[startLine] + state.tShift[startLine];
    const lineText = state.src.slice(start, state.eMarks[startLine]);

    const open = lineText.match(OPEN_TAG);
    if (!open) return false;

    const tag = open[1].toLowerCase();
    if (!BLOCK_TAGS.has(tag)) return false;

    // A self-contained one-liner is left to the default rule, which already
    // handles it and lets markdown resume on the next line.
    const openRe = new RegExp(`<${tag}(\\s[^>]*)?>`, "gi");
    const closeRe = new RegExp(`</${tag}\\s*>`, "gi");
    let depth = (lineText.match(openRe) || []).length - (lineText.match(closeRe) || []).length;
    if (depth <= 0) return false;

    let line = startLine;
    while (depth > 0 && line + 1 < endLine) {
      line++;
      const text = state.src.slice(
        state.bMarks[line] + state.tShift[line],
        state.eMarks[line]
      );
      depth += (text.match(openRe) || []).length;
      depth -= (text.match(closeRe) || []).length;
    }

    // Unbalanced: leave it to the default rule rather than guessing.
    if (depth > 0) return false;
    if (silent) return true;

    const token = state.push("html_block", "", 0);
    token.map = [startLine, line + 1];
    token.content = state.getLines(startLine, line + 1, state.blkIndent, true);
    state.line = line + 1;
    return true;
  }

  md.block.ruler.before("html_block", "kramdown_html_block", htmlBlockToMatchingClose, {
    alt: ["paragraph", "reference", "blockquote"],
  });
};
