
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const runFile = promisify(execFile);
const ROOT = __dirname;
const PORT = 3000;

const app = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  try {
    // Serve the frontend
    if (req.method === "GET" && url.pathname === "/") {
      const html = await fs.readFile(
        path.join(ROOT, "public", "index.html")
      );

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    // Serve a generated website page
    if (
      req.method === "GET" &&
      /^\/generated\/pageforge-preview-[\w-]+\.html$/.test(url.pathname)
    ) {
      const filename = path.basename(url.pathname);
      const html = await fs.readFile(
        path.join(ROOT, "dist", filename)
      );

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    // Generate a website using our existing generator
    if (req.method === "POST" && url.pathname === "/api/generate") {
      let body = "";
      
      for await (const chunk of req) {
        body += chunk;

        if (Buffer.byteLength(body, "utf8") > 1024 * 1024) {
          res.writeHead(413, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Content is too large. Keep it under 1 MB." }));
          return;
        }
      }

      let data;

      try {
        data = JSON.parse(body);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid request data." }));
        return;
      }

      if (
        typeof data.title !== "string" ||
        typeof data.markdown !== "string" ||
        !data.title.trim() ||
        !data.markdown.trim()
      ) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Please enter a title and some Markdown content." }));
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const inputName = `pageforge-preview-${id}.md`;
      const outputName = `pageforge-preview-${id}.html`;
      const inputPath = path.join(ROOT, "content", inputName);
      const outputPath = path.join(ROOT, "dist", outputName);

      const markdownFile =
        `---\ntitle: ${JSON.stringify(data.title.trim())}\n---\n\n` +
        data.markdown;

      try {
        await fs.writeFile(inputPath, markdownFile, { flag: "wx" });

        // Run the existing project generator — don't duplicate its logic.
        await runFile(
          process.execPath,
          ["src/generator/build.mjs"],
          { cwd: ROOT }
        );

        // Confirm the generated page really exists before reporting success.
        await fs.access(outputPath);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          message: "Website generated successfully!",
          url: `/generated/${outputName}`
        }));
      } finally {
        // Keep the generated HTML, but remove the temporary Markdown input.
        await fs.unlink(inputPath).catch(() => {});
      }

      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: "Something went wrong while generating the website. Check the terminal."
      }));
    } else {
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`PageForge is running at http://localhost:${PORT}`);
});
