---
title: "Technical Documentation"
subtitle: "Implementation Guide"
author: "KYOTU Technology"
date: "January 2026"
---

# Introduction

This document demonstrates the capabilities of **MD2DOCX** converter. It supports various Markdown elements and generates professional Word documents.

## Text Formatting

Text can be **bold**, *italic* or `inline code`. You can also combine them: ***bold and italic***.

## Inline Code Edge Cases

Code with underscores: `special_rounding` and `my_var_name` should render as code.

Code with asterisks: `*args` and `**kwargs` should render as code, not bold or italic.

Mixed formatting: **bold text** then `code_with_underscores` then *italic text* in one line.

Underscore in identifier: some_var_name should stay plain text, not become italic.

## Bullet List

- First item with some details
- Second item with **bold text**
- Third item with `code`

## Numbered List

1. Step one - initialize the project
2. Step two - configure settings
3. Step three - deploy to production

## Task List

- [x] Project setup completed
- [x] Core features implemented
- [ ] Documentation in progress

## Data Table

| Feature  | Status    | Priority |
| -------- | --------- | -------- |
| Parser   | Done      | High     |
| Renderer | Done      | High     |
| Tests    | Progress  | Medium   |

## Code Block

```javascript
function hello(name) {
  console.log(`Hello, ${name}!`);
  return true;
}
```

## Horizontal Rule

---

## Blockquote

> This is a blockquote with **bold** and *italic* text.
> It spans multiple lines.
