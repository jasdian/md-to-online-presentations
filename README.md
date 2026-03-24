# Decks

Lightweight presentation engine. Write slides in Markdown, get a self-contained HTML site with keyboard navigation, overview mode, and syntax highlighting.

<img width="774" height="610" alt="image" src="https://github.com/user-attachments/assets/6937dabc-94a0-417f-bef1-9f2247d47b73" />

<img width="1911" height="961" alt="image" src="https://github.com/user-attachments/assets/e15de527-cd91-407f-a3e2-f9cbd7e3b3d3" />


## Usage

### Add a deck

Drop a Markdown file in `src/` with YAML frontmatter:

```markdown
---
title: "My Talk"
author: "Name"
date: 2026-01-01
---

## First Slide

Content here.

---

## Second Slide

- Bullet points
- Code blocks
- Tables
- Two-column layouts with `::: columns`
```

### Build

Requires `esbuild` and `pandoc` (provided by `shell.nix`).

```bash
./build.sh
```

### Serve locally

```bash
cd public && python3 -m http.server 8080
```

### Container

```bash
docker build -t decks.example.com .
docker run -p 8080:80 decks.example.com
```

### Production (nginx)

Use `nginx/decks.conf` — it serves `public/` as root and aliases `/assets/` to `dist/` with gzip_static support.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| Arrow Right / Down / Space | Next slide |
| Arrow Left / Up | Previous slide |
| Home / End | First / Last |
| F | Fullscreen |
| O | Overview mode |
| Ctrl+P | Print / PDF export |
