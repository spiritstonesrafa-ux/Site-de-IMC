import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const fromRoot = (path) => resolve(root, path);

await rm(fromRoot("dist"), { recursive: true, force: true });
await mkdir(fromRoot("dist/server"), { recursive: true });
await mkdir(fromRoot("dist/.openai"), { recursive: true });

const [html, css, javascript, whoGrowth, growthData, hosting] = await Promise.all([
  readFile(fromRoot("index.html"), "utf8"),
  readFile(fromRoot("style.css"), "utf8"),
  readFile(fromRoot("script.js"), "utf8"),
  readFile(fromRoot("who-growth.js"), "utf8"),
  readFile(fromRoot("growth-data.js"), "utf8"),
  readFile(fromRoot(".openai/hosting.json"), "utf8")
]);

const assets = JSON.stringify({
  "/": { body: html, type: "text/html; charset=utf-8" },
  "/index.html": { body: html, type: "text/html; charset=utf-8" },
  "/style.css": { body: css, type: "text/css; charset=utf-8" },
  "/script.js": { body: javascript, type: "text/javascript; charset=utf-8" },
  "/who-growth.js": { body: whoGrowth, type: "text/javascript; charset=utf-8" },
  "/growth-data.js": { body: growthData, type: "text/javascript; charset=utf-8" }
});

const worker = `const assets = ${assets};
const securityHeaders = {
  "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const asset = assets[url.pathname];

    if (!asset) {
      return new Response("Página não encontrada", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8", ...securityHeaders }
      });
    }

    return new Response(asset.body, {
      headers: {
        "content-type": asset.type,
        "cache-control": "no-store, max-age=0",
        ...securityHeaders
      }
    });
  }
};
`;

await Promise.all([
  writeFile(fromRoot("dist/server/index.js"), worker),
  writeFile(fromRoot("dist/.openai/hosting.json"), hosting)
]);
