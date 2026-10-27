#!/usr/bin/env node
// Website Generator: HTML + CSS + JS (+ opsional server Node.js)
// Pakai: node generator.js --title "Situsku" --color "#2563eb" --pages "Beranda,Tentang,Kontak" --server
// Atau lewat env: TITLE, COLOR, PAGES, DESC, WITH_SERVER=true

const fs = require("fs");
const path = require("path");

// ---------- Ambil opsi ----------
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf("--" + name);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const has = (name) => args.includes("--" + name);

const opts = {
  title: arg("title", process.env.TITLE || "Website Saya"),
  desc: arg("desc", process.env.DESC || "Dibuat otomatis dengan Website Generator"),
  color: arg("color", process.env.COLOR || "#2563eb"),
  pages: arg("pages", process.env.PAGES || "Beranda,Tentang,Kontak")
    .split(",").map((s) => s.trim()).filter(Boolean),
  server: has("server") || process.env.WITH_SERVER === "true",
  out: arg("out", "dist"),
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "halaman";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fileOf = (page, i) => (i === 0 ? "index.html" : `${slug(page)}.html`);

// ---------- Template ----------
const css = `:root{--primary:${opts.color};--bg:#f8fafc;--text:#0f172a;--card:#fff}
@media(prefers-color-scheme:dark){:root{--bg:#0b1120;--text:#e2e8f0;--card:#162033}}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
header{background:var(--primary);color:#fff;padding:14px 20px;position:sticky;top:0;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
header h1{font-size:1.2rem}
nav a{color:#fff;text-decoration:none;margin-right:14px;opacity:.85}
nav a.active,nav a:hover{opacity:1;text-decoration:underline}
main{max-width:800px;margin:0 auto;padding:24px 16px}
.card{background:var(--card);border-radius:14px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
button{background:var(--primary);color:#fff;border:0;padding:10px 18px;border-radius:10px;font-size:1rem;cursor:pointer}
input,textarea{width:100%;padding:10px;margin:6px 0 12px;border-radius:8px;border:1px solid #94a3b8;background:var(--card);color:var(--text)}
footer{text-align:center;padding:24px;opacity:.7;font-size:.9rem}
`;

const js = `document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("hello-btn");
  if (btn) btn.addEventListener("click", () => {
    document.getElementById("hello-out").textContent = "Halo! JavaScript berjalan 🎉";
  });
  const form = document.getElementById("contact-form");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const out = document.getElementById("form-out");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      out.textContent = r.ok ? "Pesan terkirim!" : "Gagal mengirim.";
    } catch { out.textContent = "Server belum aktif (mode statis)."; }
  });
});
`;

function pageBody(page, i) {
  const p = esc(page);
  if (i === 0)
    return `<div class="card"><h2>Selamat datang di ${esc(opts.title)}</h2><p>${esc(opts.desc)}</p><br><button id="hello-btn">Coba klik</button><p id="hello-out"></p></div>`;
  if (/kontak|contact/i.test(page))
    return `<div class="card"><h2>${p}</h2><form id="contact-form"><input name="nama" placeholder="Nama" required><textarea name="pesan" rows="4" placeholder="Pesan" required></textarea><button type="submit">Kirim</button><p id="form-out"></p></form></div>`;
  return `<div class="card"><h2>${p}</h2><p>Isi halaman ${p}. Edit sesuai kebutuhanmu.</p></div>`;
}

function html(page, i) {
  const nav = opts.pages
    .map((p, j) => `<a href="${fileOf(p, j)}"${j === i ? ' class="active"' : ""}>${esc(p)}</a>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page)} | ${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.desc)}">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header><h1>${esc(opts.title)}</h1><nav>${nav}</nav></header>
<main>${pageBody(page, i)}</main>
<footer>&copy; ${new Date().getFullYear()} ${esc(opts.title)}</footer>
<script src="script.js"></script>
</body>
</html>
`;
}

const serverJs = `// Server Node.js sederhana (tanpa dependensi). Jalankan: node server.js
const http = require("http"), fs = require("fs"), path = require("path");
const PORT = process.env.PORT || 3000;
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json" };

http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/contact") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => { console.log("Pesan masuk:", body); res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"ok":true}'); });
    return;
  }
  let file = req.url.split("?")[0];
  if (file === "/") file = "/index.html";
  const full = path.join(__dirname, "public", path.normalize(file));
  if (!full.startsWith(path.join(__dirname, "public"))) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); return res.end("404 Not Found"); }
    res.writeHead(200, { "Content-Type": types[path.extname(full)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => console.log("Server jalan di http://localhost:" + PORT));
`;

// ---------- Tulis file ----------
const write = (rel, content) => {
  const f = path.join(opts.out, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
  console.log("✔", f);
};

fs.rmSync(opts.out, { recursive: true, force: true });
const base = opts.server ? "public/" : "";
opts.pages.forEach((p, i) => write(base + fileOf(p, i), html(p, i)));
write(base + "style.css", css);
write(base + "script.js", js);
if (opts.server) {
  write("server.js", serverJs);
  write("package.json", JSON.stringify({ name: slug(opts.title), version: "1.0.0", scripts: { start: "node server.js" } }, null, 2));
}
console.log(`\nSelesai! ${opts.pages.length} halaman dibuat di ./${opts.out}`);
