#!/usr/bin/env node
/**
 * UI overflow audit for the static export in `out/`.
 *
 * Serves the build and, for every route at every viewport, looks for:
 *  - horizontal page overflow (content wider than the viewport)
 *  - text/elements clipped without an ellipsis
 *  - elements sticking out of the viewport outside a scroll container
 * It also checks the mobile sidebar sheet and the "Neue Bewerbung" dialog.
 *
 * Usage:
 *   NEXT_PUBLIC_DEMO_MODE=true npm run build
 *   node scripts/ui-audit.mjs
 *   node scripts/ui-audit.mjs --json > audit.json
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out");
const PORT = Number(process.env.AUDIT_PORT ?? 4321);
const BASE = `http://127.0.0.1:${PORT}`;
const JSON_OUT = process.argv.includes("--json");
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ROUTES = [
  "/dashboard",
  "/board",
  "/applications",
  "/applications/detail?id=app-001",
  "/applications/detail?id=app-004",
  "/calendar",
  "/settings",
];

const VIEWPORTS = [
  [320, 720],
  [360, 780],
  [390, 844],
  [414, 896],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  if (clean === "/") return path.join(OUT, "index.html");
  const candidates = [
    path.join(OUT, clean),
    path.join(OUT, `${clean}.html`),
    path.join(OUT, clean, "index.html"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function startServer() {
  const server = http.createServer((req, res) => {
    const file = resolveFile(req.url ?? "/");
    if (!file) {
      res.statusCode = 404;
      res.end("not found");
      return;
    }
    res.setHeader("Content-Type", MIME[path.extname(file)] ?? "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

/** Runs inside the page. `scopeSelector` restricts the audit to one element. */
function collect(scopeSelector) {
  const scopeEl = scopeSelector ? document.querySelector(scopeSelector) : null;
  if (scopeSelector && !scopeEl) return null;

  const root = scopeEl ?? document.body;
  const vw = document.documentElement.clientWidth;
  const scopeRect = scopeEl?.getBoundingClientRect();
  const boundaryRight = scopeEl ? (scopeRect?.right ?? vw) : vw;

  const issues = [];

  const isHidden = (el) => {
    if (el.closest('.sr-only, [hidden], [aria-hidden="true"], [data-state="closed"]')) {
      return true;
    }
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return true;
    if (style.clip === "rect(0px, 0px, 0px, 0px)" || style.clipPath === "inset(50%)") {
      return true;
    }
    if (
      typeof el.checkVisibility === "function" &&
      !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
    ) {
      return true;
    }
    return false;
  };

  const describe = (el) => {
    const parts = [];
    let node = el;
    for (let i = 0; node && node !== document.body && i < 4; i += 1) {
      let name = node.tagName.toLowerCase();
      const slot = node.getAttribute?.("data-slot");
      if (slot) name += `[${slot}]`;
      const cls = (node.getAttribute?.("class") ?? "")
        .split(/\s+/)
        .filter((c) => c && !c.includes(":"))
        .slice(0, 2)
        .map((c) => `.${c}`)
        .join("");
      parts.unshift(name + cls);
      node = node.parentElement;
    }
    return parts.join(" > ");
  };

  const snippet = (el) =>
    (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 70);

  const withinScrollable = (el) => {
    let parent = el.parentElement;
    while (parent && parent !== root.parentElement) {
      const style = getComputedStyle(parent);
      if (style.overflowX === "auto" || style.overflowX === "scroll") return true;
      parent = parent.parentElement;
    }
    return false;
  };

  for (const el of root.querySelectorAll("*")) {
    if (isHidden(el)) continue;

    const style = getComputedStyle(el);
    if (style.position === "fixed") continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const scrollsX = style.overflowX === "auto" || style.overflowX === "scroll";
    const clipsX = style.overflowX === "hidden" || style.overflowX === "clip";

    if (
      clipsX &&
      !scrollsX &&
      el.scrollWidth - el.clientWidth > 2 &&
      style.textOverflow !== "ellipsis"
    ) {
      issues.push({
        kind: "clipped",
        el: describe(el),
        px: el.scrollWidth - el.clientWidth,
        text: snippet(el),
      });
    }

    if (rect.right > boundaryRight + 1 && !scrollsX && !withinScrollable(el)) {
      issues.push({
        kind: "outside",
        el: describe(el),
        px: Math.round(rect.right - boundaryRight),
        text: snippet(el),
      });
    }
  }

  const overflowHost = scopeEl ?? document.documentElement;
  return {
    vw,
    pageOverflow: Math.max(0, overflowHost.scrollWidth - overflowHost.clientWidth),
    issues,
  };
}

async function auditPage(page, label, url, width, height, scope) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(BASE + url, { waitUntil: "networkidle2", timeout: 45000 });
  await sleep(700);

  const result = await page.evaluate(collect, scope ?? null);
  if (!result) return null;
  return { label, url, width, ...result };
}

function dedupe(issues) {
  const seen = new Set();
  const out = [];
  for (const issue of issues) {
    const key = `${issue.kind}|${issue.el}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(issue);
  }
  return out;
}

async function main() {
  if (!fs.existsSync(OUT)) {
    console.error("No out/ directory. Run `npm run build` first.");
    process.exit(1);
  }

  const server = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const findings = [];
  try {
    const page = await browser.newPage();
    page.on("pageerror", () => {});

    for (const route of ROUTES) {
      for (const [width, height] of VIEWPORTS) {
        const result = await auditPage(page, "route", route, width, height);
        if (result && (result.pageOverflow > 0 || result.issues.length > 0)) {
          findings.push(result);
        }
      }
    }

    for (const [width, height] of [[320, 720], [390, 844]]) {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle2" });
      await sleep(500);
      const trigger = await page.$('[data-slot="sidebar-trigger"]');
      if (trigger) {
        await trigger.click();
        await sleep(700);
        const result = await page.evaluate(collect, '[data-slot="sheet-content"]');
        if (result && (result.pageOverflow > 0 || result.issues.length > 0)) {
          findings.push({ label: "sidebar-sheet", width, ...result });
        }
      }
    }

    for (const [width, height] of [[320, 720], [390, 844], [1280, 800]]) {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.goto(`${BASE}/applications`, { waitUntil: "networkidle2" });
      await sleep(600);
      const clicked = await page.evaluate(() => {
        const target = [...document.querySelectorAll("button")].find((b) =>
          /neue bewerbung/i.test(b.textContent ?? ""),
        );
        if (target) {
          target.click();
          return true;
        }
        return false;
      });
      if (clicked) {
        await sleep(700);
        const result = await page.evaluate(collect, '[role="dialog"]');
        if (result && (result.pageOverflow > 0 || result.issues.length > 0)) {
          findings.push({ label: "dialog-neue-bewerbung", width, ...result });
        }
      }
    }

    // Command palette (Ctrl+K)
    for (const [width, height] of [[320, 720], [768, 1024], [1440, 900]]) {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle2" });
      await sleep(500);
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyK");
      await page.keyboard.up("Control");
      await sleep(800);
      const result = await page.evaluate(collect, '[role="dialog"]');
      if (result && (result.pageOverflow > 0 || result.issues.length > 0)) {
        findings.push({ label: "command-palette", width, ...result });
      }
      await page.keyboard.press("Escape");
    }

    // Detail page tabs
    for (const [width, height] of [[320, 720], [768, 1024], [1440, 900]]) {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.goto(`${BASE}/applications/detail?id=app-001`, { waitUntil: "networkidle2" });
      await sleep(700);
      for (const tab of ["E-Mail-Verlauf", "Recherche", "Interview"]) {
        const ok = await page.evaluate((label) => {
          const el = [...document.querySelectorAll('[role="tab"]')].find((t) =>
            (t.textContent ?? "").includes(label),
          );
          if (el) {
            el.click();
            return true;
          }
          return false;
        }, tab);
        if (!ok) continue;
        await sleep(600);
        const result = await page.evaluate(collect, '[role="tabpanel"]');
        if (result && (result.pageOverflow > 0 || result.issues.length > 0)) {
          findings.push({ label: `tab-${tab}`, width, ...result });
        }
      }
    }

    // Reply / follow-up dialog
    for (const [width, height] of [[320, 720], [1280, 800]]) {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.goto(`${BASE}/applications/detail?id=app-001`, { waitUntil: "networkidle2" });
      await sleep(700);
      const clicked = await page.evaluate(() => {
        const target = [...document.querySelectorAll("button")].find((b) =>
          /antwort verfassen|nachfassen/i.test(b.textContent ?? ""),
        );
        if (target) {
          target.click();
          return true;
        }
        return false;
      });
      if (clicked) {
        await sleep(700);
        const result = await page.evaluate(collect, '[role="dialog"]');
        if (result && (result.pageOverflow > 0 || result.issues.length > 0)) {
          findings.push({ label: "reply-dialog", width, ...result });
        }
        await page.keyboard.press("Escape");
      }
    }

    // Filters popover + bulk action toolbar
    for (const [width, height] of [[320, 720], [1280, 800]]) {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.goto(`${BASE}/applications`, { waitUntil: "networkidle2" });
      await sleep(600);
      const filterClicked = await page.evaluate(() => {
        const target = [...document.querySelectorAll("button")].find((b) =>
          /filter/i.test(b.textContent ?? ""),
        );
        if (target) {
          target.click();
          return true;
        }
        return false;
      });
      if (filterClicked) {
        await sleep(600);
        const result = await page.evaluate(collect, '[data-slot="popover-content"]');
        if (result && (result.pageOverflow > 0 || result.issues.length > 0)) {
          findings.push({ label: "filters-popover", width, ...result });
        }
        await page.keyboard.press("Escape");
        await sleep(300);
      }
      const bulkClicked = await page.evaluate(() => {
        const box = document.querySelector('[data-slot="checkbox"]');
        if (box) {
          box.click();
          return true;
        }
        return false;
      });
      if (bulkClicked) {
        await sleep(500);
        const result = await page.evaluate(collect, "body");
        if (result && (result.pageOverflow > 0 || result.issues.length > 0)) {
          findings.push({ label: "bulk-toolbar", width, ...result });
        }
      }
    }

  } finally {
    await browser.close();
    server.close();
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(findings, null, 2));
    return;
  }

  if (findings.length === 0) {
    console.log("\n✅ No overflow issues detected across all routes and viewports.");
    return;
  }

  console.log(`\n⚠️  ${findings.length} page/viewport combinations with issues:\n`);
  for (const finding of findings) {
    const where = finding.url
      ? `${finding.url} @ ${finding.width}px`
      : `${finding.label} @ ${finding.width}px`;
    console.log(`── ${where}  (overflow: ${finding.pageOverflow}px)`);
    for (const issue of dedupe(finding.issues).slice(0, 12)) {
      console.log(`   [${issue.kind} +${issue.px}px] ${issue.el}`);
      if (issue.text) console.log(`        "${issue.text}"`);
    }
    if (dedupe(finding.issues).length > 12) {
      console.log(`   … and ${dedupe(finding.issues).length - 12} more`);
    }
    console.log();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
