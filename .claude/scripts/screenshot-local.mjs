#!/usr/bin/env node
/**
 * screenshot-local.mjs <worktreeDir> <route> <outputPath>
 *
 * Builds the Next.js app in worktreeDir, starts the server, screenshots
 * the given route, then shuts everything down.
 *
 * Example:
 *   node screenshot-local.mjs /path/to/worktree /game /tmp/pr-5.png
 */

import { chromium } from "playwright";
import { execSync, spawn } from "child_process";
import { writeFileSync, rmSync } from "fs";
import { resolve } from "path";

const [, , worktreeDir, route, outputPath] = process.argv;
if (!worktreeDir || !route || !outputPath) {
  console.error("Usage: screenshot-local.mjs <worktreeDir> <route> <outputPath>");
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
  const buffer = await page.screenshot({ fullPage: false });
  writeFileSync(outputPath, buffer);
  console.log(`Screenshot saved to ${outputPath}`);
} finally {
  await browser.close();
  server.kill();
  // Clean up build artifacts
  rmSync(`${cwd}/.next`, { recursive: true, force: true });
}
