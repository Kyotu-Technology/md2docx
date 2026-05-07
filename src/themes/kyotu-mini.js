export const kyotuMini = {
  name: "KYOTU Mini",
  id: "kyotu-mini",

  fonts: {
    heading: "Calibri",
    body: "Cambria",
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
    verticalSpacing: 5,
    showLogo: true,
    logoSize: { width: 220, height: 94 },
    showLine: true,
  },

  header: {
    showLogo: false,
    logoSize: { width: 70, height: 30 },
    logoPosition: "right",
    showTitle: false,
  },

  footer: {
    left: "KYOTU Technology",
    center: "Confidential",
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
