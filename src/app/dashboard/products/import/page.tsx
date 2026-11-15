import type { Metadata } from "next";
import { requireOwnerId } from "@/server/session";
import { PanelHead } from "../../_components/PanelHead";
import { requireShopPage } from "../../_components/require-shop";
import { CsvImport } from "./CsvImport";

export const metadata: Metadata = { title: "Import products" };

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await requireShopPage(await requireOwnerId());
  const { from } = await searchParams;
  return (
    <section className="panel">
      <PanelHead n="02" label="Catalogue · import" title="Add many products" emphasis="at once" />
      <CsvImport returnTo={from === "setup" ? "/dashboard/setup?step=3" : "/dashboard/products"} />
    </section>
  );
}
