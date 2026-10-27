#!/usr/bin/env node
// Generator website joki statis: HTML + CSS + JavaScript saja, tanpa server.
// Edit site.config.json lalu jalankan: node generator.js  -> hasil di folder dist/
// Di GitHub, workflow deploy.yml menjalankan ini otomatis setiap kali kamu commit.

const fs = require("fs");
const path = require("path");

const cfg = JSON.parse(fs.readFileSync(process.argv[2] || "site.config.json", "utf8"));
const OUT = "dist";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "layanan";

const colors = Object.assign(
  { bg: "#14201e", panel: "#1d2e2a", line: "#2e4540", text: "#e7f0ed", muted: "#9db3ad", accent: "#6ee0b0", ink: "#0b1a16" },
  cfg.colors || {}
);
const cats = (cfg.categories || []).map((c) =>
  Object.assign({}, c, { slug: c.slug || slug(c.title), packages: c.packages || [] })
);
const prefix = (String(cfg.name).replace(/[^A-Za-z]/g, "").slice(0, 3) || "ORD").toUpperCase();
const wa = String(cfg.whatsapp || "").replace(/\D/g, "");
const waHello = "https://wa.me/" + wa + "?text=" + encodeURIComponent("Halo admin " + cfg.name + ", saya mau tanya soal layanan.");
const paragraphs = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// ---------- Kerangka halaman ----------
function layout(file, title, desc, body) {
  const links = [["index.html", "Beranda"]]
    .concat(cats.map((c) => [c.slug + ".html", c.title]))
    .concat([["tentang.html", "Tentang"]]);
  const nav = links
    .map(([href, label]) => `<a href="${href}"${href === file ? ' aria-current="page"' : ""}>${esc(label)}</a>`)
    .join("");
  const fullTitle = title === cfg.name ? title : title + " | " + cfg.name;
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="${colors.bg}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="top"><div class="top-in">
<a class="brand" href="index.html">${esc(cfg.name)}${cfg.verified ? '<span class="badge">Terverifikasi</span>' : ""}</a>
<nav class="nav" aria-label="Menu utama">${nav}</nav>
<div class="top-act"><a class="btn small ghost" href="antrian.html">Cek pesanan</a><a class="btn small" href="order.html">Pesan</a></div>
</div></header>
<main>
${body}
</main>
<footer>&copy; ${new Date().getFullYear()} ${esc(cfg.name)}. Semua hak dilindungi.</footer>
<a class="chat" href="${waHello}" target="_blank" rel="noopener" aria-label="Chat admin lewat WhatsApp">
<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
Chat admin</a>
<script src="app.js"></script>
</body>
</html>
`;
}

// ---------- Isi halaman ----------
function homeBody() {
  const first = cats[0] ? cats[0].slug + ".html" : "order.html";
  const rows = cats
    .map(
      (c) => `<li><a href="${c.slug}.html"><span><strong>${esc(c.title)}</strong><small>${esc(c.desc || "")}</small></span><em>${c.packages.length} paket</em></a></li>`
    )
    .join("");
  const hl = (cfg.highlights || [])
    .map((h) => `<div><dt>${esc(h.title)}</dt><dd>${esc(h.text)}</dd></div>`)
    .join("");
  return `<section class="hero">
<div>
<h1>${esc(cfg.headline || cfg.name)}</h1>
<p class="lead">${esc(cfg.tagline || "")}</p>
<a class="btn" href="${first}">Lihat paket</a>
</div>
<form class="check" action="antrian.html" method="get">
<label for="hid">Sudah pesan? Cek status pesananmu</label>
<input id="hid" name="id" placeholder="Contoh: ${prefix}-LX2K9" required autocomplete="off">
<button class="btn" type="submit">Cek pesanan</button>
</form>
</section>
<section class="block"><h2>Layanan</h2><ul class="links">${rows}</ul></section>
${hl ? `<section class="block"><h2>Keunggulan</h2><dl class="facts">${hl}</dl></section>` : ""}`;
}

function catBody(c) {
  const rows = c.packages
    .map(
      (p, i) => `<li><div class="row-main"><strong>${esc(p.name)}</strong><span>${esc(p.note || "")}</span></div><b class="price">${esc(p.price)}</b><a class="btn small" href="order.html?cat=${c.slug}&amp;pkg=${i}">Pesan</a></li>`
    )
    .join("");
  return `<section class="block">
<h1>${esc(c.title)}</h1>
<p class="lead">${esc(c.desc || "")}</p>
${rows ? `<ul class="rows">${rows}</ul>` : `<p>Paket belum tersedia. Tanya admin lewat tombol Chat admin.</p>`}
</section>`;
}

function aboutBody() {
  return `<section class="block narrow">
<h1>Tentang ${esc(cfg.name)}</h1>
${paragraphs(cfg.about).map((p) => `<p class="lead">${esc(p)}</p>`).join("")}
<a class="btn" href="${waHello}" target="_blank" rel="noopener">Hubungi admin</a>
</section>`;
}

function orderBody() {
  const qris = cfg.qris
    ? `<figure class="qris"><img src="${esc(cfg.qris)}" alt="QRIS pembayaran"><figcaption>Bayar lewat QRIS, lalu kirim bukti bayar ke admin.</figcaption></figure>`
    : "";
  return `<section class="block narrow">
<h1>Buat pesanan</h1>
<p class="lead">Isi data di bawah. Pesananmu dikirim ke admin lewat WhatsApp.</p>
<form id="order-form" class="form">
<label>Layanan<select name="cat" id="f-cat"></select></label>
<label>Paket<select name="pkg" id="f-pkg"></select></label>
<label>Nama<input name="nama" required autocomplete="name"></label>
<label>Kontak atau ID akun<input name="kontak" required></label>
<label>Catatan<textarea name="catatan" rows="3"></textarea></label>
<button class="btn" type="submit">Buat pesanan</button>
</form>
<div id="order-result" class="result" hidden>
<h2>Pesanan dibuat</h2>
<p>ID pesanan: <strong id="order-id"></strong></p>
<p>Simpan ID ini untuk cek status. Kirim pesanan ke admin supaya diproses.</p>
<a id="wa-send" class="btn" target="_blank" rel="noopener">Kirim lewat WhatsApp</a>
${qris}
</div>
</section>`;
}

function queueBody() {
  return `<section class="block narrow">
<h1>Cek pesanan</h1>
<p class="lead">Masukkan ID pesanan untuk melihat statusnya.</p>
<form id="check-form" class="form">
<label>ID pesanan<input id="check-id" placeholder="${prefix}-XXXXX" required autocomplete="off"></label>
<button class="btn" type="submit">Cek status</button>
</form>
<div id="check-out" class="result" hidden></div>
<h2>Pesanan di perangkat ini</h2>
<ul id="local-list" class="rows"></ul>
</section>`;
}

// ---------- CSS ----------
const CSS = `:root{--bg:${colors.bg};--panel:${colors.panel};--line:${colors.line};--text:${colors.text};--muted:${colors.muted};--accent:${colors.accent};--ink:${colors.ink}}
*{box-sizing:border-box;margin:0}
html{-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--text);font:16px/1.6 "Plus Jakarta Sans",system-ui,sans-serif}
a{color:inherit}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.top{position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--line)}
.top-in{max-width:960px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.brand{font-weight:800;font-size:1.2rem;text-decoration:none;display:flex;align-items:center;gap:8px}
.badge{font-size:.7rem;font-weight:600;color:var(--ink);background:var(--accent);padding:2px 8px;border-radius:99px}
.nav{display:flex;gap:4px;overflow-x:auto;flex:1 1 100%;order:3;scrollbar-width:none}
.nav a{padding:6px 12px;border-radius:8px;text-decoration:none;color:var(--muted);white-space:nowrap}
.nav a[aria-current],.nav a:hover{color:var(--text);background:var(--panel)}
.top-act{display:flex;gap:8px;margin-left:auto}
@media(min-width:760px){.nav{flex:1;order:0}.top-act{margin-left:0}}
main{max-width:960px;margin:0 auto;padding:24px 16px 96px}
.btn{display:inline-block;background:var(--accent);color:var(--ink);font:inherit;font-weight:700;border:0;border-radius:10px;padding:11px 20px;text-decoration:none;cursor:pointer}
.btn.small{padding:7px 14px;font-size:.9rem}
.btn.ghost{background:transparent;color:var(--text);border:1px solid var(--line)}
h1{font-size:clamp(1.9rem,6vw,3rem);line-height:1.12;letter-spacing:-.02em;margin-bottom:12px}
h2{font-size:1.3rem;margin-bottom:12px}
.lead{color:var(--muted);max-width:60ch;margin-bottom:20px}
.muted{color:var(--muted)}
.hero{display:grid;gap:28px;padding:24px 0 36px}
@media(min-width:760px){.hero{grid-template-columns:1.3fr 1fr;align-items:center}}
.check{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px;display:grid;gap:12px}
.check label{font-weight:600}
input,select,textarea{width:100%;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:11px 12px;font:inherit}
.block{padding:20px 0}
.narrow{max-width:560px}
.links{list-style:none;padding:0}
.links a{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid var(--line);text-decoration:none}
.links a:hover strong{color:var(--accent)}
.links small{display:block;color:var(--muted)}
.links em{font-style:normal;color:var(--muted);white-space:nowrap}
.facts div{padding:12px 0 12px 16px;border-left:3px solid var(--accent);margin-bottom:12px}
.facts dt{font-weight:700}
.facts dd{color:var(--muted)}
.rows{list-style:none;padding:0}
.rows li{display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--line)}
.row-main span{display:block;color:var(--muted);font-size:.9rem}
.price{color:var(--accent);white-space:nowrap}
.form{display:grid;gap:14px;margin-bottom:24px}
.form label{display:grid;gap:6px;font-weight:600}
.result{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px;margin-bottom:24px;display:grid;gap:10px;justify-items:start}
.status{font-size:1.4rem;font-weight:800;color:var(--accent)}
.qris{margin-top:8px}
.qris img{max-width:260px;width:100%;border-radius:10px;background:#fff;padding:8px}
.qris figcaption{color:var(--muted);font-size:.9rem;margin-top:6px}
footer{border-top:1px solid var(--line);padding:20px 16px;text-align:center;color:var(--muted);font-size:.9rem}
.chat{position:fixed;right:16px;bottom:16px;display:flex;gap:8px;align-items:center;background:var(--accent);color:var(--ink);padding:12px 16px;border-radius:99px;font-weight:700;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.35)}
`;

// ---------- JavaScript sisi pengunjung (tanpa backtick agar aman di String.raw) ----------
const APP = String.raw`(function () {
  var S = window.SITE;
  function $(s) { return document.querySelector(s); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  var KEY = "orders:" + S.prefix;
  function getOrders() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function saveOrder(o) {
    var l = getOrders(); l.unshift(o);
    try { localStorage.setItem(KEY, JSON.stringify(l.slice(0, 30))); } catch (e) {}
  }
  function wa(text) { return "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(text); }
  function findCat(slug) { return S.categories.filter(function (c) { return c.slug === slug; })[0]; }

  // Halaman pesan
  var form = $("#order-form");
  if (form) {
    var catSel = $("#f-cat"), pkgSel = $("#f-pkg");
    S.categories.forEach(function (c) { catSel.appendChild(new Option(c.title, c.slug)); });
    var fillPkgs = function () {
      var c = findCat(catSel.value);
      pkgSel.innerHTML = "";
      (c ? c.packages : []).forEach(function (p, i) { pkgSel.appendChild(new Option(p.name + " - " + p.price, i)); });
    };
    var q = new URLSearchParams(location.search);
    if (q.get("cat")) catSel.value = q.get("cat");
    fillPkgs();
    if (q.get("pkg")) pkgSel.value = q.get("pkg");
    catSel.addEventListener("change", fillPkgs);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var c = findCat(f.get("cat"));
      var p = c && c.packages[+f.get("pkg")];
      if (!p) { alert("Pilih paket dulu."); return; }
      var id = S.prefix + "-" + Date.now().toString(36).toUpperCase();
      var o = { id: id, nama: f.get("nama"), kontak: f.get("kontak"), layanan: c.title, paket: p.name, harga: p.price, catatan: f.get("catatan") || "-" };
      saveOrder(o);
      var text = [
        "Halo admin " + S.name + ", saya mau pesan:",
        "ID pesanan: " + id,
        "Layanan: " + o.layanan,
        "Paket: " + o.paket + " (" + o.harga + ")",
        "Nama: " + o.nama,
        "Kontak/ID akun: " + o.kontak,
        "Catatan: " + o.catatan
      ].join("\n");
      $("#order-id").textContent = id;
      $("#wa-send").href = wa(text);
      form.hidden = true;
      $("#order-result").hidden = false;
      window.scrollTo(0, 0);
    });
  }

  // Halaman cek pesanan
  var check = $("#check-form");
  if (check) {
    var out = $("#check-out"), input = $("#check-id"), list = $("#local-list");
    var show = function (nodes) {
      out.hidden = false; out.innerHTML = "";
      nodes.forEach(function (n) { out.appendChild(n); });
    };
    var askAdmin = function (id) {
      var a = el("a", "btn small", "Tanya admin lewat WhatsApp");
      a.href = wa("Halo admin " + S.name + ", saya mau cek pesanan dengan ID " + id);
      a.target = "_blank"; a.rel = "noopener";
      return a;
    };
    var lookup = function (raw) {
      var id = String(raw).trim().toUpperCase();
      if (!id) return;
      show([el("p", "", "Mencari pesanan...")]);
      fetch("orders.json?t=" + Date.now())
        .then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { return {}; })
        .then(function (data) {
          var remote = data[id];
          var local = getOrders().filter(function (o) { return o.id === id; })[0];
          if (remote) {
            var nodes = [el("p", "status", remote.status || "Diproses")];
            if (remote.note) nodes.push(el("p", "", remote.note));
            if (local) nodes.push(el("p", "muted", local.layanan + " - " + local.paket));
            nodes.push(askAdmin(id));
            show(nodes);
          } else if (local) {
            show([el("p", "status", "Menunggu admin"), el("p", "", "Pesanan " + id + " tercatat di perangkat ini. Admin belum memperbarui statusnya."), askAdmin(id)]);
          } else {
            show([el("p", "status", "ID tidak ditemukan"), el("p", "", "Periksa ID pesanan. Pastikan huruf dan angkanya sama."), askAdmin(id)]);
          }
        });
    };
    check.addEventListener("submit", function (e) { e.preventDefault(); lookup(input.value); });
    var orders = getOrders();
    if (!orders.length) list.appendChild(el("li", "muted", "Belum ada pesanan di perangkat ini."));
    orders.forEach(function (o) {
      var li = el("li");
      var main = el("div", "row-main");
      main.appendChild(el("strong", "", o.id));
      main.appendChild(el("span", "", o.layanan + " - " + o.paket));
      li.appendChild(main);
      li.appendChild(el("span"));
      var b = el("button", "btn small ghost", "Cek");
      b.type = "button";
      b.addEventListener("click", function () { input.value = o.id; lookup(o.id); });
      li.appendChild(b);
      list.appendChild(li);
    });
    var pre = new URLSearchParams(location.search).get("id");
    if (pre) { input.value = pre; lookup(pre); }
  }
})();
`;

// ---------- Tulis hasil ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const write = (name, content) => {
  fs.writeFileSync(path.join(OUT, name), content);
  console.log("OK", path.join(OUT, name));
};

const desc = cfg.description || cfg.tagline || cfg.name;
write("index.html", layout("index.html", cfg.name, desc, homeBody()));
cats.forEach((c) => write(c.slug + ".html", layout(c.slug + ".html", c.title, c.desc || desc, catBody(c))));
write("tentang.html", layout("tentang.html", "Tentang", desc, aboutBody()));
write("order.html", layout("order.html", "Buat pesanan", desc, orderBody()));
write("antrian.html", layout("antrian.html", "Cek pesanan", desc, queueBody()));
write("style.css", CSS);

const siteData = {
  name: cfg.name,
  prefix,
  whatsapp: wa,
  categories: cats.map((c) => ({ slug: c.slug, title: c.title, packages: c.packages.map((p) => ({ name: p.name, price: p.price })) })),
};
write("app.js", "window.SITE=" + JSON.stringify(siteData).replace(/</g, "\\u003c") + ";\n" + APP);

// Status pesanan: edit orders.json di repo untuk memperbarui, lalu commit.
write("orders.json", fs.existsSync("orders.json") ? fs.readFileSync("orders.json", "utf8") : "{}");
if (fs.existsSync("assets")) fs.cpSync("assets", path.join(OUT, "assets"), { recursive: true });

console.log("\nSelesai. Halaman dibuat di ./" + OUT);
