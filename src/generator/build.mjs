import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import matter from "@11ty/gray-matter";
import sanitizeHtml from "sanitize-html";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const contentDir = path.join(projectRoot, "content");
const templatePath = path.join(
  projectRoot,
  "templates",
  "default.html"
);
const outputDir = path.join(projectRoot, "dist");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function getMarkdownFiles(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true
  });

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await getMarkdownFiles(fullPath));
    } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function buildSite() {
  const template = await readFile(templatePath, "utf8");
  const markdownFiles = await getMarkdownFiles(contentDir);

  if (markdownFiles.length === 0) {
    throw new Error("No Markdown files found in content/.");
  }

  await mkdir(outputDir, { recursive: true });

  const posts = [];

  for (const filePath of markdownFiles) {
    const source = await readFile(filePath, "utf8");
    const { data, content } = matter(source);

    const title =
      data.title ||
      path.basename(filePath, path.extname(filePath));

    let date = data.date ?? "";

    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      date = date.toISOString().slice(0, 10);
    }

    const rawTags = data.tags ?? [];
    const tags = Array.isArray(rawTags)
      ? rawTags
      : String(rawTags).split(",");

    const tagsHtml = tags
      .map(tag => String(tag).trim())
      .filter(Boolean)
      .map(tag => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join(" ");

    const markdownHtml = await marked.parse(content);
    const safeContent = sanitizeHtml(markdownHtml);

    let page = template;

    const replacements = {
      "{{title}}": escapeHtml(title),
      "{{date}}": escapeHtml(date),
      "{{tags}}": tagsHtml,
      "{{content}}": safeContent
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      page = page.split(placeholder).join(value);
    }

    const relativePath = path.relative(contentDir, filePath);
    const postUrl = relativePath.replace (/\/md$/i, ".html")

    posts.push({
      title: String(title),
      url: postUrl,
      tags: tags.map(tag => String(tag).trim()).filter(Boolean)
    });

    const outputPath = path.join(
      outputDir,
      relativePath.replace(/\.md$/i, ".html")
    );

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, page, "utf8");

    console.log(
      `Generated: ${path.relative(projectRoot, outputPath)}`
    );
  }

  const tagsMap = new Map();

  for (const post of posts) {
    for (const tag of post.tags) {
      const normalizedTag = tag.toLowerCase();

      if (!tagsMap.has(normalizedTag)) {
        tagsMap.set(normalizedTag, {
          name: tag,
          posts: []
        });
      }
      tagsMap.get(normalizedTag).posts.push(post);
    }
  }

  const tagSections = [...tagsMap.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(group => {
      const links = group.posts
        .map(post =>
          `<li><a href="${escapeHtml(post.url)}">${escapeHtml(post.title)}</a></li>`
        )
        .join("\n");

        return `<section>
          <h2>${escapeHtml(group.name)}</h2>
          <ul>${links}</ul>
        </section>`;
    })
    .join("\n");

    const tagsPage = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Tags</title>
    </head>
    <body>
      <h1>Browse by Tag</h1>
      ${tagSections || "<p>No tags found.</p>"}
    </body>
    </html>`;

    await writeFile(path.join(outputDir, "tags.html"), tagsPage, "utf8");

    console.log("Generated: dist/tags.html");

  console.log(`\nBuild successful! Generated ${markdownFiles.length} page(s).`);
}

buildSite().catch(error => {
  console.error("Build failed:", error.message);
  process.exitCode = 1;
});