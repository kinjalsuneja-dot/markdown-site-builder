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

test("build generates pages and tag index", async () => {
    execFileSync(
        process.execPath,
        ["src/generator/build.mjs"],
        { cwd: projectRoot, stdio: "pipe" }
    );
});

const indexHtml = await readFile(
    path.join(projectRoot, "dist", "index.html"),
    "utf8"
);

const aboutHtml =await readFile(
    path.join(projectRoot, "dist", "about.html"),
    "utf8"
);

const tagsHtml = await readFile(
    path.join(projectRoot, "dist", "tags.html"),
    "utf8"
);

assert.match(indexHtml, /<title>My First Blog Post<\/title>/);
  assert.match(aboutHtml, /<title>About This Site<\/title>/);
  assert.match(tagsHtml, /<h2>learning<\/h2>/);
  assert.match(tagsHtml, /href="index\.html"/);
  assert.match(tagsHtml, /href="about\.html"/);
;