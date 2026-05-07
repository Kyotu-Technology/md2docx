export const mini = {
  name: "Mini",
  id: "mini",

  fonts: {
    heading: "Calibri",
    body: "Cambria",
    mono: "Consolas",
  },

  colors: {
    primary: "2c3e50",
    secondary: "7f8c8d",
    accent: "3498db",
    muted: "bdc3c7",
    text: "2c3e50",
    bold: "1f2937",
    tableHeader: "f8f9fa",
    tableBorder: "dee2e6",
    codeBg: "f8f9fa",
    codeBorder: "e9ecef",
  },

  sizes: {
    title: 56,
    subtitle: 48,
    h1: 28,
    h2: 22,
    h3: 20,
    h4: 18,
    body: 20,
    table: 18,
    small: 18,
    mono: 18,
  },

  spacing: {
    marginPage: 720,
    marginPageTop: 360,
    paraAfter: 0,
    h1Before: 200,
    h1After: 100,
    h2Before: 160,
    h2After: 80,
    h3Before: 120,
    h3After: 60,
    h4Before: 100,
    h4After: 50,
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
    logoSize: { width: 70, height: 30 },
    logoPosition: "right",
    showTitle: false,
  },

  footer: {
    left: "",
    center: "",
    showPageNumber: false,
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
