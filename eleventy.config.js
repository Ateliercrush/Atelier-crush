import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import Image from "@11ty/eleventy-img";

let OUT = "_site";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// *mot* dans un texte = mot en italique rose
function inline(s) {
  return escapeHtml(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function placeholder(cls) {
  return `<div class="ph ${cls}" role="img" aria-label="Photo à venir"><span>Photo à venir</span></div>`;
}

function photo(src, alt = "", cls = "", sizes = "100vw", eager = false, widths = [480, 800, 1200, 1800]) {
  if (!src) return placeholder(cls);
  const file = path.join(".", decodeURI(String(src)).replace(/^\/+/, ""));
  if (!fs.existsSync(file)) {
    console.warn(`[photo] introuvable : ${src}`);
    return placeholder(cls);
  }
  const attrs = { alt, class: cls, sizes, loading: eager ? "eager" : "lazy", decoding: "async" };
  if (eager) attrs.fetchpriority = "high";
  if (/\.svg$/i.test(file)) {
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="${cls}" loading="lazy">`;
  }
  const options = {
    widths: [...widths, "auto"].filter((w, i, a) => a.indexOf(w) === i),
    formats: ["webp"],
    outputDir: path.join(OUT, "img"),
    urlPath: "/img/",
    sharpWebpOptions: { quality: 78 },
  };
  try {
    Image(file, options).catch((e) => console.warn(`[photo] ${src} : ${e.message}`));
    const meta = Image.statsSync(file, options);
    return Image.generateHTML(meta, attrs);
  } catch (e) {
    console.warn(`[photo] ${src} : ${e.message}`);
    return placeholder(cls);
  }
}

export default function (cfg) {
  cfg.on("eleventy.directories", (d) => { OUT = d.output; });
  cfg.addGlobalData("c", () => {
    const data = {};
    for (const f of fs.readdirSync("contenu")) {
      if (!/\.ya?ml$/.test(f)) continue;
      const key = f.replace(/\.ya?ml$/, "").replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      data[key] = yaml.load(fs.readFileSync(path.join("contenu", f), "utf8")) || {};
    }
    return data;
  });

  cfg.addFilter("inline", inline);
  cfg.addFilter("paras", (s) =>
    String(s ?? "")
      .trim()
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((p) => `<p>${inline(p.trim()).replace(/\n/g, "<br>")}</p>`)
      .join("")
  );
  cfg.addFilter("pad", (n) => String(n).padStart(2, "0"));
  cfg.addFilter("cle", (s) =>
    String(s ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
  cfg.addFilter("json", (v) => JSON.stringify(v));
  cfg.addFilter("noms", (refs) => (refs || []).map((r) => r.nom));
  cfg.addFilter("logoDe", (nom, refs) => (refs || []).find((r) => r.nom === nom) || { nom });

  cfg.addShortcode("photo", photo);

  cfg.addPassthroughCopy("assets");
  cfg.addPassthroughCopy({ "photos/logo-atelier-crush.png": "photos/logo-atelier-crush.png" });
  cfg.addWatchTarget("contenu/");
  cfg.addWatchTarget("assets/");

  cfg.ignores.add("README.md");
  cfg.ignores.add("node_modules/**");

  return {
    dir: { input: "pages", includes: "../_includes", output: OUT },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
  };
}
