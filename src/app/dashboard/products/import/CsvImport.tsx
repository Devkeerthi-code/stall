"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/components/toast";
import { CSV_MAX_BYTES, CSV_TEMPLATE, type ImportResult } from "@/lib/csv";
import { formatRupees } from "@/lib/money";
import { importCsvAction, previewCsvAction } from "../../actions";

export function CsvImport({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, start] = useTransition();
  const template = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`;

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > CSV_MAX_BYTES) return toast("That file is larger than 512 KB");
    const content = await file.text();
    setFileName(file.name);
    setText(content);
    start(async () => setResult(await previewCsvAction(content)));
  }

  function runImport() {
    start(async () => {
      const outcome = await importCsvAction(text);
      if (outcome.errors) return toast(Object.values(outcome.errors)[0] ?? "Couldn't import");
      toast(`${outcome.added} products added`, outcome.skipped ? `${outcome.skipped} already on your shelf` : undefined);
      router.push(returnTo);
    });
  }

  const ready = result && result.errors.length === 0 && result.rows.length > 0;

  return (
    <div className="stack-lg">
      <ol className="who" style={{ borderTop: "1px solid var(--ink)" }}>
        <li><span className="mono">01</span><b>Get the template</b><span className="muted small"><a className="link" href={template} download="stall-products.csv">Download stall-products.csv</a>, open it in Google Sheets or Excel.</span></li>
        <li><span className="mono">02</span><b>One product per row</b><span className="muted small">Use the <span className="mono">variants</span> column for sizes, like <span className="mono">1/2 kg:650 | 1 kg:1200</span>. Leave <span className="mono">stock</span> empty for made to order.</span></li>
        <li><span className="mono">03</span><b>Upload it here</b><span className="muted small">Save as CSV. You&apos;ll see every row before anything is added.</span></li>
      </ol>

      <label className="photo-add" style={{ aspectRatio: "auto", minHeight: 120 }}>
        <span>{fileName ? <>Chosen: <b>{fileName}</b><br />Tap to pick another</> : <>Tap to choose your CSV file</>}</span>
        <input type="file" accept=".csv,text/csv" onChange={(e) => void onFile(e.target.files?.[0])} />
      </label>

      {pending && !result && <div className="sk" aria-label="Checking the file"><i /><i /><i /><i /><i /></div>}

      {result && result.errors.length > 0 && (
        <div className="stack">
          <p className="notice notice--bad" role="alert">{result.errors.length} {result.errors.length === 1 ? "row needs" : "rows need"} fixing. Nothing has been added yet.</p>
          <ul className="errors">{result.errors.map((e, i) => <li key={i}><span className="mono">Line {e.line}</span><span>{e.message}</span></li>)}</ul>
        </div>
      )}

      {result && result.rows.length > 0 && (
        <div className="stack">
          <span className="label">{result.rows.length} products ready</span>
          <div className="table-scroll">
            <table className="csv-table">
              <thead><tr><th>Line</th><th>Name</th><th>Prices</th><th>Category</th><th>Stock</th></tr></thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.line}>
                    <td className="mono">{r.line}</td>
                    <td>{r.name}{r.featured && <span className="feat">Featured</span>}</td>
                    <td className="mono">{r.variants.map((v) => `${v.label ? `${v.label} ` : ""}${formatRupees(v.pricePaise)}`).join(" · ")}</td>
                    <td>{r.category ?? "—"}</td>
                    <td className="mono">{r.stockQty ?? "Made to order"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="step-actions">
        <Link className="btn btn--ghost" href={returnTo}>Cancel</Link>
        <button className="btn" type="button" disabled={!ready || pending} onClick={runImport} aria-busy={pending}>
          {pending && ready ? "Adding…" : `Add ${result?.rows.length ?? 0} products`}
        </button>
      </div>
    </div>
  );
}
