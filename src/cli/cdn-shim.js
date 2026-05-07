import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const projectRoot = resolve(here, "..", "..");

globalThis.window = globalThis;
globalThis.__md2docxRoot = projectRoot;

const { parseHTML } = await import("linkedom");
const { document, Node } = parseHTML("<!doctype html><html><body></body></html>");
globalThis.document = document;
globalThis.Node = Node;

const docx = await import("docx");
globalThis.docx = docx;

const pakoMod = await import("pako");
globalThis.pako = pakoMod.default ?? pakoMod;

const hljsMod = await import("highlight.js");
globalThis.hljs = hljsMod.default ?? hljsMod;

const pdfMakeMod = await import("pdfmake/build/pdfmake.js");
const vfsMod = await import("pdfmake/build/vfs_fonts.js");
const pdfMake = pdfMakeMod.default ?? pdfMakeMod;
const vfs = vfsMod.default ?? vfsMod;
if (vfs && typeof vfs === "object" && !pdfMake.vfs) {
  pdfMake.vfs = vfs.pdfMake?.vfs ?? vfs.vfs ?? vfs;
}
globalThis.pdfMake = pdfMake;
