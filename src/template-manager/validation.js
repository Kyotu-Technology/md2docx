const HEX_COLOR_REGEX = /^[0-9a-fA-F]{6}$/;

const SCHEMA = {
  id: { type: "string", required: true },
  name: { type: "string", required: true, minLength: 1, maxLength: 100 },
  basedOn: { type: "string", required: false },
  createdAt: { type: "number", required: false },
  updatedAt: { type: "number", required: false },

  fonts: {
    type: "object",
    required: true,
    properties: {
      heading: { type: "string", required: true },
      body: { type: "string", required: true },
      mono: { type: "string", required: true },
    },
  },

  colors: {
    type: "object",
    required: true,
    properties: {
      primary: { type: "hex", required: true },
      secondary: { type: "hex", required: true },
      accent: { type: "hex", required: true },
      muted: { type: "hex", required: true },
      text: { type: "hex", required: true },
      bold: { type: "hex", required: true },
      tableHeader: { type: "hex", required: true },
      tableBorder: { type: "hex", required: true },
      codeBg: { type: "hex", required: true },
      codeBorder: { type: "hex", required: true },
    },
  },

  sizes: {
    type: "object",
    required: true,
    properties: {
      title: { type: "number", required: true, min: 10, max: 200 },
      subtitle: { type: "number", required: true, min: 10, max: 100 },
      h1: { type: "number", required: true, min: 10, max: 100 },
      h2: { type: "number", required: true, min: 10, max: 100 },
      h3: { type: "number", required: true, min: 10, max: 100 },
      h4: { type: "number", required: true, min: 10, max: 100 },
      body: { type: "number", required: true, min: 10, max: 100 },
      table: { type: "number", required: true, min: 10, max: 100 },
      small: { type: "number", required: true, min: 8, max: 100 },
      mono: { type: "number", required: true, min: 8, max: 100 },
    },
  },

  spacing: {
    type: "object",
    required: true,
    properties: {
      marginPage: { type: "number", required: true, min: 0, max: 5000 },
      marginPageTop: { type: "number", required: true, min: 0, max: 5000 },
      paraAfter: { type: "number", required: true, min: 0, max: 1000 },
      h1Before: { type: "number", required: true, min: 0, max: 1000 },
      h1After: { type: "number", required: true, min: 0, max: 1000 },
      h2Before: { type: "number", required: true, min: 0, max: 1000 },
      h2After: { type: "number", required: true, min: 0, max: 1000 },
      h3Before: { type: "number", required: true, min: 0, max: 1000 },
      h3After: { type: "number", required: true, min: 0, max: 1000 },
      h4Before: { type: "number", required: true, min: 0, max: 1000 },
      h4After: { type: "number", required: true, min: 0, max: 1000 },
    },
  },

  syntax: {
    type: "object",
    required: true,
    properties: {
      keyword: { type: "hex", required: true },
      string: { type: "hex", required: true },
      comment: { type: "hex", required: true },
      number: { type: "hex", required: true },
      function: { type: "hex", required: true },
      variable: { type: "hex", required: true },
      operator: { type: "hex", required: true },
      punctuation: { type: "hex", required: true },
      className: { type: "hex", required: true },
      property: { type: "hex", required: true },
      tag: { type: "hex", required: true },
      attribute: { type: "hex", required: true },
      default: { type: "hex", required: true },
    },
  },

  titlePage: {
    type: "object",
    required: true,
    properties: {
      verticalSpacing: { type: "number", required: true, min: 0, max: 20 },
      showLogo: { type: "boolean", required: true },
      logoSize: {
        type: "object",
        required: false,
        properties: {
          width: { type: "number", required: true, min: 10, max: 1000 },
          height: { type: "number", required: true, min: 10, max: 1000 },
        },
      },
      showLine: { type: "boolean", required: true },
      lineChar: { type: "string", required: false },
      lineLength: { type: "number", required: false, min: 1, max: 200 },
    },
  },

  header: {
    type: "object",
    required: true,
    properties: {
      showLogo: { type: "boolean", required: true },
      logoSize: {
        type: "object",
        required: false,
        properties: {
          width: { type: "number", required: true, min: 10, max: 500 },
          height: { type: "number", required: true, min: 10, max: 500 },
        },
      },
      logoPosition: { type: "string", required: false, enum: ["left", "right"] },
      showTitle: { type: "boolean", required: true },
    },
  },

  footer: {
    type: "object",
    required: true,
    properties: {
      left: { type: "string", required: true },
      center: { type: "string", required: true },
      showPageNumber: { type: "boolean", required: true },
    },
  },

  mermaid: {
    type: "object",
    required: false,
    properties: {
      config: { type: "string", required: true },
    },
  },

  logo: {
    type: "object",
    required: false,
    properties: {
      dataUrl: { type: "string", required: true, maxLength: 5000000 },
      filename: { type: "string", required: false, maxLength: 255 },
    },
  },
};

function validateField(value, schema, path) {
  const errors = [];

  if (value === undefined || value === null) {
    if (schema.required) {
      errors.push(`${path}: required field is missing`);
    }
    return errors;
  }

  switch (schema.type) {
    case "string":
      if (typeof value !== "string") {
        errors.push(`${path}: expected string, got ${typeof value}`);
      } else {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
          errors.push(`${path}: minimum length is ${schema.minLength}`);
        }
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
          errors.push(`${path}: maximum length is ${schema.maxLength}`);
        }
        if (schema.enum && !schema.enum.includes(value)) {
          errors.push(`${path}: must be one of: ${schema.enum.join(", ")}`);
        }
      }
      break;

    case "number":
      if (typeof value !== "number" || isNaN(value)) {
        errors.push(`${path}: expected number, got ${typeof value}`);
      } else {
        if (schema.min !== undefined && value < schema.min) {
          errors.push(`${path}: minimum value is ${schema.min}`);
        }
        if (schema.max !== undefined && value > schema.max) {
          errors.push(`${path}: maximum value is ${schema.max}`);
        }
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        errors.push(`${path}: expected boolean, got ${typeof value}`);
      }
      break;

    case "hex":
      if (typeof value !== "string" || !HEX_COLOR_REGEX.test(value)) {
        errors.push(`${path}: expected 6-character hex color without #`);
      }
      break;

    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push(`${path}: expected object`);
      } else if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          errors.push(...validateField(value[key], propSchema, `${path}.${key}`));
        }
      }
      break;
  }

  return errors;
}

export function validateTemplate(template) {
  const errors = [];

  for (const [key, schema] of Object.entries(SCHEMA)) {
    errors.push(...validateField(template[key], schema, key));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateImportFormat(data) {
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Invalid JSON format"] };
  }

  if (data["md2docx-template"] === "1.0" && data.template) {
    return { valid: true, type: "single", templates: [data.template] };
  }

  if (data["md2docx-templates"] === "1.0" && Array.isArray(data.templates)) {
    return { valid: true, type: "multiple", templates: data.templates };
  }

  return {
    valid: false,
    errors: ["Unrecognized format. Expected md2docx-template or md2docx-templates v1.0"],
  };
}

export function createExportData(template) {
  return {
    "md2docx-template": "1.0",
    template,
  };
}

export function createExportAllData(templates) {
  return {
    "md2docx-templates": "1.0",
    templates,
  };
}
