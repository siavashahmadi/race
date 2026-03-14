import puppeteer, { Browser } from "puppeteer";
import { v4 as uuidv4 } from "uuid";
import { setCache } from "./print-cache";
import type { ResumeState } from "../types";

const launchArgs = ["--no-sandbox", "--disable-setuid-sandbox"];

async function getBrowser(): Promise<Browser> {
  if (process.env.NODE_ENV === "production") {
    if (!(globalThis as Record<string, unknown>).__prodBrowser) {
      (globalThis as Record<string, unknown>).__prodBrowser =
        await puppeteer.launch({ args: launchArgs });
    }
    return (globalThis as Record<string, unknown>).__prodBrowser as Browser;
  }
  // Dev mode: store on globalThis to survive hot reloads
  if (!(globalThis as Record<string, unknown>).__browser) {
    (globalThis as Record<string, unknown>).__browser = await puppeteer.launch({
      args: launchArgs,
    });
  }
  return (globalThis as Record<string, unknown>).__browser as Browser;
}

export async function generatePDF(state: ResumeState): Promise<Buffer> {
  const id = uuidv4();
  setCache(id, state);

  const baseUrl = process.env.PRINT_BASE_URL || "http://localhost:3000";
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(`${baseUrl}/print?id=${id}`, {
      waitUntil: "networkidle0",
      timeout: 15000,
    });

    // Wait for fonts to load
    await page.evaluateHandle("document.fonts.ready");

    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

// Graceful shutdown
if (typeof process !== "undefined") {
  const cleanup = async () => {
    const browser = (globalThis as Record<string, unknown>).__browser as
      | Browser
      | undefined;
    const prodBrowser = (globalThis as Record<string, unknown>)
      .__prodBrowser as Browser | undefined;
    if (browser) await browser.close().catch(() => {});
    if (prodBrowser) await prodBrowser.close().catch(() => {});
  };
  process.on("exit", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
