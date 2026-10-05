"use server";

import { dateStr, iso, num, pool, requireSession } from "@/lib/db";
import type { OverviewMetrics } from "@/lib/dashboards/types";

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  await requireSession();

  const rev = await pool.query(`
    SELECT
      COALESCE(SUM(total) FILTER (WHERE status NOT IN ('refunded','cancelled')),0) AS revenue,
      COALESCE(SUM(total) FILTER (WHERE status NOT IN ('refunded','cancelled') AND placed_at >= now() - interval '30 days'),0) AS rev_30,
      COALESCE(SUM(total) FILTER (WHERE status NOT IN ('refunded','cancelled') AND placed_at >= now() - interval '60 days' AND placed_at < now() - interval '30 days'),0) AS rev_prev_30,
      COUNT(*) AS orders
    FROM shop_order`);
  const custCount = await pool.query(`SELECT COUNT(*) AS c FROM shop_customer`);
  const visitors = await pool.query(`SELECT COALESCE(SUM(visitors),0) AS v FROM an_traffic_day WHERE day >= current_date - 29`);

  const series = await pool.query(`
    SELECT d::date AS day, COUNT(c.id)::int AS count
    FROM generate_series(current_date - 29, current_date, interval '1 day') d
    LEFT JOIN shop_customer c ON c.created_at::date = d::date
    GROUP BY d ORDER BY d ASC`);

  const recent = await pool.query(`SELECT name, email, created_at FROM shop_customer ORDER BY created_at DESC LIMIT 6`);

  const r = rev.rows[0];
  const rev30 = num(r.rev_30);
  const revPrev = num(r.rev_prev_30);
  return {
    revenue: num(r.revenue),
    revenueDeltaPct: revPrev > 0 ? ((rev30 - revPrev) / revPrev) * 100 : 0,
    orders: Number(r.orders),
    customers: Number(custCount.rows[0].c),
    visitors: Number(visitors.rows[0].v),
    newCustomersSeries: series.rows.map((s) => ({ day: dateStr(s.day) ?? "", count: Number(s.count) })),
    recentCustomers: recent.rows.map((c) => ({ name: c.name, email: c.email, createdAt: iso(c.created_at) })),
  };
}
