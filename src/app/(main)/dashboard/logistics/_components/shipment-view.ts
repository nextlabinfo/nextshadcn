import { ArrowUp, Ban, type LucideIcon, PackageCheck, PenLine, ShieldCheck } from "lucide-react";

import type { Shipment } from "@/lib/dashboards/types";

// ---------------------------------------------------------------------------
// View model that the logistics UI components render. Real shipment records
// (flat, from the Postgres data layer) are mapped onto this richer shape so
// the existing layout keeps working without redesign.
// ---------------------------------------------------------------------------

export type ShipmentStatus = "Scheduled" | "In Transit" | "Out for Delivery" | "Delivered" | "Delayed" | "Exception";

export type TransportMode = "land" | "air" | "sea";
export type RouteType = "road" | "flight" | "ship";
export type CustomerTier = "Priority" | "Standard" | "Non-priority";

export type GeoCoordinate = [longitude: number, latitude: number];

export type ShipmentLocation = {
  coordinates: GeoCoordinate | null;
  display: string;
  country: string;
  countryCode: string;
};

export type ShipmentCustomer = {
  name: string;
  initials: string;
  id: string;
  tier: CustomerTier;
  tierLabel: string;
};

export type HandlingTag = {
  label: string;
  icon: LucideIcon;
};

export type ShipmentHandling = {
  label: string;
  note: string;
  tags: HandlingTag[];
};

export type ShipmentView = {
  id: string;
  trackingNo: string;
  customer: ShipmentCustomer;
  origin: ShipmentLocation;
  destination: ShipmentLocation;
  current: GeoCoordinate | null;
  cargo: string;
  handling: ShipmentHandling;
  weight: string;
  eta: string;
  etaMeta: string;
  status: ShipmentStatus;
  progress: number;
  mode: TransportMode;
  routeType: RouteType;
  transportNumber: string;
};

const STATUS_LABELS: Record<string, ShipmentStatus> = {
  pending: "Scheduled",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  delayed: "Delayed",
  exception: "Exception",
};

function toStatusLabel(status: string): ShipmentStatus {
  return STATUS_LABELS[status] ?? "Scheduled";
}

// Minimal ISO country-code -> display name map covering the seeded dataset,
// with a graceful fallback to the raw code.
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CN: "China",
  NL: "Netherlands",
  DE: "Germany",
  ES: "Spain",
  JP: "Japan",
  AU: "Australia",
  GB: "United Kingdom",
  AE: "United Arab Emirates",
  CA: "Canada",
  MX: "Mexico",
  SG: "Singapore",
  MY: "Malaysia",
  TH: "Thailand",
  ID: "Indonesia",
  IN: "India",
};

// Location strings are stored as "City, CC" (e.g. "Los Angeles, US").
function parseLocation(value: string, coordinates: GeoCoordinate | null): ShipmentLocation {
  const parts = value.split(",").map((part) => part.trim());
  const maybeCode = parts.length > 1 ? parts[parts.length - 1] : "";
  const hasCode = /^[A-Za-z]{2}$/.test(maybeCode);
  const countryCode = hasCode ? maybeCode.toUpperCase() : "";
  const display = hasCode ? parts.slice(0, -1).join(", ") : value;
  const country = countryCode ? (COUNTRY_NAMES[countryCode] ?? countryCode) : value;

  return { coordinates, display, country, countryCode };
}

function toCoordinate(lng: number | null, lat: number | null): GeoCoordinate | null {
  return lng !== null && lat !== null ? [lng, lat] : null;
}

function customerInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Lightweight carrier -> transport mode heuristic. Falls back to land.
const AIR_CARRIERS = ["emirates", "qatar", "lufthansa", "delta", "united", "air"];
const SEA_CARRIERS = ["maersk", "cosco", "msc", "evergreen", "hapag"];

function deriveMode(carrier: string | null): TransportMode {
  const value = (carrier ?? "").toLowerCase();
  if (AIR_CARRIERS.some((name) => value.includes(name))) return "air";
  if (SEA_CARRIERS.some((name) => value.includes(name))) return "sea";
  return "land";
}

const ROUTE_TYPES: Record<TransportMode, RouteType> = {
  air: "flight",
  sea: "ship",
  land: "road",
};

function formatWeight(weightKg: number | null): string {
  if (weightKg === null) return "—";
  return `${weightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`;
}

function formatEta(eta: string | null): { eta: string; etaMeta: string } {
  if (!eta) return { eta: "Pending", etaMeta: "" };
  const date = new Date(eta);
  if (Number.isNaN(date.getTime())) return { eta: "Pending", etaMeta: "" };

  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return { eta: time, etaMeta: day };
}

function deriveHandling(view: Pick<ShipmentView, "cargo">): ShipmentHandling {
  return {
    label: "Standard handling",
    note: `Handle ${view.cargo.toLowerCase()} with standard care and verify seals before handoff.`,
    tags: [
      { label: "Keep upright", icon: ArrowUp },
      { label: "Do not stack", icon: Ban },
      { label: "Secure load", icon: ShieldCheck },
      { label: "Signature required", icon: PenLine },
      { label: "Standard handoff", icon: PackageCheck },
    ].slice(0, 3),
  };
}

export function toShipmentView(shipment: Shipment): ShipmentView {
  const mode = deriveMode(shipment.carrier);
  const { eta, etaMeta } = formatEta(shipment.eta);
  const customerName = shipment.customer ?? "Unknown customer";
  const cargo = "General cargo";

  return {
    id: shipment.id,
    trackingNo: shipment.trackingNo,
    customer: {
      name: customerName,
      initials: customerInitials(customerName),
      id: shipment.trackingNo,
      tier: "Standard",
      tierLabel: "Shipment account",
    },
    origin: parseLocation(shipment.origin, toCoordinate(shipment.originLng, shipment.originLat)),
    destination: parseLocation(shipment.destination, toCoordinate(shipment.destLng, shipment.destLat)),
    current: toCoordinate(shipment.currentLng, shipment.currentLat),
    cargo,
    handling: deriveHandling({ cargo }),
    weight: formatWeight(shipment.weightKg),
    eta,
    etaMeta,
    status: toStatusLabel(shipment.status),
    progress: shipment.progress,
    mode,
    routeType: ROUTE_TYPES[mode],
    transportNumber: shipment.carrier ? `${shipment.carrier} · ${shipment.trackingNo}` : shipment.trackingNo,
  };
}
