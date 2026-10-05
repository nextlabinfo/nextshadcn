"use server";

import { dateStr, num, pool, requireSession } from "@/lib/db";
import type { AnalyticsKpis, AnalyticsPage, AnalyticsSource, TrafficPoint } from "@/lib/dashboards/types";

export async function getTrafficSeries(days = 30): Promise<TrafficPoint[]> {
  await requireSession();
  const res = await pool.query(
    `SELECT day, visitors, pageviews, sessions FROM an_traffic_day
     WHERE day >= current_date - ($1::int - 1) ORDER BY day ASC`,
    [days],
  );
  return res.rows.map((r) => ({
    day: dateStr(r.day) ?? "",
    visitors: Number(r.visitors),
    pageviews: Number(r.pageviews),
    sessions: Number(r.sessions),
  }));
}

export async function getAnalyticsKpis(): Promise<AnalyticsKpis> {
  await requireSession();
  const cur = await pool.query(`
    SELECT COALESCE(SUM(visitors),0) AS visitors, COALESCE(SUM(pageviews),0) AS pageviews,
           COALESCE(SUM(sessions),0) AS sessions, COALESCE(AVG(bounce_rate),0) AS bounce,
           COALESCE(AVG(avg_duration_sec),0) AS dur
    FROM an_traffic_day WHERE day >= current_date - 6`);
  const prev = await pool.query(`
    SELECT COALESCE(SUM(visitors),0) AS visitors
    FROM an_traffic_day WHERE day >= current_date - 13 AND day < current_date - 6`);
  const c = cur.rows[0];
  const curVis = Number(c.visitors);
  const prevVis = Number(prev.rows[0].visitors);
  return {
    visitors: curVis,
    pageviews: Number(c.pageviews),
    sessions: Number(c.sessions),
    avgBounceRate: num(c.bounce),
    avgDurationSec: Math.round(num(c.dur)),
    visitorsDeltaPct: prevVis > 0 ? ((curVis - prevVis) / prevVis) * 100 : 0,
  };
}

export async function getTopPages(limit = 7): Promise<AnalyticsPage[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM an_page ORDER BY views DESC LIMIT $1`, [limit]);
  return res.rows.map((r) => ({
    path: r.path,
    views: Number(r.views),
    uniqueViews: Number(r.unique_views),
    avgTimeSec: Number(r.avg_time_sec),
    bounceRate: num(r.bounce_rate),
  }));
}

export async function getAnalyticsSources(): Promise<AnalyticsSource[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM an_source ORDER BY sessions DESC`);
  return res.rows.map((r) => ({
    source: r.source,
    kind: r.kind,
    sessions: Number(r.sessions),
    share: num(r.share),
  }));
}
