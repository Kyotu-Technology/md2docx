# Releases

## 1.2.0

### New features
- **Custom fonts in PDF** — PDF export now uses theme fonts (heading, body, mono) instead of hardcoded Roboto. Fonts are lazy-loaded as TTF on first PDF export.
- **Proper syntax highlighting in PDF** — Code blocks in PDF now use highlight.js (190+ languages) instead of naive regex patterns. Consistent with DOCX and HTML output.
- **Unicode symbol support** — Arrows, geometric shapes, and dingbats render correctly in PDF via Noto Emoji font.
- **Configurable PDF header** — Logo position (left/right), document title display, and custom logo sizing.

### Improvements
- **PDF theme adapter** — PDF renderer now uses `pdfThemeAdapter()` pattern consistent with DOCX renderer. Explicit font/size on every element eliminates style inheritance issues.
- **PDF footer separator** — Footer parts joined with middle dot (·) instead of dash.
- **HR width** — Horizontal rules now calculated from page dimensions instead of hardcoded width.

### Fixes
- **Inline italic parsing** — Single `*italic*` no longer incorrectly matches inside `**bold**` or `***boldItalic***` markers.
- **Inline match priority** — When multiple patterns match at the same position, longer match is now preferred.
- **Nested code highlighting** — highlight.js nested `<span>` elements now parsed correctly via DOM walker instead of flat regex.

---

## 1.1.1

### Fixes
- **Self-hosted fonts** — All fonts now bundled locally (~1.9MB). Fixes CORS 403 error in page view mode on GitHub Pages. No more Google Fonts CDN dependency.

---

## 1.1.0

### New features
- **Custom templates** — Create your own themes with full control over fonts, colors, spacing, and more. Import styles from .docx files.
- **Scroll sync** — Editor and preview stay in sync. Auto-follow cursor or jump on demand.
- **Page view** — Preview as paginated A4 pages matching final export.
- **Semantic search** — Press Ctrl+K to search by meaning, not just keywords. Runs locally via WebAssembly.
- **Quality score** — Real-time readability metrics (Flesch-Kincaid, passive voice, heading structure).

### Improvements
- **Custom notifications** — Elegant toast notifications and confirm modals replace browser alerts. Non-blocking, dark-themed, keyboard accessible.

---

## 1.0.0

First public release of md2docx — a fully client-side Markdown to document converter. No backend, no sign-up, runs in your browser.

### Export to three formats

- **DOCX** — professional Word documents via docx.js
- **PDF** — via pdfmake (experimental)
- **Standalone HTML** — self-contained, print-ready

### Markdown features

Headings, bold, italic, inline code, links, bullet & numbered lists, checklists, tables, fenced code blocks with syntax highlighting (190+ languages), Mermaid diagrams, horizontal rules, and YAML frontmatter for document metadata.

### Document structure

Title page with logo · auto-generated table of contents · configurable headers & footers · custom logo upload

### Two built-in themes

- **KYOTU Technology** — branded, with logo and orange accents
- **Minimal** — clean and neutral

### Editor

- Live preview with real-time rendering
- Drag & drop `.md` / `.txt` files
- Auto-save to localStorage
- Ctrl+Enter to export
- Resizable split panes

### Known limitations

- PDF export is experimental — use HTML print-to-PDF for production quality
- Mermaid diagrams require internet (rendered via Kroki.io)
