"use server";

import { iso, num, pool, requireSession } from "@/lib/db";
import type { InfraEnvironment, InfraProject } from "@/lib/dashboards/types";

export async function getInfraProjects(): Promise<InfraProject[]> {
  await requireSession();
  const projects = await pool.query(`SELECT * FROM infra_project ORDER BY name ASC`);
  const envs = await pool.query(`SELECT * FROM infra_environment ORDER BY name ASC`);

  const byProject = new Map<string, InfraEnvironment[]>();
  for (const e of envs.rows) {
    const env: InfraEnvironment = {
      id: e.id,
      name: e.name,
      status: e.status,
      url: e.url,
      region: e.region,
      commitSha: e.commit_sha,
      commitMessage: e.commit_message,
      branch: e.branch,
      deployedBy: e.deployed_by,
      lastDeployAt: e.last_deploy_at ? iso(e.last_deploy_at) : null,
      uptimePct: num(e.uptime_pct),
    };
    const list = byProject.get(e.project_id) ?? [];
    list.push(env);
    byProject.set(e.project_id, list);
  }

  return projects.rows.map((p) => ({
    id: p.id,
    name: p.name,
    framework: p.framework,
    repo: p.repo,
    environments: byProject.get(p.id) ?? [],
  }));
}

export async function getInfraKpis() {
  await requireSession();
  const res = await pool.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'ready') AS ready,
      COUNT(*) FILTER (WHERE status = 'building') AS building,
      COUNT(*) FILTER (WHERE status = 'error') AS error,
      COALESCE(AVG(uptime_pct),0) AS avg_uptime
    FROM infra_environment`);
  const r = res.rows[0];
  return {
    environments: Number(r.total),
    ready: Number(r.ready),
    building: Number(r.building),
    error: Number(r.error),
    avgUptime: num(r.avg_uptime),
  };
}
