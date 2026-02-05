const NS = {
  w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
};

function getElementByXPath(doc, xpath, ns = NS) {
  const resolver = (prefix) => ns[prefix] || null;
  const result = doc.evaluate(xpath, doc, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return result.singleNodeValue;
}

function parseColorFromTheme(themeDoc, colorName) {
  const colorMap = {
    dk1: "//a:clrScheme/a:dk1",
    dk2: "//a:clrScheme/a:dk2",
    lt1: "//a:clrScheme/a:lt1",
    lt2: "//a:clrScheme/a:lt2",
    accent1: "//a:clrScheme/a:accent1",
    accent2: "//a:clrScheme/a:accent2",
    accent3: "//a:clrScheme/a:accent3",
    accent4: "//a:clrScheme/a:accent4",
    accent5: "//a:clrScheme/a:accent5",
    accent6: "//a:clrScheme/a:accent6",
    hlink: "//a:clrScheme/a:hlink",
    folHlink: "//a:clrScheme/a:folHlink",
  };

  const xpath = colorMap[colorName];
  if (!xpath) return null;

  const node = getElementByXPath(themeDoc, xpath);
  if (!node) return null;

  const srgbClr = node.getElementsByTagNameNS(NS.a, "srgbClr")[0];
  if (srgbClr) {
    return srgbClr.getAttribute("val");
  }

  const sysClr = node.getElementsByTagNameNS(NS.a, "sysClr")[0];
  if (sysClr) {
    return sysClr.getAttribute("lastClr");
  }

  return null;
}

function extractThemeColors(themeDoc) {
  const colors = {};

  const accent1 = parseColorFromTheme(themeDoc, "accent1");
  const accent2 = parseColorFromTheme(themeDoc, "accent2");
  const dk1 = parseColorFromTheme(themeDoc, "dk1");
  const dk2 = parseColorFromTheme(themeDoc, "dk2");
  const lt1 = parseColorFromTheme(themeDoc, "lt1");
  const lt2 = parseColorFromTheme(themeDoc, "lt2");

  if (accent1) colors.primary = accent1.toLowerCase();
  if (accent2) colors.accent = accent2.toLowerCase();
  if (dk1) colors.text = dk1.toLowerCase();
  if (dk2) colors.bold = dk2.toLowerCase();
  if (lt1) colors.tableHeader = lt1.toLowerCase();
  if (lt2) colors.codeBg = lt2.toLowerCase();

  return colors;
}

function extractThemeFonts(themeDoc) {
  const fonts = {};

  const majorFont = themeDoc.getElementsByTagNameNS(NS.a, "majorFont")[0];
  const minorFont = themeDoc.getElementsByTagNameNS(NS.a, "minorFont")[0];

  if (majorFont) {
    const latin = majorFont.getElementsByTagNameNS(NS.a, "latin")[0];
    if (latin) {
      fonts.heading = latin.getAttribute("typeface");
    }
  }

  if (minorFont) {
    const latin = minorFont.getElementsByTagNameNS(NS.a, "latin")[0];
    if (latin) {
      fonts.body = latin.getAttribute("typeface");
    }
  }

  return fonts;
}

function extractStyleFonts(stylesDoc) {
  const fonts = {};

  const styles = stylesDoc.getElementsByTagNameNS(NS.w, "style");
  for (const style of styles) {
    const styleId = style.getAttribute("w:styleId");
    const rPr = style.getElementsByTagNameNS(NS.w, "rPr")[0];
    if (!rPr) continue;

    const rFonts = rPr.getElementsByTagNameNS(NS.w, "rFonts")[0];
    if (!rFonts) continue;

    const ascii = rFonts.getAttribute("w:ascii") || rFonts.getAttribute("w:hAnsi");
    if (!ascii) continue;

    if (styleId?.startsWith("Heading") && !fonts.heading) {
      fonts.heading = ascii;
    } else if (styleId === "Normal" && !fonts.body) {
      fonts.body = ascii;
    }
  }

  return fonts;
}

function extractStyleSizes(stylesDoc) {
  const sizes = {};

  const sizeMap = {
    Heading1: "h1",
    Heading2: "h2",
    Heading3: "h3",
    Heading4: "h4",
    Normal: "body",
    Title: "title",
    Subtitle: "subtitle",
  };

  const styles = stylesDoc.getElementsByTagNameNS(NS.w, "style");
  for (const style of styles) {
    const styleId = style.getAttribute("w:styleId");
    const targetKey = sizeMap[styleId];
    if (!targetKey) continue;

    const rPr = style.getElementsByTagNameNS(NS.w, "rPr")[0];
    if (!rPr) continue;

    const sz = rPr.getElementsByTagNameNS(NS.w, "sz")[0];
    if (sz) {
      const val = parseInt(sz.getAttribute("w:val"), 10);
      if (!isNaN(val)) {
        sizes[targetKey] = val;
      }
    }
  }

  return sizes;
}

function extractStyleSpacing(stylesDoc) {
  const spacing = {};

  const spacingMap = {
    Heading1: ["h1Before", "h1After"],
    Heading2: ["h2Before", "h2After"],
    Heading3: ["h3Before", "h3After"],
    Heading4: ["h4Before", "h4After"],
    Normal: [null, "paraAfter"],
  };

  const styles = stylesDoc.getElementsByTagNameNS(NS.w, "style");
  for (const style of styles) {
    const styleId = style.getAttribute("w:styleId");
    const keys = spacingMap[styleId];
    if (!keys) continue;

    const pPr = style.getElementsByTagNameNS(NS.w, "pPr")[0];
    if (!pPr) continue;

    const spacingEl = pPr.getElementsByTagNameNS(NS.w, "spacing")[0];
    if (!spacingEl) continue;

    const before = spacingEl.getAttribute("w:before");
    const after = spacingEl.getAttribute("w:after");

    if (keys[0] && before) {
      const val = parseInt(before, 10);
      if (!isNaN(val)) spacing[keys[0]] = val;
    }
    if (keys[1] && after) {
      const val = parseInt(after, 10);
      if (!isNaN(val)) spacing[keys[1]] = val;
    }
  }

  return spacing;
}

function extractPageMargins(settingsDoc, documentDoc) {
  const spacing = {};

  const sectPr =
    documentDoc?.getElementsByTagNameNS(NS.w, "sectPr")[0] ||
    settingsDoc?.getElementsByTagNameNS(NS.w, "sectPr")[0];

  if (sectPr) {
    const pgMar = sectPr.getElementsByTagNameNS(NS.w, "pgMar")[0];
    if (pgMar) {
      const left = pgMar.getAttribute("w:left");
      const top = pgMar.getAttribute("w:top");

      if (left) {
        const val = parseInt(left, 10);
        if (!isNaN(val)) spacing.marginPage = val;
      }
      if (top) {
        const val = parseInt(top, 10);
        if (!isNaN(val)) spacing.marginPageTop = val;
      }
    }
  }

  return spacing;
}

export async function extractStylesFromDocx(file) {
  const zip = await JSZip.loadAsync(file);

  const parser = new DOMParser();

  let themeDoc = null;
  let stylesDoc = null;
  let settingsDoc = null;
  let documentDoc = null;

  const themeFile = zip.file("word/theme/theme1.xml");
  if (themeFile) {
    const xml = await themeFile.async("string");
    themeDoc = parser.parseFromString(xml, "text/xml");
  }

  const stylesFile = zip.file("word/styles.xml");
  if (stylesFile) {
    const xml = await stylesFile.async("string");
    stylesDoc = parser.parseFromString(xml, "text/xml");
  }

  const settingsFile = zip.file("word/settings.xml");
  if (settingsFile) {
    const xml = await settingsFile.async("string");
    settingsDoc = parser.parseFromString(xml, "text/xml");
  }

  const documentFile = zip.file("word/document.xml");
  if (documentFile) {
    const xml = await documentFile.async("string");
    documentDoc = parser.parseFromString(xml, "text/xml");
  }

  const result = {
    fonts: {},
    colors: {},
    sizes: {},
    spacing: {},
    extracted: [],
  };

  if (themeDoc) {
    const themeColors = extractThemeColors(themeDoc);
    const themeFonts = extractThemeFonts(themeDoc);
    Object.assign(result.colors, themeColors);
    Object.assign(result.fonts, themeFonts);
    if (Object.keys(themeColors).length > 0) result.extracted.push("theme colors");
    if (Object.keys(themeFonts).length > 0) result.extracted.push("theme fonts");
  }

  if (stylesDoc) {
    const styleFonts = extractStyleFonts(stylesDoc);
    const styleSizes = extractStyleSizes(stylesDoc);
    const styleSpacing = extractStyleSpacing(stylesDoc);

    Object.keys(styleFonts).forEach((k) => {
      if (!result.fonts[k]) result.fonts[k] = styleFonts[k];
    });
    Object.assign(result.sizes, styleSizes);
    Object.assign(result.spacing, styleSpacing);

    if (Object.keys(styleFonts).length > 0 && !result.extracted.includes("theme fonts")) {
      result.extracted.push("style fonts");
    }
    if (Object.keys(styleSizes).length > 0) result.extracted.push("font sizes");
    if (Object.keys(styleSpacing).length > 0) result.extracted.push("paragraph spacing");
  }

  if (documentDoc || settingsDoc) {
    const margins = extractPageMargins(settingsDoc, documentDoc);
    Object.assign(result.spacing, margins);
    if (Object.keys(margins).length > 0) result.extracted.push("page margins");
  }

  if (!result.fonts.mono) {
    result.fonts.mono = "Consolas";
  }

  return result;
}
