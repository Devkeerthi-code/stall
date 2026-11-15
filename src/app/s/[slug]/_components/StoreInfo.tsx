import { DAY_NAMES, formatTime, type WeekHours } from "@/lib/hours";
import type { messages } from "@/lib/i18n";
import type { Storefront } from "@/server/storefront";
import { ReportForm } from "./ReportForm";

type Dict = ReturnType<typeof messages>;
const WEEK = [1, 2, 3, 4, 5, 6, 0];

function HoursList({ hours, closed }: { hours: WeekHours; closed: string }) {
  return (
    <ul className="hours" style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {WEEK.map((d) => {
        const h = hours[d]!;
        return (
          <li key={d} className="hours__row" style={{ gridTemplateColumns: "5ch 1fr" }}>
            <span className="mono">{DAY_NAMES[d]}</span>
            <span className="mono">{h.closed ? closed : `${formatTime(h.open)} – ${formatTime(h.close)}`}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** "+" panels under the shelf: delivery, hours, address and how ordering works. */
export function StoreInfo({ shop, t }: { shop: Storefront; t: Dict }) {
  const modes = [shop.pickup ? t.pickup : null, shop.delivery ? t.delivery : null].filter(Boolean).join(" · ");
  return (
    <section className="info" aria-labelledby="info-h">
      <h2 id="info-h">{t.info}</h2>
      <details className="plus">
        <summary><span className="plus-icon" aria-hidden="true" />{t.deliveryInfo}<span className="label">{modes}</span></summary>
        <div className="plus__body">{shop.deliveryNote ?? modes}</div>
      </details>
      {shop.hours && (
        <details className="plus">
          <summary><span className="plus-icon" aria-hidden="true" />{t.hours}</summary>
          <div className="plus__body"><HoursList hours={shop.hours} closed={t.closed} /></div>
        </details>
      )}
      {(shop.address || shop.mapUrl) && (
        <details className="plus">
          <summary><span className="plus-icon" aria-hidden="true" />{shop.address ?? t.map}</summary>
          <div className="plus__body">
            {shop.address && <p>{shop.address}</p>}
            {shop.mapUrl && <a className="link" href={shop.mapUrl} target="_blank" rel="noopener noreferrer">{t.map} ↗</a>}
          </div>
        </details>
      )}
      <details className="plus">
        <summary><span className="plus-icon" aria-hidden="true" />{t.report}</summary>
        <div className="plus__body"><ReportForm slug={shop.slug} /></div>
      </details>
    </section>
  );
}
