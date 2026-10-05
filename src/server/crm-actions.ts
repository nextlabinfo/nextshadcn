"use server";

import { dateStr, iso, num, pool, requireSession } from "@/lib/db";
import type { CrmActivity, CrmKpis, CrmLead, CrmOpportunity } from "@/lib/dashboards/types";

export async function getCrmLeads(): Promise<CrmLead[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM crm_lead ORDER BY created_at DESC`);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company,
    email: r.email,
    stage: r.stage,
    value: num(r.value),
    source: r.source,
    owner: r.owner,
    createdAt: iso(r.created_at),
  }));
}

export async function getCrmOpportunities(): Promise<CrmOpportunity[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM crm_opportunity ORDER BY close_date ASC NULLS LAST`);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    account: r.account,
    stage: r.stage,
    amount: num(r.amount),
    probability: Number(r.probability),
    closeDate: dateStr(r.close_date),
    owner: r.owner,
  }));
}

export async function getCrmActivities(): Promise<CrmActivity[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM crm_activity ORDER BY due_date ASC NULLS LAST`);
  return res.rows.map((r) => ({
    id: r.id,
    type: r.type,
    subject: r.subject,
    relatedTo: r.related_to,
    owner: r.owner,
    dueDate: r.due_date ? iso(r.due_date) : null,
    status: r.status,
  }));
}

export async function getCrmKpis(): Promise<CrmKpis> {
  await requireSession();
  const res = await pool.query(`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE stage NOT IN ('won','lost')),0) AS pipeline,
      COALESCE(SUM(amount) FILTER (WHERE stage = 'won'),0) AS won,
      COUNT(*) FILTER (WHERE stage NOT IN ('won','lost')) AS open_opps,
      COUNT(*) FILTER (WHERE stage = 'won') AS won_cnt,
      COUNT(*) FILTER (WHERE stage = 'lost') AS lost_cnt
    FROM crm_opportunity`);
  const leadRes = await pool.query(`SELECT COUNT(*) AS c FROM crm_lead`);
  const r = res.rows[0];
  const won = Number(r.won_cnt);
  const lost = Number(r.lost_cnt);
  return {
    pipelineValue: num(r.pipeline),
    wonValue: num(r.won),
    openOpportunities: Number(r.open_opps),
    leadCount: Number(leadRes.rows[0].c),
    winRatePct: won + lost > 0 ? (won / (won + lost)) * 100 : 0,
  };
}
