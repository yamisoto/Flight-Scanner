// Turns the design-canvas .dc.html boards into standalone HTML pages (no runtime needed)
// and screenshots each one to PNG. Usage: node export.js <srcDir> <outDir>
const fs = require("fs");
const path = require("path");
const { chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright");

const [srcDir, outDir] = process.argv.slice(2);

const BOARDS = [
  // [source file, output path (no extension), width, title]
  ["Main.dc.html", "identities/01-instrument", 1440, "Identity 01: Instrument"],
  ["Harmattan.dc.html", "identities/02-harmattan", 1440, "Identity 02: Harmattan"],
  ["Signal.dc.html", "identities/03-signal", 1440, "Identity 03: Signal"],
  ["InstrumentHome.dc.html", "mockups/01-instrument-home", 1440, "Instrument: home"],
  ["InstrumentResults.dc.html", "mockups/01-instrument-results", 1440, "Instrument: results"],
  ["InstrumentMobile.dc.html", "mockups/01-instrument-mobile", 390, "Instrument: mobile results"],
  ["HarmattanHome.dc.html", "mockups/02-harmattan-home", 1440, "Harmattan: home"],
  ["HarmattanResults.dc.html", "mockups/02-harmattan-results", 1440, "Harmattan: results"],
  ["HarmattanMobile.dc.html", "mockups/02-harmattan-mobile", 390, "Harmattan: mobile results"],
  ["SignalHome.dc.html", "mockups/03-signal-home", 1440, "Signal: home"],
  ["SignalResults.dc.html", "mockups/03-signal-results", 1440, "Signal: results"],
  ["SignalMobile.dc.html", "mockups/03-signal-mobile", 390, "Signal: mobile results"],
];

function renderVals(src) {
  const m = src.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/);
  const code = `class DCLogic { constructor(){ this.props = {}; this.state = {}; } }\n${m[1]}\nreturn new Component().renderVals();`;
  return new Function(code)();
}

function lookup(scope, expr) {
  const p = expr.trim();
  if (p === "true") return true;
  if (p === "false") return false;
  return p.split(".").reduce((o, k) => (o == null ? undefined : o[k]), scope);
}

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const holes = (s, scope) => s.replace(/\{\{([^}]+)\}\}/g, (_, e) => {
  const v = lookup(scope, e);
  if (v === undefined) throw new Error(`Unresolved hole {{${e}}}`);
  return esc(v);
});

function findClose(s, tag, from) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, "g");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(s))) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return m.index;
  }
  throw new Error(`Unclosed <${tag}>`);
}

function render(tpl, scope) {
  const m = /<(sc-for|sc-if)\b([^>]*)>/.exec(tpl);
  if (!m) return holes(tpl, scope);
  const [open, tag, attrs] = m;
  const innerStart = m.index + open.length;
  const close = findClose(tpl, tag, innerStart);
  const inner = tpl.slice(innerStart, close);
  const after = tpl.slice(close + `</${tag}>`.length);
  const attr = (n) => (attrs.match(new RegExp(`${n}="([^"]*)"`)) || [])[1];
  let body = "";
  if (tag === "sc-for") {
    const list = lookup(scope, attr("list").replace(/^\{\{|\}\}$/g, ""));
    const as = attr("as");
    list.forEach((item, i) => { body += render(inner, { ...scope, [as]: item, $index: i }); });
  } else if (lookup(scope, attr("value").replace(/^\{\{|\}\}$/g, ""))) {
    body = render(inner, scope);
  }
  return holes(tpl.slice(0, m.index), scope) + body + render(after, scope);
}

function toStandalone(src, title, width) {
  const xdc = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];
  const helmet = (xdc.match(/<helmet>([\s\S]*?)<\/helmet>/) || [, ""])[1];
  const content = xdc.replace(/<helmet>[\s\S]*?<\/helmet>/, "");
  const html = render(content, renderVals(src));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${width}">
<title>Skyfare brand draft: ${esc(title)}</title>
<!-- Exported from the Skyfare design canvas. Draft for review, not production code. -->
${helmet.trim()}
<style>body{min-width:${width}px}</style>
</head>
<body>
${html.trim()}
</body>
</html>
`;
}

(async () => {
  const browser = await chromium.launch();
  for (const [file, out, width, title] of BOARDS) {
    const src = fs.readFileSync(path.join(srcDir, file), "utf8");
    const htmlPath = path.join(outDir, out + ".html");
    fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    fs.writeFileSync(htmlPath, toStandalone(src, title, width));
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("file://" + htmlPath, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(outDir, out + ".png"), fullPage: true });
    console.log(out, errors.length ? "ERRORS " + errors.join("; ") : "ok");
    await page.close();
  }
  await browser.close();
})();
