import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Prism = require("prismjs");

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addGlobalData("site", {
    url: "https://masterwok.github.io",
  });

  eleventyConfig.amendLibrary("md", (mdLib) => {
    const defaultLinkOpen = mdLib.renderer.rules.link_open ??
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    mdLib.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      token.attrSet("target", "_blank");
      token.attrSet("rel", "noopener noreferrer");
      return defaultLinkOpen(tokens, idx, options, env, self);
    };
  });

  eleventyConfig.addPassthroughCopy("src/index.css");
  eleventyConfig.addPassthroughCopy({ "public": "." });

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return new Date(dateObj).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  });

  eleventyConfig.addAsyncShortcode("githubCode", async (repo, file, commit, startLine, endLine, lang = "c") => {
    if (lang && !Prism.languages[lang]) {
      try { require(`prismjs/components/prism-${lang}`); } catch (_) {}
    }
    const url = `https://raw.githubusercontent.com/${repo}/${commit}/${file}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`githubCode: failed to fetch ${url} (${response.status})`);
    const text = await response.text();
    const slice = text.split("\n").slice(startLine - 1, endLine)
      // A truly blank line here would make Markdown treat it as the end of
      // the surrounding <figure> HTML block, breaking everything after it.
      .map((line) => (line.trim() === "" ? "​" : line))
      .join("\n");
    const grammar = Prism.languages[lang] ?? Prism.languages.plain;
    const highlighted = Prism.highlight(slice, grammar, lang);
    const sourceUrl = `https://github.com/${repo}/blob/${commit}/${file}#L${startLine}-L${endLine}`;
    const label = `${file} L${startLine}-${endLine} @ ${commit.slice(0, 7)}`;
    return `<figure class="code-embed">
<pre class="language-${lang}"><code class="language-${lang}">${highlighted}</code></pre>
<figcaption><a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${label}</a></figcaption>
</figure>`;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
  };
}
