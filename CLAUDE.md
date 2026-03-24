# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Serve

```bash
# Enter dev environment (provides esbuild, pandoc, python3)
nix-shell

# Build all decks + assets
./build.sh

# Local dev server
cd public && python3 -m http.server 8080

# Container
docker build -t decks.example.com .
docker run -p 8080:80 decks.example.com
```

There are no tests or linters.

## Architecture

Static site generator for presentations: Markdown → pandoc (with custom reveal.js template) → self-contained HTML.

**Pipeline:** `src/*.md` → `build.sh` → `public/<slug>/index.html` + auto-generated listing at `public/index.html`

- `engine/` — Slide runtime: keyboard nav, scroll-snap, overview mode, progress bar (~1.5KB JS). Plus CSS for slides, syntax highlighting (breezedark), and listing page.
- `templates/slides.html` — Pandoc template. Reads YAML frontmatter (`title`, `author`, `date`, `subtitle`, `protected`) into HTML metadata and title slide.
- `build.sh` — Orchestrates: esbuild minifies engine → gzip pre-compresses for nginx → pandoc builds each deck → generates listing page.
- `nginx/decks.conf` — Production: SSL, gzip_static serving from `dist/`, password-protected locations.
- `nginx/decks-container.conf` — Container: HTTP on port 80, assets served from `public/assets/`.

## Adding a Deck

Create `src/<slug>.md` with YAML frontmatter. The slug (filename without `.md`) becomes the URL path.

## Password-Protected Decks

1. Add `protected: true` to frontmatter (shows lock icon on listing)
2. Create htpasswd file: `nginx/htpasswd.d/<slug>`
3. Add `location /<slug>/ { auth_basic ...; }` block to both nginx configs

## Conventions

- Slide separator: `---` between slides, `## Heading` starts a new slide (pandoc `--slide-level=2`)
- Two-column layout: `::: columns` / `::: column` divs
- Speaker notes: `::: notes` div (hidden, HTML source only)
- Dark theme: #0a0a0b background, #ededef text, purple accents
- Assets are fingerprint-less but served with `Cache-Control: immutable` + 1y expiry
