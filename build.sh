#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

SRC_DIR="src"
OUT_DIR="public"
DIST_DIR="dist"
TEMPLATE="templates/slides.html"

# ── Step 1: Compile engine with esbuild ──
echo "Compiling engine..."
mkdir -p "$DIST_DIR"

esbuild engine/slides.js \
  --bundle --minify --target=es2020 \
  --outfile="$DIST_DIR/slides.min.js"

esbuild engine/slides.css \
  --bundle --minify \
  --outfile="$DIST_DIR/slides.min.css"

esbuild engine/highlight.css \
  --bundle --minify \
  --outfile="$DIST_DIR/highlight.min.css"

esbuild engine/listing.css \
  --bundle --minify \
  --outfile="$DIST_DIR/listing.min.css"

echo "  JS:  $(wc -c < "$DIST_DIR/slides.min.js") bytes"
echo "  CSS: $(wc -c < "$DIST_DIR/slides.min.css") bytes"
echo "  HL:  $(wc -c < "$DIST_DIR/highlight.min.css") bytes"

# ── Step 2: Pre-compress for nginx gzip_static ──
echo "Pre-compressing..."
gzip -kf "$DIST_DIR"/*.js "$DIST_DIR"/*.css

# ── Step 2b: Copy assets into public for local serving ──
echo "Copying assets to public..."
mkdir -p "$OUT_DIR/assets"
cp "$DIST_DIR"/*.js "$DIST_DIR"/*.css "$OUT_DIR/assets/"

# ── Step 3: Build each deck ──
echo "Building decks..."
mkdir -p "$OUT_DIR"

deck_count=0
for md in "$SRC_DIR"/*.md; do
  [ -f "$md" ] || continue
  slug=$(basename "$md" .md)
  mkdir -p "$OUT_DIR/$slug"

  pandoc "$md" \
    -t revealjs \
    --template="$TEMPLATE" \
    --slide-level=2 \
    --highlight-style=breezedark \
    -o "$OUT_DIR/$slug/index.html"

  # Fix reveal.js quirks: data-src lazy loading, and #/id → #id footnote links
  sed -i 's/ data-src="/ src="/g; s|href="#/fn|href="#fn|g; s|href="#/fnref|href="#fnref|g' "$OUT_DIR/$slug/index.html"

  echo "  Built: $slug ($(wc -c < "$OUT_DIR/$slug/index.html") bytes)"
  deck_count=$((deck_count + 1))
done

# ── Step 4: Generate listing page ──
echo "Generating listing page..."
cat > "$OUT_DIR/index.html" <<'HEADER'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <title>Decks</title>
  <link rel="stylesheet" href="/assets/listing.min.css">
  <script>document.documentElement.setAttribute("data-theme",localStorage.getItem("deck-theme")||"dark")</script>
</head>
<body>
  <main class="listing">
    <div class="listing-header">
      <div>
        <p class="label">Presentations</p>
        <h1>Deck Creator.</h1>
      </div>
      <button id="btn-theme" class="theme-toggle" onclick="var t=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',t);localStorage.setItem('deck-theme',t);this.textContent=t==='light'?'☀':'☽'" title="Toggle light/dark">☽</button>
    </div>
    <p class="tagline">Presentations from Markdown. Create, present, export to PDF.</p>
    <div class="deck-grid">
HEADER

deck_idx=0
for md in "$SRC_DIR"/*.md; do
  [ -f "$md" ] || continue
  slug=$(basename "$md" .md)
  deck_idx=$((deck_idx + 1))
  num=$(printf "%02d" "$deck_idx")

  # Extract frontmatter fields
  title=$(sed -n '/^---$/,/^---$/{ s/^title: *"\{0,1\}\(.*[^"]\)"\{0,1\}$/\1/p; }' "$md" | head -1)
  [ -z "$title" ] && title="$slug"
  subtitle=$(sed -n '/^---$/,/^---$/{ s/^subtitle: *"\{0,1\}\(.*[^"]\)"\{0,1\}$/\1/p; }' "$md" | head -1)
  date_raw=$(sed -n '/^---$/,/^---$/{ s/^date: *\(.*\)$/\1/p; }' "$md" | head -1)
  protected=$(sed -n '/^---$/,/^---$/{ s/^protected: *true$/true/p; }' "$md" | head -1)

  # Count slides from built HTML
  slide_count=$(grep -c '<section' "$OUT_DIR/$slug/index.html" 2>/dev/null || echo "0")

  # Format date
  formatted_date=""
  if [ -n "$date_raw" ]; then
    formatted_date=$(LC_ALL=C date -d "$date_raw" "+%a  %b  %d" 2>/dev/null || echo "$date_raw")
  fi

  # Lock icon
  lock=""
  [ "$protected" = "true" ] && lock=' <span class="lock" title="Password-protected">&#x1f512;</span>'

  # Emit card
  echo "      <a href=\"/$slug/\" class=\"card\">" >> "$OUT_DIR/index.html"
  echo "        <span class=\"card-number\">$num</span>" >> "$OUT_DIR/index.html"
  echo "        <div class=\"card-body\">" >> "$OUT_DIR/index.html"
  echo "          <span class=\"card-title\">$title$lock</span>" >> "$OUT_DIR/index.html"
  [ -n "$subtitle" ] && echo "          <span class=\"card-subtitle\">$subtitle</span>" >> "$OUT_DIR/index.html"
  echo "          <div class=\"card-meta\">" >> "$OUT_DIR/index.html"
  echo "            <span class=\"pill\">$slide_count slides</span>" >> "$OUT_DIR/index.html"
  [ -n "$formatted_date" ] && echo "            <span class=\"date\">$formatted_date</span>" >> "$OUT_DIR/index.html"
  echo "          </div>" >> "$OUT_DIR/index.html"
  echo "        </div>" >> "$OUT_DIR/index.html"
  echo "      </a>" >> "$OUT_DIR/index.html"
done

cat >> "$OUT_DIR/index.html" <<'FOOTER'
    </div>
  </main>
</body>
</html>
FOOTER

echo ""
echo "Done! $deck_count deck(s) built."
echo "Serve with: cd public && python3 -m http.server 8080"
