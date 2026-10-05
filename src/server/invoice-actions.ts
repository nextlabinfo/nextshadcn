"use server";

import { dateStr, num, pool, requireSession } from "@/lib/db";
import type { InvoiceItem, InvoiceRecord } from "@/lib/dashboards/types";

export async function getInvoices(): Promise<InvoiceRecord[]> {
  await requireSession();
  const res = await pool.query(`
    SELECT i.*, c.name AS client_name, c.email AS client_email, c.company AS client_company, c.address AS client_address
    FROM inv_invoice i
    LEFT JOIN inv_client c ON c.id = i.client_id
    ORDER BY i.issue_date DESC`);
  const itemsRes = await pool.query(`SELECT * FROM inv_item ORDER BY line_no ASC`);

  const itemsByInvoice = new Map<string, InvoiceItem[]>();
  for (const it of itemsRes.rows) {
    const list = itemsByInvoice.get(it.invoice_id) ?? [];
    list.push({
      id: it.id,
      description: it.description,
      qty: num(it.qty),
      unitPrice: num(it.unit_price),
    });
    itemsByInvoice.set(it.invoice_id, list);
  }

  return res.rows.map((r) => {
    const items = itemsByInvoice.get(r.id) ?? [];
    const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const taxRate = num(r.tax_rate);
    const discount = num(r.discount);
    const total = subtotal - discount + (subtotal - discount) * (taxRate / 100);
    return {
      id: r.id,
      invoiceNo: r.invoice_no,
      client: r.client_id
        ? {
            id: r.client_id,
            name: r.client_name,
            email: r.client_email,
            company: r.client_company,
            address: r.client_address,
          }
        : null,
      issueDate: dateStr(r.issue_date) ?? "",
      dueDate: dateStr(r.due_date) ?? "",
      status: r.status,
      taxRate,
      discount,
      notes: r.notes,
      items,
      subtotal,
      total,
    };
  });
}

export async function getInvoiceKpis() {
  await requireSession();
  const res = await pool.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'paid') AS paid,
      COUNT(*) FILTER (WHERE status = 'overdue') AS overdue,
      COUNT(*) FILTER (WHERE status = 'sent') AS sent
    FROM inv_invoice`);
  const r = res.rows[0];
  return {
    total: Number(r.total),
    paid: Number(r.paid),
    overdue: Number(r.overdue),
    sent: Number(r.sent),
  };
}
