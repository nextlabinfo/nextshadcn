"use server";

import { iso, num, pool, requireSession } from "@/lib/db";
import type { Shipment } from "@/lib/dashboards/types";

export async function getShipments(): Promise<Shipment[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM log_shipment ORDER BY created_at DESC`);
  return res.rows.map((r) => ({
    id: r.id,
    trackingNo: r.tracking_no,
    customer: r.customer,
    origin: r.origin,
    destination: r.destination,
    carrier: r.carrier,
    status: r.status,
    progress: Number(r.progress),
    originLat: r.origin_lat !== null ? num(r.origin_lat) : null,
    originLng: r.origin_lng !== null ? num(r.origin_lng) : null,
    destLat: r.dest_lat !== null ? num(r.dest_lat) : null,
    destLng: r.dest_lng !== null ? num(r.dest_lng) : null,
    currentLat: r.current_lat !== null ? num(r.current_lat) : null,
    currentLng: r.current_lng !== null ? num(r.current_lng) : null,
    eta: r.eta ? iso(r.eta) : null,
    weightKg: r.weight_kg !== null ? num(r.weight_kg) : null,
  }));
}

export async function getLogisticsKpis() {
  await requireSession();
  const res = await pool.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'in_transit') AS in_transit,
      COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
      COUNT(*) FILTER (WHERE status IN ('delayed','exception')) AS delayed
    FROM log_shipment`);
  const r = res.rows[0];
  return {
    total: Number(r.total),
    inTransit: Number(r.in_transit),
    delivered: Number(r.delivered),
    delayed: Number(r.delayed),
  };
}
