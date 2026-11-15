import { describe, expect, it } from "vitest";
import { CSV_TEMPLATE, parseProductCsv } from "@/lib/csv";

describe("CSV import validation", () => {
  it("parses the template the app offers for download", () => {
    const { rows, errors } = parseProductCsv(CSV_TEMPLATE);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      name: "Eggless chocolate truffle cake", category: "Cakes", stockQty: null, featured: true,
      variants: [{ label: "1/2 kg", pricePaise: 65000 }, { label: "1 kg", pricePaise: 120000 }],
    });
    expect(rows[1]).toMatchObject({ stockQty: 25, featured: false, variants: [{ label: "", pricePaise: 22000 }] });
  });

  it("reports problems with the spreadsheet line number", () => {
    const csv = [
      "Name,Price,Stock,Featured",
      "Good item,100,,",
      ",50,,",
      "Bad price,abc,,",
      "Bad stock,10,lots,",
      "Bad flag,10,,maybe",
      "Good item,100,,",
    ].join("\n");
    const { rows, errors } = parseProductCsv(csv);
    expect(rows.map((r) => r.name)).toEqual(["Good item"]);
    expect(errors.map((e) => e.line)).toEqual([3, 4, 5, 6, 7]);
    expect(errors[0]?.message).toMatch(/Name is missing/);
    expect(errors[4]?.message).toMatch(/appears twice/);
  });

  it("validates variant syntax", () => {
    const csv = 'name,variants\nA,"Small:100 | Large"\nB,"S:10|s:20"\nC,"S:1.234"';
    const { errors } = parseProductCsv(csv);
    expect(errors).toHaveLength(3);
    expect(errors[0]?.message).toMatch(/label:price/);
    expect(errors[1]?.message).toMatch(/twice/);
  });

  it("handles a BOM, quoted commas and Indian-script names", () => {
    const csv = '\ufeffname,price,description\n"ಮೈಸೂರು ಪಾಕ್, 250 g",180,"Ghee, sugar, besan"';
    const { rows, errors } = parseProductCsv(csv);
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({ name: "ಮೈಸೂರು ಪಾಕ್, 250 g", description: "Ghee, sugar, besan" });
  });

  it("refuses files without the needed columns or too many rows", () => {
    expect(parseProductCsv("title,cost\nA,1").errors[0]?.line).toBe(1);
    const big = ["name,price", ...Array.from({ length: 301 }, (_, i) => `Item ${i},10`)].join("\n");
    expect(parseProductCsv(big).errors[0]?.message).toMatch(/Up to 300/);
  });
});
