type PatientStatus = "alarm" | "stable";

export type CardiacRhythm =
  | "atrial-fibrillation"
  | "low-voltage"
  | "occasional-pvc"
  | "paced"
  | "sinus"
  | "sinus-bradycardia"
  | "sinus-tachycardia"
  | "st-depression";

interface SignalProfile {
  amplitude: number;
  phase: number;
  rhythm: CardiacRhythm;
}

export interface PatientEvent {
  label: string;
  time: string;
}

export interface PatientRecord {
  age: number;
  alarm?: string;
  alarmDuration?: string;
  arterialMap: number;
  arterialPressure: string;
  bed: string;
  diagnosis: string;
  heartRate: number;
  id: string;
  map: number;
  name: string;
  nibp: string;
  recentEvents: PatientEvent[];
  respirationRate: number;
  sex: "F" | "M";
  signalProfile: SignalProfile;
  spo2: number;
  status: PatientStatus;
  temperature: string;
}

