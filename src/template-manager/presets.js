export const COLOR_PRESETS = {
  "kyotu-orange": {
    name: "KYOTU Orange",
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
  },

  "ocean-blue": {
    name: "Ocean Blue",
    colors: {
      primary: "0077b6",
      secondary: "6b7280",
      accent: "00b4d8",
      muted: "90e0ef",
      text: "1d3557",
      bold: "14213d",
      tableHeader: "e0f4ff",
      tableBorder: "90e0ef",
      codeBg: "f8f9fa",
      codeBorder: "caf0f8",
    },
  },

  "forest-green": {
    name: "Forest Green",
    colors: {
      primary: "2d6a4f",
      secondary: "6b7280",
      accent: "52b788",
      muted: "95d5b2",
      text: "1b4332",
      bold: "081c15",
      tableHeader: "d8f3dc",
      tableBorder: "95d5b2",
      codeBg: "f8f9fa",
      codeBorder: "b7e4c7",
    },
  },

  "elegant-purple": {
    name: "Elegant Purple",
    colors: {
      primary: "7b2cbf",
      secondary: "6b7280",
      accent: "9d4edd",
      muted: "c77dff",
      text: "3c096c",
      bold: "240046",
      tableHeader: "f3e8ff",
      tableBorder: "c77dff",
      codeBg: "f8f9fa",
      codeBorder: "e0aaff",
    },
  },

  "warm-red": {
    name: "Warm Red",
    colors: {
      primary: "c9184a",
      secondary: "6b7280",
      accent: "ff4d6d",
      muted: "ff758f",
      text: "590d22",
      bold: "370617",
      tableHeader: "fff0f3",
      tableBorder: "ffb3c1",
      codeBg: "f8f9fa",
      codeBorder: "ffccd5",
    },
  },

  monochrome: {
    name: "Monochrome",
    colors: {
      primary: "212529",
      secondary: "6c757d",
      accent: "495057",
      muted: "adb5bd",
      text: "343a40",
      bold: "212529",
      tableHeader: "f8f9fa",
      tableBorder: "dee2e6",
      codeBg: "f8f9fa",
      codeBorder: "e9ecef",
    },
  },
};

export const FONT_PRESETS = {
  heading: [
    "Calibri",
    "Arial",
    "Times New Roman",
    "Georgia",
    "Verdana",
    "Tahoma",
    "Trebuchet MS",
    "Cambria",
    "Garamond",
    "Century Gothic",
    "Palatino Linotype",
    "Book Antiqua",
  ],
  body: [
    "Calibri",
    "Arial",
    "Times New Roman",
    "Georgia",
    "Verdana",
    "Tahoma",
    "Trebuchet MS",
    "Cambria",
    "Garamond",
    "Century Gothic",
    "Palatino Linotype",
    "Book Antiqua",
  ],
  mono: ["Consolas", "Courier New", "Source Code Pro", "Fira Code", "JetBrains Mono"],
};

export function getPresetColors(presetId) {
  return COLOR_PRESETS[presetId]?.colors || null;
}

export function getPresetList() {
  return Object.entries(COLOR_PRESETS).map(([id, preset]) => ({
    id,
    name: preset.name,
    preview: preset.colors.primary,
  }));
}

export const MERMAID_PRESETS = [
  {
    id: "kyotu",
    name: "KYOTU (handDrawn)",
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
  {
    id: "minimal",
    name: "Minimal (clean)",
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
  {
    id: "dark",
    name: "Dark Mode",
    config: `---
config:
  theme: dark
  flowchart:
    curve: basis
  themeVariables:
    primaryColor: '#1e293b'
    primaryBorderColor: '#475569'
    primaryTextColor: '#f1f5f9'
    lineColor: '#64748b'
    secondaryColor: '#334155'
    edgeLabelBackground: '#1e293b'
    tertiaryColor: '#0f172a'
    tertiaryBorderColor: '#334155'
    textColor: '#e2e8f0'
    fontFamily: 'sans-serif'
  layout: dagre
---`,
  },
  {
    id: "neutral",
    name: "Neutral",
    config: `---
config:
  theme: neutral
  flowchart:
    curve: linear
  themeVariables:
    fontFamily: 'sans-serif'
  layout: dagre
---`,
  },
  {
    id: "forest",
    name: "Forest",
    config: `---
config:
  theme: forest
  flowchart:
    curve: basis
  themeVariables:
    fontFamily: 'sans-serif'
  layout: dagre
---`,
  },
];

export function getMermaidPresetList() {
  return MERMAID_PRESETS.map((p) => ({ id: p.id, name: p.name }));
}

export function getMermaidPresetConfig(presetId) {
  return MERMAID_PRESETS.find((p) => p.id === presetId)?.config || "";
}
