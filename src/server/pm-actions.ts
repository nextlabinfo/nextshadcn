"use server";

import { iso, num, pool, requireSession } from "@/lib/db";
import type { Patient, PatientVital } from "@/lib/dashboards/types";

function mapVital(r: Record<string, unknown>): PatientVital {
  return {
    measuredAt: iso(r.measured_at),
    heartRate: r.heart_rate !== null ? Number(r.heart_rate) : null,
    spo2: r.spo2 !== null ? Number(r.spo2) : null,
    respRate: r.resp_rate !== null ? Number(r.resp_rate) : null,
    temperature: r.temperature !== null ? num(r.temperature) : null,
    systolic: r.systolic !== null ? Number(r.systolic) : null,
    diastolic: r.diastolic !== null ? Number(r.diastolic) : null,
  };
}

export async function getPatients(): Promise<Patient[]> {
  await requireSession();
  const patients = await pool.query(`SELECT * FROM pm_patient ORDER BY
    CASE status WHEN 'critical' THEN 0 WHEN 'monitor' THEN 1 WHEN 'stable' THEN 2 ELSE 3 END, name ASC`);
  const vitals = await pool.query(
    `SELECT * FROM pm_vital ORDER BY patient_id, measured_at ASC`,
  );

  const byPatient = new Map<string, PatientVital[]>();
  for (const v of vitals.rows) {
    const list = byPatient.get(v.patient_id) ?? [];
    list.push(mapVital(v));
    byPatient.set(v.patient_id, list);
  }

  return patients.rows.map((p) => {
    const series = byPatient.get(p.id) ?? [];
    return {
      id: p.id,
      name: p.name,
      age: p.age !== null ? Number(p.age) : null,
      gender: p.gender,
      room: p.room,
      condition: p.condition,
      status: p.status,
      latest: series.length ? series[series.length - 1] : null,
      series,
    };
  });
}
