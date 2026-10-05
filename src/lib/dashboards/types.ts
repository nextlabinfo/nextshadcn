// Shared types for the dashboard data layer (consumed by pages + action files).

// ---------------- CRM ----------------
export interface CrmLead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  stage: string;
  value: number;
  source: string | null;
  owner: string | null;
  createdAt: string;
}
export interface CrmOpportunity {
  id: string;
  name: string;
  account: string;
  stage: string;
  amount: number;
  probability: number;
  closeDate: string | null;
  owner: string | null;
}
export interface CrmActivity {
  id: string;
  type: string;
  subject: string;
  relatedTo: string | null;
  owner: string | null;
  dueDate: string | null;
  status: string;
}
export interface CrmKpis {
  pipelineValue: number;
  wonValue: number;
  openOpportunities: number;
  leadCount: number;
  winRatePct: number;
}

// ---------------- E-commerce ----------------
export interface ShopKpis {
  revenue: number;
  orders: number;
  avgOrderValue: number;
  unitsSold: number;
  refundRatePct: number;
}
export interface ShopProduct {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  price: number;
  stock: number;
  status: string;
  unitsSold: number;
}
export interface ShopOrder {
  id: string;
  orderNo: string;
  customerName: string | null;
  status: string;
  total: number;
  placedAt: string;
}
export interface ShopReview {
  id: string;
  productName: string | null;
  customerName: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
}
export interface TrafficSourceSlice {
  source: string;
  visitors: number;
  orders: number;
  revenue: number;
}

// ---------------- Personal finance ----------------
export interface PfAccount {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  balance: number;
}
export interface PfWallet {
  id: string;
  name: string;
  balance: number;
  color: string;
  last4: string | null;
  brand: string | null;
}
export interface PfTransaction {
  id: string;
  description: string;
  merchant: string | null;
  amount: number;
  direction: string;
  status: string;
  txnDate: string;
  categoryName: string | null;
}
export interface PfCategorySlice {
  name: string;
  kind: string;
  total: number;
  color: string;
}
export interface PfOverview {
  netWorth: number;
  availableCash: number;
  monthlySpend: number;
  monthlyIncome: number;
  savingsRatePct: number;
}

// ---------------- Logistics ----------------
export interface Shipment {
  id: string;
  trackingNo: string;
  customer: string | null;
  origin: string;
  destination: string;
  carrier: string | null;
  status: string;
  progress: number;
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
  currentLat: number | null;
  currentLng: number | null;
  eta: string | null;
  weightKg: number | null;
}

// ---------------- Infrastructure ----------------
export interface InfraEnvironment {
  id: string;
  name: string;
  status: string;
  url: string | null;
  region: string | null;
  commitSha: string | null;
  commitMessage: string | null;
  branch: string | null;
  deployedBy: string | null;
  lastDeployAt: string | null;
  uptimePct: number;
}
export interface InfraProject {
  id: string;
  name: string;
  framework: string | null;
  repo: string | null;
  environments: InfraEnvironment[];
}

// ---------------- Patient monitoring ----------------
export interface PatientVital {
  measuredAt: string;
  heartRate: number | null;
  spo2: number | null;
  respRate: number | null;
  temperature: number | null;
  systolic: number | null;
  diastolic: number | null;
}
export interface Patient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  room: string | null;
  condition: string | null;
  status: string;
  latest: PatientVital | null;
  series: PatientVital[];
}

// ---------------- Academy ----------------
export interface Course {
  id: string;
  title: string;
  instructor: string | null;
  category: string | null;
  lessons: number;
  students: number;
  rating: number;
  status: string;
}
export interface Assignment {
  id: string;
  courseTitle: string | null;
  title: string;
  dueDate: string | null;
  submitted: number;
  total: number;
  status: string;
}
export interface AcademyEvent {
  id: string;
  title: string;
  kind: string;
  location: string | null;
  startAt: string;
  endAt: string | null;
}
export interface AcademyKpis {
  totalStudents: number;
  activeCourses: number;
  avgRating: number;
  assignmentsDue: number;
}

// ---------------- File manager ----------------
export interface FmFolder {
  id: string;
  name: string;
  fileCount: number;
  sizeBytes: number;
}
export interface FmFile {
  id: string;
  folderName: string | null;
  name: string;
  kind: string;
  sizeBytes: number;
  owner: string | null;
  starred: boolean;
  updatedAt: string;
}
export interface FmStorage {
  usedBytes: number;
  fileCount: number;
  folderCount: number;
}

// ---------------- Invoices ----------------
export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
}
export interface InvoiceClient {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  address: string | null;
}
export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  client: InvoiceClient | null;
  issueDate: string;
  dueDate: string;
  status: string;
  taxRate: number;
  discount: number;
  notes: string | null;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
}

// ---------------- Productivity ----------------
export interface ProdProject {
  id: string;
  name: string;
  color: string;
  progress: number;
  status: string;
  dueDate: string | null;
}
export interface ProdNote {
  id: string;
  title: string;
  body: string | null;
  pinned: boolean;
  createdAt: string;
}

// ---------------- Analytics ----------------
export interface TrafficPoint {
  day: string;
  visitors: number;
  pageviews: number;
  sessions: number;
}
export interface AnalyticsKpis {
  visitors: number;
  pageviews: number;
  sessions: number;
  avgBounceRate: number;
  avgDurationSec: number;
  visitorsDeltaPct: number;
}
export interface AnalyticsPage {
  path: string;
  views: number;
  uniqueViews: number;
  avgTimeSec: number;
  bounceRate: number;
}
export interface AnalyticsSource {
  source: string;
  kind: string;
  sessions: number;
  share: number;
}

// ---------------- Default overview ----------------
export interface OverviewMetrics {
  revenue: number;
  revenueDeltaPct: number;
  orders: number;
  customers: number;
  visitors: number;
  newCustomersSeries: { day: string; count: number }[];
  recentCustomers: { name: string; email: string | null; createdAt: string }[];
}
