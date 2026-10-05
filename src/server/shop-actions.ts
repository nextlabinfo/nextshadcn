"use server";

import { iso, num, pool, requireSession } from "@/lib/db";
import type { ShopKpis, ShopOrder, ShopProduct, ShopReview, TrafficSourceSlice } from "@/lib/dashboards/types";

export async function getShopKpis(): Promise<ShopKpis> {
  await requireSession();
  const res = await pool.query(`
    SELECT
      COALESCE(SUM(total) FILTER (WHERE status NOT IN ('refunded','cancelled')),0) AS revenue,
      COUNT(*) FILTER (WHERE status NOT IN ('cancelled')) AS orders,
      COUNT(*) FILTER (WHERE status = 'refunded') AS refunds
    FROM shop_order`);
  const units = await pool.query(`SELECT COALESCE(SUM(units_sold),0) AS u FROM shop_product`);
  const r = res.rows[0];
  const orders = Number(r.orders);
  const revenue = num(r.revenue);
  return {
    revenue,
    orders,
    avgOrderValue: orders > 0 ? revenue / orders : 0,
    unitsSold: Number(units.rows[0].u),
    refundRatePct: orders > 0 ? (Number(r.refunds) / orders) * 100 : 0,
  };
}

export async function getTopProducts(limit = 6): Promise<ShopProduct[]> {
  await requireSession();
  const res = await pool.query(
    `SELECT * FROM shop_product WHERE status = 'active' ORDER BY units_sold DESC LIMIT $1`,
    [limit],
  );
  return res.rows.map(mapProduct);
}

export async function getInventory(): Promise<ShopProduct[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM shop_product ORDER BY stock ASC`);
  return res.rows.map(mapProduct);
}

export async function getRecentOrders(limit = 8): Promise<ShopOrder[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM shop_order ORDER BY placed_at DESC LIMIT $1`, [limit]);
  return res.rows.map((r) => ({
    id: r.id,
    orderNo: r.order_no,
    customerName: r.customer_name,
    status: r.status,
    total: num(r.total),
    placedAt: iso(r.placed_at),
  }));
}

export async function getShopReviews(limit = 6): Promise<ShopReview[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM shop_review ORDER BY created_at DESC LIMIT $1`, [limit]);
  return res.rows.map((r) => ({
    id: r.id,
    productName: r.product_name,
    customerName: r.customer_name,
    rating: Number(r.rating),
    title: r.title,
    body: r.body,
    createdAt: iso(r.created_at),
  }));
}

export async function getTrafficSources(): Promise<TrafficSourceSlice[]> {
  await requireSession();
  const res = await pool.query(`
    SELECT source,
           COALESCE(SUM(visitors),0) AS visitors,
           COALESCE(SUM(orders),0) AS orders,
           COALESCE(SUM(revenue),0) AS revenue
    FROM shop_traffic_day
    GROUP BY source
    ORDER BY visitors DESC`);
  return res.rows.map((r) => ({
    source: r.source,
    visitors: Number(r.visitors),
    orders: Number(r.orders),
    revenue: num(r.revenue),
  }));
}

function mapProduct(r: Record<string, unknown>): ShopProduct {
  return {
    id: r.id as string,
    name: r.name as string,
    sku: r.sku as string,
    category: (r.category as string | null) ?? null,
    price: num(r.price),
    stock: Number(r.stock),
    status: r.status as string,
    unitsSold: Number(r.units_sold),
  };
}
