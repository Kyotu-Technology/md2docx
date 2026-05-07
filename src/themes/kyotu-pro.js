export const kyotuPro = {
  name: "KYOTU Pro",
  id: "kyotu-pro",

  fonts: {
    heading: "Calibri",
    body: "Calibri",
    mono: "Consolas",
  },

  colors: {
    primary: "d97706",
    secondary: "6b7280",
    accent: "d97706",
    muted: "9ca3af",
    text: "374151",
    bold: "1f2937",
    tableHeader: "f2f2f2",
    tableBorder: "d1d5db",
    codeBg: "f8f9fa",
    codeBorder: "e5e7eb",
    h1Bar: "d97706",
    h1Bg: "f2f2f2",
    h2Bar: "d97706",
    h2Bg: "f7f7f7",
    blockquoteBar: "d97706",
    blockquoteBg: "fafafa",
    blockquoteText: "374151",
  },

  sizes: {
    title: 56,
    subtitle: 28,
    h1: 28,
    h2: 24,
    h3: 22,
    h4: 20,
    body: 20,
    table: 20,
    small: 18,
    mono: 18,
  },

  spacing: {
    marginPage: 540,
    marginPageTop: 360,
    paraAfter: 60,
    h1Before: 140,
    h1After: 60,
    h2Before: 100,
    h2After: 40,
    h3Before: 80,
    h3After: 30,
    h4Before: 60,
    h4After: 20,
    listItemAfter: 30,
  },

  syntax: {
    keyword: "0000FF",
    string: "A31515",
    comment: "008000",
    number: "098658",
    function: "795E26",
    variable: "001080",
    operator: "000000",
    punctuation: "000000",
    className: "267f99",
    property: "001080",
    tag: "800000",
    attribute: "FF0000",
    default: "000000",
  },

  titlePage: {
    verticalSpacing: 5,
    showLogo: true,
    logoSize: { width: 220, height: 94 },
    showLine: true,
  },

  header: {
    showLogo: true,
    logoSize: { width: 70, height: 30 },
    logoPosition: "right",
    showTitle: false,
  },

  footer: {
    left: "KYOTU Technology",
    center: "Confidential",
    showPageNumber: true,
  },

  body: {
    alignment: "justify",
  },

  headings: {
    h1Caps: true,
    h2Caps: true,
  },

  mermaid: {
    config: `---
config:
  theme: base
  look: handDrawn
  flowchart:
    curve: basis
  themeVariables:
    primaryColor: '#fef3e2'
    primaryBorderColor: '#d97706'
    primaryTextColor: '#78350f'
    lineColor: '#d97706'
    secondaryColor: '#fef3e2'
    edgeLabelBackground: '#fef3e2'
    tertiaryColor: '#fde9c8'
    tertiaryBorderColor: '#f59e0b'
    textColor: '#78350f'
    fontFamily: 'Calibri'
    fontSize: 14px
  layout: dagre
---`,
  },
};
