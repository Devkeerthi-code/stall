"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { setupDone: boolean; hasShop: boolean; newOrders: number };

export function DashboardNav({ setupDone, hasShop, newOrders }: Props) {
  const path = usePathname();
  const items = [
    ...(setupDone ? [] : [{ href: "/dashboard/setup", label: "Setup" }]),
    { href: "/dashboard/orders", label: "Orders", count: newOrders },
    { href: "/dashboard/products", label: "Products" },
    { href: "/dashboard/insights", label: "Insights" },
    { href: "/dashboard/share", label: "Share kit" },
    { href: "/dashboard/settings", label: "Shop details" },
  ];
  return (
    <nav className="side__nav" aria-label="Sections">
      {items.map((item, i) => {
        const disabled = !hasShop && item.href !== "/dashboard/setup";
        return (
          <Link
            key={item.href}
            href={disabled ? "/dashboard/setup" : item.href}
            aria-current={path.startsWith(item.href) ? "true" : undefined}
            aria-disabled={disabled || undefined}
          >
            <span className="label">{String(i + 1).padStart(2, "0")}</span>
            {item.label}
            {!!item.count && <span className="count" aria-label={`${item.count} new`}>{item.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
