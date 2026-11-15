import Papa from "papaparse";
import { parseRupeesToPaise } from "@/lib/money";

export const CSV_MAX_ROWS = 300;
export const CSV_MAX_BYTES = 512 * 1024;
export const CSV_TEMPLATE = [
  "name,price,category,description,variants,stock,featured",
  'Eggless chocolate truffle cake,,Cakes,Dark chocolate ganache on soft sponge,"1/2 kg:650 | 1 kg:1200",made to order,yes',
  "Ragi jaggery cookies (box of 12),220,Cookies,Crisp millet cookies,,25,no",
].join("\n");

export type ImportVariant = { label: string; pricePaise: number };
export type ImportRow = {
  line: number;
  name: string;
  category: string | null;
  description: string | null;
  variants: ImportVariant[];
  stockQty: number | null;
  featured: boolean;
};
export type ImportError = { line: number; message: string };
export type ImportResult = { rows: ImportRow[]; errors: ImportError[] };

const YES = new Set(["yes", "y", "true", "1", "featured"]);
const NO = new Set(["", "no", "n", "false", "0"]);

function parseVariants(raw: string): ImportVariant[] | string {
  const parts = raw.split("|").map((p) => p.trim()).filter(Boolean);
  if (parts.length > 10) return "Up to 10 sizes per product.";
  const out: ImportVariant[] = [];
  for (const part of parts) {
    const idx = part.lastIndexOf(":");
    if (idx <= 0) return `Write each size as label:price, like "1 kg:1200" (got "${part}").`;
    const label = part.slice(0, idx).trim();
    const price = parseRupeesToPaise(part.slice(idx + 1));
    if (!label || label.length > 40) return `Size name "${label}" must be 1-40 characters.`;
    if (price === null) return `Price for "${label}" isn't a valid amount.`;
    if (out.some((v) => v.label.toLowerCase() === label.toLowerCase())) return `Size "${label}" appears twice.`;
    out.push({ label, pricePaise: price });
  }
  return out;
}

function parseStock(raw: string): number | null | string {
  const value = raw.trim().toLowerCase();
  if (value === "" || value === "made to order" || value === "mto") return null;
  if (!/^\d{1,5}$/.test(value)) return 'Stock must be a whole number, or "made to order".';
  return Number(value);
}

function validateRow(record: Record<string, string>, line: number): ImportRow | ImportError {
  const get = (key: string) => (record[key] ?? "").trim();
  const name = get("name");
  if (!name) return { line, message: "Name is missing." };
  if (name.length > 80) return { line, message: "Name is longer than 80 characters." };

  const variantsRaw = get("variants");
  let variants: ImportVariant[];
  if (variantsRaw) {
    const parsed = parseVariants(variantsRaw);
    if (typeof parsed === "string") return { line, message: parsed };
    variants = parsed;
  } else {
    const price = parseRupeesToPaise(get("price"));
    if (price === null) return { line, message: `Price "${get("price")}" isn't a valid amount. Use numbers like 650 or 650.50.` };
    variants = [{ label: "", pricePaise: price }];
  }

  const stock = parseStock(get("stock"));
  if (typeof stock === "string") return { line, message: stock };

  const featuredRaw = get("featured").toLowerCase();
  if (!YES.has(featuredRaw) && !NO.has(featuredRaw)) return { line, message: 'Featured must be "yes" or "no".' };

  const category = get("category");
  const description = get("description");
  if (category.length > 40) return { line, message: "Category is longer than 40 characters." };
  if (description.length > 600) return { line, message: "Description is longer than 600 characters." };

  return {
    line,
    name,
    category: category || null,
    description: description || null,
    variants,
    stockQty: stock,
    featured: YES.has(featuredRaw),
  };
}

/** Validates a whole file. Line numbers match what the owner sees in a spreadsheet (header is line 1). */
export function parseProductCsv(text: string): ImportResult {
  if (text.length > CSV_MAX_BYTES) return { rows: [], errors: [{ line: 0, message: "File is larger than 512 KB." }] };

  const parsed = Papa.parse<Record<string, string>>(text.replace(/^\ufeff/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  const headers = parsed.meta.fields ?? [];
  if (!headers.includes("name") || (!headers.includes("price") && !headers.includes("variants"))) {
    return { rows: [], errors: [{ line: 1, message: 'The first row must have column names, including "name" and "price".' }] };
  }
  if (parsed.data.length > CSV_MAX_ROWS) {
    return { rows: [], errors: [{ line: 0, message: `Up to ${CSV_MAX_ROWS} products per file. Split it into smaller files.` }] };
  }

  const rows: ImportRow[] = [];
  const errors: ImportError[] = [];
  const seen = new Set<string>();
  parsed.data.forEach((record, i) => {
    const result = validateRow(record, i + 2);
    if ("message" in result) return errors.push(result);
    const key = result.name.toLowerCase();
    if (seen.has(key)) return errors.push({ line: result.line, message: `"${result.name}" appears twice in this file.` });
    seen.add(key);
    rows.push(result);
  });
  return { rows, errors };
}
