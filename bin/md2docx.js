#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { writeFile, access } from "node:fs/promises";
import { resolve, dirname, basename, extname } from "node:path";
import { convert } from "../src/cli/runner.js";

const HELP = `md2docx - Markdown → DOCX/PDF/HTML

Usage:
  md2docx convert <input.md> [options]

Options:
  -o, --output <path>   Output file path (default: <input>.<ext> next to input)
  -f, --format <fmt>    docx | pdf | html (default: docx)
  -t, --theme <id>      kyotu | kyotu-pro | kyotu-mini | minimal | mini (default: kyotu-pro)
      --title-page      Render title page (default: off)
      --toc             Render table of contents (default: off)
      --header          Render header on every page (default: off)
      --footer          Render page footer with page numbers (default: off)
      --include         Expand @include(file.md) directives from input dir
      --force           Overwrite output if it exists
  -h, --help            Show this help

Examples:
  md2docx convert README.md
  md2docx convert spec.md -o /tmp/spec.pdf -f pdf
  md2docx convert proposal.md -t mini --include
  md2docx convert report.md --title-page --toc --header
`;

function exitErr(msg) {
  process.stderr.write(`md2docx: ${msg}\n`);
  process.exit(1);
}

async function pathExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    process.stdout.write(HELP);
    process.exit(0);
  }

  const subcommand = args[0];
  if (subcommand !== "convert") {
    exitErr(`unknown command "${subcommand}". Run md2docx --help`);
  }

  let parsed;
  try {
    parsed = parseArgs({
      args: args.slice(1),
      allowPositionals: true,
      options: {
        output: { type: "string", short: "o" },
        format: { type: "string", short: "f", default: "docx" },
        theme: { type: "string", short: "t", default: "kyotu-pro" },
        "title-page": { type: "boolean", default: false },
        toc: { type: "boolean", default: false },
        header: { type: "boolean", default: false },
        footer: { type: "boolean", default: false },
        include: { type: "boolean", default: false },
        force: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
    });
  } catch (err) {
    exitErr(err.message);
  }

  if (parsed.values.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  const [inputArg] = parsed.positionals;
  if (!inputArg) {
    exitErr("missing <input.md>. Run md2docx --help");
  }

  const inputPath = resolve(process.cwd(), inputArg);
  if (!(await pathExists(inputPath))) {
    exitErr(`input file not found: ${inputPath}`);
  }

  const format = parsed.values.format;
  const ext = format === "html" ? "html" : format;
  const outputPath = parsed.values.output
    ? resolve(process.cwd(), parsed.values.output)
    : resolve(dirname(inputPath), `${basename(inputPath, extname(inputPath))}.${ext}`);

  if (!parsed.values.force && (await pathExists(outputPath))) {
    exitErr(`output already exists: ${outputPath} (use --force to overwrite)`);
  }

  let result;
  try {
    result = await convert({
      inputPath,
      format,
      theme: parsed.values.theme,
      resolveIncludesFlag: parsed.values.include,
      showTitlePage: parsed.values["title-page"],
      showToc: parsed.values.toc,
      showHeader: parsed.values.header,
      showFooter: parsed.values.footer,
    });
  } catch (err) {
    exitErr(`conversion failed: ${err.message}`);
  }

  await writeFile(outputPath, result.buffer);
  process.stdout.write(`${outputPath}\n`);
}

main().catch((err) => exitErr(err.stack || err.message));
