# Releases

## 1.4.0

### New features
- **Document sharing** — Share documents via encrypted URL links. Content is compressed (pako deflate) and encrypted (AES-256-GCM) client-side, then embedded in the URL fragment which never leaves the browser. Two modes: link-only (encryption key in URL) and password-protected (PBKDF2 key derivation). Configurable link expiry (1h to 30 days). Import shared documents with Replace All or Merge options. Optional URL shortening via is.gd.

---

## 1.3.1

### Fixes
- **Angle brackets in tables** — `<` and `>` in table cells and paragraphs no longer break rendering.
- **File explorer toggle** — Toggle button no longer bleeds through the open explorer panel.

---

## 1.3.0

### New features
- **File explorer** — Sidebar panel for managing multiple Markdown documents in one session. Documents stored in IndexedDB with drag & drop import. `@include(filename)` references let you compose a main document from parts, with autocomplete and recursive resolution.
- **Mermaid diagram actions** — Copy to clipboard and download as PNG buttons on every diagram preview.

### Fixes
- **Table empty cells** — Parser no longer drops empty cells from tables (`| foo | | bar |` works correctly).
- **Mermaid diagram dimensions** — Actual PNG dimensions read from Kroki response instead of hardcoded 500×300. Diagrams now render with correct proportions in DOCX and PDF exports.

---

## 1.2.0

### New features
- **PDF overhaul** — Custom theme fonts (instead of hardcoded Roboto), proper hljs syntax highlighting, Unicode symbol support via Noto Emoji, configurable header with logo positioning and document title.
- **Formatting toolbar** — Floating bubble menu appears on text selection. Bold, italic, code, and link formatting with one click. Keyboard shortcuts: Ctrl+B, Ctrl+I, Ctrl+E, Ctrl+K. Smart toggle detects existing formatting including bold+italic combinations (`***text***`).

### Fixes
- **Inline formatting** — `*italic*` no longer matches inside `**bold**`, longer matches preferred at same position.
- **Code highlighting** — Nested hljs `<span>` elements parsed correctly (DOM walker replaces regex).
- **HTML cleanup corrupting code blocks** — Parser's HTML-stripping regexes now skip fenced code blocks. Fixes missing paragraphs (bare `<` causing cross-line deletion) and broken Mermaid diagrams (HTML labels like `<b>`, `<br/>` being stripped).

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
