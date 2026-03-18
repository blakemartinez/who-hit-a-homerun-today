#!/usr/bin/env node
/**
 * screenshot-pr.mjs <previewUrl> <outputPath>
 * Takes a full-page screenshot of a Vercel preview URL using Playwright.
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";

const [, , previewUrl, outputPath] = process.argv;
if (!previewUrl || !outputPath) {
  console.error("Usage: screenshot-pr.mjs <previewUrl> <outputPath>");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

try {
  await page.goto(previewUrl, { waitUntil: "networkidle", timeout: 30000 });
  // Wait a beat for any animations/data to settle
  await page.waitForTimeout(2000);
  const buffer = await page.screenshot({ fullPage: false });
  writeFileSync(outputPath, buffer);
  console.log(`Screenshot saved to ${outputPath}`);
} finally {
  await browser.close();
}
