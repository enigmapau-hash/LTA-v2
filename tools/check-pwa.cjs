#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const legacyWorker = fs.readFileSync(path.join(__dirname, "fixtures", "sw-v12.js"), "utf8");
const cacheName = serviceWorker.match(/const CACHE_NAME = "([^"]+)";/)?.[1];
const previousCacheName = "lol-team-analyzer-v12";
const xlsxUrl = "/vendor/xlsx.full.min.js";

function validateInstallMetadata() {
  assert.equal(manifest.name, "League Team Analyzer");
  assert.equal(manifest.short_name, "League Analyzer");
  assert.doesNotMatch(manifest.description, /Excel/i);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, ".");
  assert.equal(manifest.scope, ".");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192" && icon.type === "image/png"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.type === "image/png"));
  assert.ok(cacheName, "El service worker debe declarar una caché versionada.");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  for (const [, script] of html.matchAll(/<script src="([^"]+)"/g)) {
    assert.ok(serviceWorker.includes(JSON.stringify("./" + script)),
      "Toda dependencia de la PWA debe estar precargada para el análisis offline: " + script);
  }
}

function createServer() {
  let serveCurrentWorker = false;
  const legacyAssetPaths = {
    "/shared-utils.js": "/src/utils/text.js",
    "/app.js": "/src/ui/app.js",
    "/version.js": "/src/ui/version.js",
    "/realtime-mode.js": "/src/ui/realtime-mode.js",
    "/smart-search.js": "/src/ui/smart-search.js",
    "/no-duplicate-options.js": "/src/ui/no-duplicate-options.js",
    "/selected-preview.js": "/src/ui/selected-preview.js",
    "/menu-icons.js": "/src/ui/menu-icons.js",
    "/result-summary.js": "/src/report/result-summary.js",
    "/result-summary.css": "/src/report/result-summary.css",
  };
  const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".xlsx": "application/octet-stream",
  };

  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname === "/__seed") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      response.end(`<!doctype html><script>
        caches.open(${JSON.stringify(previousCacheName)}).then(async (cache) => {
          await cache.put(new Request(location.origin + "/legacy-marker"), new Response("old cache"));
          location.replace("/");
        }).catch((error) => { document.body.textContent = String(error); });
      </script>`);
      return;
    }

    if (url.pathname === "/sw.js") {
      response.writeHead(200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-cache",
        "Service-Worker-Allowed": "/",
      });
      response.end(serveCurrentWorker ? serviceWorker : legacyWorker);
      return;
    }

    const pathname = decodeURIComponent(url.pathname);
    const servedPath =
      !serveCurrentWorker && legacyAssetPaths[pathname]
        ? legacyAssetPaths[pathname]
        : pathname;
    const filePath = path.resolve(root, "." + servedPath);
    const relative = path.relative(root, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.stat(filePath, (error, stats) => {
      const resolved = error || stats.isDirectory() ? path.join(filePath, "index.html") : filePath;
      fs.readFile(resolved, (readError, body) => {
        if (readError) {
          response.writeHead(404);
          response.end("Not found");
          return;
        }
        const type = mimeTypes[path.extname(resolved).toLowerCase()] || "application/octet-stream";
        response.writeHead(200, { "Content-Type": type });
        response.end(body);
      });
    });
  });

  return { server, setServeCurrentWorker: () => { serveCurrentWorker = true; } };
}

async function waitForBaseLoaded(page) {
  await page.locator("#top").click();
  await page.locator("#topMenu .picker-item").first().waitFor({
    state: "visible",
    timeout: 30_000,
  });
  const status = await page.locator("#statusPill").innerText();
  assert.notEqual(status, "Datos no disponibles", "La app debe cargar los datos de campeones.");
}

async function waitForCacheMigration(page, currentCacheName) {
  const deadline = Date.now() + 30_000;
  let names = [];
  while (Date.now() < deadline) {
    names = await page.evaluate(() => caches.keys());
    if (names.includes(currentCacheName) && !names.includes(previousCacheName)) {
      return names;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("No se completó la migración desde " + previousCacheName + " a " + currentCacheName + ": " + JSON.stringify(names));
}

async function main() {
  validateInstallMetadata();
  const { server, setServeCurrentWorker } = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  let browser;

  try {
    const launchOptions = { headless: true };
    if (process.env.LTA_CHROMIUM_PATH) launchOptions.executablePath = process.env.LTA_CHROMIUM_PATH;
    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({ serviceWorkers: "allow" });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    // Begin with a v12 installation. The updated worker must replace it and delete its cache.
    await page.goto(`${origin}/__seed`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(`${origin}/`);
    await waitForBaseLoaded(page);
    const iconDimensions = await page.evaluate(async () => {
      const data = await (await fetch("manifest.json")).json();
      return Promise.all(data.icons.filter((icon) => icon.type === "image/png").map((icon) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
          image.onerror = reject;
          image.src = icon.src;
        })
      ));
    });
    assert.deepEqual(iconDimensions, [[192, 192], [512, 512]], "Los iconos declarados deben existir con sus dimensiones reales.");
    await page.waitForFunction(
      () => Boolean(navigator.serviceWorker.controller),
      null,
      { timeout: 15_000 }
    );

    const beforeUpdate = await page.evaluate(async () => ({
      cacheNames: await caches.keys(),
      worker: (await navigator.serviceWorker.ready).active?.scriptURL,
    }));
    assert.ok(beforeUpdate.cacheNames.includes(previousCacheName), "La instalación antigua v12 debe estar activa al inicio de la prueba.");

    setServeCurrentWorker();
    await page.evaluate(async () => (await navigator.serviceWorker.ready).update());
    await waitForCacheMigration(page, cacheName);

    const parserCache = await page.evaluate(async ({ current, url }) => {
      const names = await caches.keys();
      const cacheEntries = await Promise.all(names.map(async (name) => [
        name,
        (await caches.open(name)).keys().then((keys) => keys.map((request) => request.url)),
      ]));
      const currentCache = await caches.open(current);
      const keys = await currentCache.keys();
      const key = keys.find((request) => request.url === new URL(url, location.origin).href);
      const response = key ? await currentCache.match(key) : null;
      return {
        type: response?.type || null,
        status: response?.status ?? null,
        cachedUrls: keys.map((request) => request.url),
        cacheNames: names,
        allEntries: await Promise.all(cacheEntries.map(async ([name, entries]) => [name, await entries])),
        controller: navigator.serviceWorker.controller?.scriptURL,
      };
    }, { current: cacheName, url: xlsxUrl });
    assert.ok(parserCache.type, "SheetJS debe estar guardado en la caché nueva: " + JSON.stringify(parserCache));
    assert.equal(parserCache.status, 200, "SheetJS debe servirse desde la caché local.");
    assert.ok(parserCache.cachedUrls.includes(new URL("/src/data/role-viability-26-21.js", origin).href),
      "La evidencia de posiciones se instala en la caché offline.");

    // A controlled reload with the network disconnected must load the workbook and picker.
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForBaseLoaded(page);
    const firstOption = page.locator("#topMenu .picker-item").first();
    await firstOption.waitFor({ state: "visible", timeout: 15_000 });
    await firstOption.click();
    const selected = await page.locator("#top").inputValue();
    assert.ok(selected, "El selector debe permitir elegir un campeón sin conexión.");
    const resultChampion = page.locator("#result .champion-name").first();
    await resultChampion.waitFor({ state: "visible", timeout: 5_000 });
    await page.waitForFunction((name) => document.querySelector("#result .champion-name")?.textContent.trim() === name, selected);
    assert.equal(await resultChampion.innerText(), selected, "El resultado debe reflejar el campeón elegido sin conexión.");
    assert.deepEqual(await page.evaluate(() => ({
      patch: window.LTARoleViability.PATCH,
      dianaTop: window.LTARoleViability.assess("Diana", "top").status,
    })), { patch: "26.21", dianaTop: "experimental" }, "La viabilidad está disponible sin red.");
    const offlinePicks = { top: "Diana", jungle: "Sejuani", mid: "Orianna", adc: "Jinx", support: "Lulu" };
    for (const [role, champion] of Object.entries(offlinePicks)) {
      await page.locator("#" + role).fill(champion);
    }
    await page.waitForFunction((expected) =>
      [...document.querySelectorAll(".composition-table .champion-name")]
        .map((node) => node.textContent.trim()).join("|") === expected.join("|"), Object.values(offlinePicks));
    await page.locator(".result-summary__strategy").waitFor({ state: "visible" });
    assert.equal(await page.locator(".result-summary__candidate-role").count(),0,
      "El draft manual experimental es válido sin forzar una sustitución");
    assert.equal(await page.locator(".result-summary__ban-integration li").count(),3,
      "Los bans siguen disponibles offline al abstenerse");
    const engagePicks = { top: "Fiora", jungle: "Elise", mid: "Xerath", adc: "Draven", support: "Lulu" };
    for (const [role, champion] of Object.entries(engagePicks)) {
      await page.locator("#" + role).fill(champion);
    }
    await page.waitForFunction((expected) =>
      [...document.querySelectorAll(".composition-table .champion-name")]
        .map((node) => node.textContent.trim()).join("|") === expected.join("|"), Object.values(engagePicks));
    const recommendation = page.locator(".result-summary__recommendation-list");
    await recommendation.waitFor({ state: "visible" });
    assert.ok(await recommendation.locator(":scope > li").count()>=2,
      "La brecha de cohesión explícita conserva candidatos razonados offline");
    const recommendedPairs = await recommendation.locator(":scope > li").evaluateAll(entries =>
      entries.map(entry => ({
        champion: entry.querySelector("strong")?.textContent?.trim(),
        role: entry.querySelector(".result-summary__candidate-role")?.textContent?.trim(),
      })));
    assert.ok(recommendedPairs.every(pair => !/Experimental/i.test(pair.role)),
      "Nunca se proponen roles experimentales");
    // Leaving the edited picker can redraw the unchanged table. The report must
    // still be present before opening its explanations.
    await page.locator("h1").click();
    await recommendation.waitFor({ state: "visible" });
    for (const alternative of await recommendation.locator(".result-summary__candidate-more").all()) {
      await alternative.locator(":scope > summary").click();
    }
    const explanations = recommendation.locator(".result-summary__candidate-justification");
    assert.equal(await explanations.count(), await recommendation.locator(":scope > li").count(),
      "Cada candidato final conserva su explicación respaldada offline.");
    for (const explanation of await explanations.all()) await explanation.locator("summary").click();
    assert.match(await recommendation.innerText(), /Señales del catálogo:/, "La evidencia real llega al informe offline");
    assert.doesNotMatch(await recommendation.innerText(), /acorde con el perfil/, "Sin repetir el nombre del perfil");
    assert.match(await recommendation.innerText(), /Contribuye a corregir/, "Solo una brecha explícita justifica la corrección");
    assert.equal(await recommendation.locator(".result-summary__beneficiaries").count(),0, "No inventa conexiones con aliados cuando faltan señales comunes");
    assert.match(await page.locator(".result-summary__detected-need").innerText(), /Carencia detectada:/);
    assert.deepEqual(pageErrors, [], "La app no debe lanzar errores JavaScript durante la carga o el uso offline.");

    console.log("PWA validada: instalación, actualización desde v12, caché de SheetJS y viabilidad 26.21, selección experimental manual y recomendaciones completas offline.");
    await context.close();
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
