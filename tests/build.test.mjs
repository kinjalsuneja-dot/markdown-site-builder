
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

test("build generates pages and tag index correctly", async () => {
  execFileSync(
    process.execPath,
    ["src/generator/build.mjs"],
    { cwd: projectRoot, stdio: "pipe" }
  );

  const indexHtml = await readFile(
    path.join(projectRoot, "dist", "index.html"),
    "utf8"
  );

  const aboutHtml = await readFile(
    path.join(projectRoot, "dist", "about.html"),
    "utf8"
  );

  const tagsHtml = await readFile(
    path.join(projectRoot, "dist", "tags.html"),
    "utf8"
  );

  // Check generated page titles
  assert.match(indexHtml, /<title>My First Blog Post<\/title>/);
  assert.match(aboutHtml, /<title>About This Site<\/title>/);

  // Check Markdown conversion
  assert.match(indexHtml, /<h1>Welcome to My Blog<\/h1>/);
  assert.match(indexHtml, /<strong>bold text<\/strong>/);
  assert.match(indexHtml, /<em>italic text<\/em>/);
  assert.match(indexHtml, /<pre><code>/);

  // Check tag index and page links
  assert.match(tagsHtml, /<h2>learning<\/h2>/);
  assert.match(tagsHtml, /<h2>web-development<\/h2>/);
  assert.match(tagsHtml, /<h2>about<\/h2>/);
  assert.match(tagsHtml, /<h2>project<\/h2>/);
  assert.match(tagsHtml, /href="index\.html"/);
  assert.match(tagsHtml, /href="about\.html"/);
});
