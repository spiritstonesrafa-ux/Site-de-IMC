import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

// Recria a pasta de saída para não manter arquivos antigos entre builds.
await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });

// Os arquivos independentes são lidos em paralelo para agilizar o processo.
const [html, css, javascript, hosting] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("style.css", "utf8"),
  readFile("script.js", "utf8"),
  readFile(".openai/hosting.json", "utf8")
]);

// O conteúdo vira um mapa de rotas que será incorporado ao servidor gerado abaixo.
const assets = JSON.stringify({
  "/": { body: html, type: "text/html; charset=utf-8" },
  "/index.html": { body: html, type: "text/html; charset=utf-8" },
  "/style.css": { body: css, type: "text/css; charset=utf-8" },
  "/script.js": { body: javascript, type: "text/javascript; charset=utf-8" }
});

// O template cria um servidor mínimo: entrega os arquivos conhecidos e responde 404 aos demais.
const worker = `const assets = ${assets};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const asset = assets[url.pathname];

    if (!asset) {
      return new Response("Página não encontrada", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }

    return new Response(asset.body, {
      headers: {
        "content-type": asset.type,
        "cache-control": url.pathname === "/" || url.pathname === "/index.html"
          ? "no-cache"
          : "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff"
      }
    });
  }
};
`;

await Promise.all([
  writeFile("dist/server/index.js", worker),
  writeFile("dist/.openai/hosting.json", hosting)
]);
