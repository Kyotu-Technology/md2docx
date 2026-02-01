export const minimal = {
  name: "Minimal",
  id: "minimal",

  fonts: {
    heading: "Calibri Light",
    body: "Calibri",
    mono: "Consolas",
  },

  colors: {
    primary: "2c3e50",
    secondary: "7f8c8d",
    accent: "3498db",
    muted: "bdc3c7",
    text: "2c3e50",
    tableHeader: "f8f9fa",
    tableBorder: "dee2e6",
    codeBg: "f8f9fa",
    codeBorder: "e9ecef",
  },

  sizes: {
    title: 64,
    subtitle: 26,
    h1: 32,
    h2: 26,
    h3: 22,
    h4: 20,
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
    verticalSpacing: 6,
    showLogo: false,
    showLine: true,
    lineChar: "─",
    lineLength: 40,
  },

  header: {
    showLogo: false,
    showTitle: true,
  },

  footer: {
    left: "",
    center: "",
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
    primaryColor: '#f9fafb'
    primaryBorderColor: '#9ca3af'
    primaryTextColor: '#374151'
    lineColor: '#9ca3af'
    secondaryColor: '#f9fafb'
    edgeLabelBackground: '#f9fafb'
    tertiaryColor: '#f3f4f6'
    tertiaryBorderColor: '#d1d5db'
    textColor: '#4b5563'
    fontFamily: ''
  layout: elk
---`,
  },
};
