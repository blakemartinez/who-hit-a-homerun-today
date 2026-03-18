#!/usr/bin/env node
/**
 * screenshot-local.mjs <worktreeDir> <route> <outputPath> [--click <selector>]
 *
 * Builds the Next.js app in worktreeDir, starts the server, screenshots
 * the given route, then shuts everything down.
 *
 * Options:
 *   --click <selector>  CSS selector to click before taking the screenshot
 *
 * Examples:
 *   node screenshot-local.mjs /path/to/worktree /game /tmp/pr-5.png
 *   node screenshot-local.mjs /path/to/worktree / /tmp/pr-4.png --click "button[aria-label='What is this?']"
 */

import { chromium } from "playwright";
import { execSync, spawn } from "child_process";
import { writeFileSync, rmSync } from "fs";
import { resolve } from "path";

const args = process.argv.slice(2);
const clickIdx = args.indexOf("--click");
const clickSelector = clickIdx !== -1 ? args.splice(clickIdx, 2)[1] : null;
const [worktreeDir, route, outputPath] = args;

if (!worktreeDir || !route || !outputPath) {
  console.error("Usage: screenshot-local.mjs <worktreeDir> <route> <outputPath> [--click <selector>]");
  process.exit(1);
}

const cwd = resolve(worktreeDir);

// Pick a random high port to avoid conflicts with dev server
const port = 3100 + Math.floor(Math.random() * 400);

console.log(`Building in ${cwd}...`);
rmSync(`${cwd}/.next`, { recursive: true, force: true });

try {
  execSync("npm run build", { cwd, stdio: "inherit" });
} catch {
  console.error("Build failed");
  process.exit(1);
}

console.log(`Starting server on port ${port}...`);
const server = spawn("npx", ["next", "start", "-p", String(port)], {
  cwd,
  stdio: "pipe",
  detached: false,
});

// Wait for server to be ready (poll until 200)
const url = `http://localhost:${port}${route}`;
await new Promise((resolve, reject) => {
  const start = Date.now();
  const check = async () => {
    try {
      const res = await fetch(url);
      if (res.ok) return resolve();
    } catch {}
    if (Date.now() - start > 30000) return reject(new Error("Server timeout"));
    setTimeout(check, 500);
  };
  check();
});

console.log(`Server ready. Screenshotting ${url}...`);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500); // let animations settle
  if (clickSelector) {
    console.log(`Clicking selector: ${clickSelector}`);
    await page.click(clickSelector);
    await page.waitForTimeout(800); // let any modal/animation open
  }
  const buffer = await page.screenshot({ fullPage: false });
  writeFileSync(outputPath, buffer);
  console.log(`Screenshot saved to ${outputPath}`);
} finally {
  await browser.close();
  server.kill();
  // Clean up build artifacts
  rmSync(`${cwd}/.next`, { recursive: true, force: true });
}
