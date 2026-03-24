---
title: "Private Demo"
author: "John Wick"
date: 2026-03-24
protected: true
---

## This Deck Is Password-Protected

You made it past nginx basic auth.

- Username: `demo`
- Password: `demo`

---

## Why Password-Protect?

- Client-only presentations
- Internal talks before public release
- Draft decks under review

---

## How It Works

1. Add `protected: true` to frontmatter
2. Create an htpasswd file in `nginx/htpasswd.d/<slug>`
3. Nginx serves a 401 challenge before the content

---

## That's It

Simple, effective, no JS auth needed.
