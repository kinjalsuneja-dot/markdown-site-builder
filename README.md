# Techspace-srmuh/markdown-site-builder
# Static Site Builder

A lightweight static site generator that converts Markdown content into HTML pages using JavaScript and Node.js.

## Features

- **Markdown to HTML:** Converts Markdown content into HTML using `marked`.
- **Front Matter:** Reads page metadata, such as titles and tags, using `gray-matter`.
- **HTML Templates:** Uses templates to generate consistent page layouts.
- **Multiple Pages:** Generates HTML pages from Markdown files.
- **Tag Index:** Creates a central page for browsing content by tags.
- **Command-Line Build:** Generates the website locally with a single command.

## Tech Stack

- JavaScript (ES Modules)
- Node.js
- HTML
- `marked`
- `gray-matter`

## Project Structure

```text
markdown-site-builder/
├── content/             # Markdown content
├── src/
│   └── generator/       # Site generation logic
├── templates/           # HTML templates
├── tests/               # Automated tests
├── dist/                # Generated website
├── package.json
├── package-lock.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository and navigate to the project directory.

Install dependencies:

```bash
npm install
```

### Build the Website

Run the generator:

```bash
node src/generator/build.mjs
```

The generated HTML pages will be available in the `dist/` directory.

### Run Tests

Execute the automated tests:

```bash
npm test
```

## Adding Content

1. Create a Markdown file in the project's content directory.
2. Add front matter for metadata, including the page title and tags.
3. Write the page content in Markdown.
4. Run the build command to generate the HTML output.

Example:

```markdown
---
title: My First Blog Post
tags:
  - learning
  - web-development
---

# Welcome

This is my first post generated with the Static Site Builder.
```

## Output

The generator currently produces:

- `index.html`
- `about.html`
- `tags.html`

The tag index groups pages by their tags and links to the corresponding generated HTML pages.

## Project Goal

The goal of this project is to build a simple, reusable tool that transforms Markdown files into a structured static website without requiring a database or a backend server.

## Current Status

Core generation functionality and the automated build test are working. Further improvements can include live reload, RSS feed generation, and additional Markdown and metadata handling.
