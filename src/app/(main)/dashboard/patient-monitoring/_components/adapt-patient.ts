import type { Patient, PatientVital } from "@/lib/dashboards/types";

import type { CardiacRhythm, PatientRecord } from "./data";

// Fallback vital values used only when the DB has no reading for a field.
// The waveform/trend baselines are driven by these numbers, so they must be
// present and sane even for patients with sparse data.
const FALLBACK = {
  heartRate: 72,
  spo2: 97,
  respRate: 16,
  temperature: 36.8,
  systolic: 120,
  diastolic: 70,
} as const;

// Deterministic 0..1 hash from a string so the decorative signal profile
// (phase/amplitude) is stable across renders but varies per patient.
function unitHash(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function sex(gender: string | null): PatientRecord["sex"] {
  const first = gender?.trim().charAt(0).toUpperCase();
  return first === "F" ? "F" : "M";
}

// DB status is "critical" | "monitor" | "stable"; the UI only knows alarm/stable.
function status(dbStatus: string): PatientRecord["status"] {
  return dbStatus === "critical" ? "alarm" : "stable";
}

// Pick an ECG rhythm from the real HR and the condition text. This only steers
// the procedural waveform shape; the beat rate itself comes from heartRate.
function rhythm(condition: string | null, heartRate: number): CardiacRhythm {
  const text = condition?.toLowerCase() ?? "";
  if (text.includes("fib")) return "atrial-fibrillation";
  if (text.includes("pacemaker") || text.includes("paced")) return "paced";
  if (text.includes("pvc") || text.includes("ectopic")) return "occasional-pvc";
  if (text.includes("angina") || text.includes("stemi") || text.includes("ischemi")) return "st-depression";
  if (text.includes("failure")) return "low-voltage";
  if (heartRate >= 100) return "sinus-tachycardia";
  if (heartRate <= 55) return "sinus-bradycardia";
  return "sinus";
}

function meanArterialPressure(systolic: number, diastolic: number): number {
  return Math.round(diastolic + (systolic - diastolic) / 3);
}

function timeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// Derive the "recent events" list from real vital readings (most recent first).
function recentEvents(series: PatientVital[]): PatientRecord["recentEvents"] {
  return series
    .slice(-3)
    .reverse()
    .map((vital) => {
      const time = timeLabel(vital.measuredAt);
      if (vital.systolic !== null && vital.diastolic !== null) {
        return { label: `NIBP ${vital.systolic}/${vital.diastolic}`, time };
      }
      if (vital.heartRate !== null) return { label: `HR ${vital.heartRate}`, time };
      if (vital.spo2 !== null) return { label: `SpO₂ ${vital.spo2}%`, time };
      return { label: "Vitals recorded", time };
    });
}

export function adaptPatient(patient: Patient): PatientRecord {
  const latest = patient.latest;
  const heartRate = latest?.heartRate ?? FALLBACK.heartRate;
  const spo2 = latest?.spo2 ?? FALLBACK.spo2;
  const respirationRate = latest?.respRate ?? FALLBACK.respRate;
  const temperature = latest?.temperature ?? FALLBACK.temperature;
  const systolic = latest?.systolic ?? FALLBACK.systolic;
  const diastolic = latest?.diastolic ?? FALLBACK.diastolic;

  const pressure = `${systolic}/${diastolic}`;
  const map = meanArterialPressure(systolic, diastolic);
  const uiStatus = status(patient.status);

  let alarm: string | undefined;
  let alarmDuration: string | undefined;
  if (uiStatus === "alarm") {
    if (heartRate > 100) alarm = `HR HIGH ${heartRate}  > 100 bpm`;
    else if (spo2 < 92) alarm = `SpO₂ LOW ${spo2}  < 92 %`;
    else alarm = "CHECK PATIENT";
    // Decorative: no alarm-start timestamp exists in the DB, so derive a stable
    // duration from the patient id purely for display.
    const seconds = Math.round(unitHash(`dur-${patient.id}`) * 59 * 60);
    alarmDuration = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  const events = recentEvents(patient.series);

  return {
    age: patient.age ?? 0,
    alarm,
    alarmDuration,
    arterialMap: map,
    arterialPressure: pressure,
    bed: patient.room ?? patient.id,
    diagnosis: patient.condition ?? "—",
    heartRate,
    id: patient.id,
    map,
    name: patient.name,
    nibp: pressure,
    recentEvents: events.length ? events : [{ label: "No recent readings", time: "--:--" }],
    respirationRate,
    sex: sex(patient.gender),
    signalProfile: {
      // amplitude/phase are decorative seeds for the procedural waveform only.
      amplitude: 0.7 + unitHash(`amp-${patient.id}`) * 0.4,
      phase: unitHash(`phase-${patient.id}`),
      rhythm: rhythm(patient.condition, heartRate),
    },
    spo2,
    status: uiStatus,
    temperature: temperature.toFixed(1),
  };
}

export function adaptPatients(patients: Patient[]): PatientRecord[] {
  return patients.map(adaptPatient);
}
