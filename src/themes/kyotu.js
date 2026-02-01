export const kyotu = {
  name: "KYOTU Technology",
  id: "kyotu",

  fonts: {
    heading: "Georgia",
    body: "Calibri",
    mono: "Consolas",
  },

  colors: {
    primary: "f97c00",
    secondary: "6b7280",
    accent: "ff9e29",
    muted: "9ca3af",
    text: "374151",
    bold: "1f2937",
    tableHeader: "fff7ed",
    tableBorder: "fdba74",
    codeBg: "f8f9fa",
    codeBorder: "e5e7eb",
  },

  sizes: {
    title: 72,
    subtitle: 28,
    h1: 36,
    h2: 28,
    h3: 24,
    h4: 22,
    body: 22,
    table: 20,
    small: 18,
    mono: 18,
  },

  spacing: {
    marginPage: 1440,
    marginPageTop: 1080,
    paraAfter: 200,
    h1Before: 400,
    h1After: 200,
    h2Before: 320,
    h2After: 160,
    h3Before: 240,
    h3After: 120,
    h4Before: 200,
    h4After: 100,
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

  mermaid: {
    config: `---
config:
  theme: base
  look: handDrawn
  flowchart:
    curve: basis
  themeVariables:
    primaryColor: '#fff7ed'
    primaryBorderColor: '#fdba74'
    primaryTextColor: '#9a3412'
    lineColor: '#fb923c'
    secondaryColor: '#fff7ed'
    edgeLabelBackground: '#fff7ed'
    tertiaryColor: '#ffedd5'
    tertiaryBorderColor: '#fed7aa'
    textColor: '#78350f'
    fontFamily: 'Calibri'
    fontSize: 14px
  layout: dagre
---`,
  },
};
