/**
 * Builds the static GitHub Pages demo into demo-dist/: the real storefront components and CSS,
 * with next/link and next/image swapped for plain HTML and the API answered in the browser.
 */
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const out = "demo-dist";
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

await build({
  entryPoints: ["demo/main.tsx"],
  outfile: `${out}/app.js`,
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
  jsx: "automatic",
  tsconfig: "tsconfig.json",
  alias: { "next/link": "./demo/shims/link.tsx", "next/image": "./demo/shims/image.tsx" },
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "none",
  logLevel: "warning",
});

const from = "src/app/globals.css";
const source = `${await readFile(from, "utf8")}\n${await readFile("demo/demo.css", "utf8")}`;
const css = await postcss([tailwind({ optimize: { minify: true } })]).process(source, { from, to: `${out}/app.css` });
await writeFile(`${out}/app.css`, css.css);

await copyFile("demo/index.html", `${out}/index.html`);
await copyFile("public/icon.svg", `${out}/icon.svg`);
await writeFile(`${out}/.nojekyll`, "");
console.log(`Demo built in ${out}/`);
