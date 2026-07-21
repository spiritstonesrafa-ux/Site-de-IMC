import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });

const [html, css, javascript, hosting] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("style.css", "utf8"),
  readFile("script.js", "utf8"),
  readFile(".openai/hosting.json", "utf8")
]);

const assets = JSON.stringify({
  "/": { body: html, type: "text/html; charset=utf-8" },
  "/index.html": { body: html, type: "text/html; charset=utf-8" },
  "/style.css": { body: css, type: "text/css; charset=utf-8" },
  "/script.js": { body: javascript, type: "text/javascript; charset=utf-8" }
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
        "cache-control": "no-cache",
        ...securityHeaders
      }
    });
  }
};
`;

await Promise.all([
  writeFile("dist/server/index.js", worker),
  writeFile("dist/.openai/hosting.json", hosting)
]);
