import {
  Banknote,
  Calendar,
  ChartBar,
  CheckSquare,
  // Fingerprint,
  FolderOpen,
  Forklift,
  Gauge,
  GraduationCap,
  HeartPulse,
  Kanban,
  Landmark,
  LayoutDashboard,
  ListTodo,
  Lock,
  type LucideIcon,
  Mail,
  MessageSquare,
  ReceiptText,
  Server,
  ShoppingBag,
  // SquareArrowUpRight,
  UserRound,
  Users,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  url?: string;
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 3,
    label: "Dashboards",
    items: [
      {
        id: "finance-analyst",
        title: "Finance Analyst",
        icon: Landmark,
        badge: "new",
        subItems: [
          {
            id: "finance-analyst-overview",
            title: "Overview",
            url: "/dashboard/finance-analyst/",
            icon: Landmark,
          },
          {
            id: "finance-analyst-reports",
            title: "Reports",
            url: "/dashboard/finance-analyst/reports",
            icon: ChartBar,
          },
        ],
      },
      {
        id: "legacy-dashboards",
        title: "Dashboards",
        subItems: [
          { id: "legacy-default", title: "Default V1", url: "/dashboard/default-v1", icon: LayoutDashboard },
          {
            id: "default",
            title: "Default",
            url: "/dashboard/default",
            icon: LayoutDashboard,
          },
          { id: "legacy-crm", title: "CRM V1", url: "/dashboard/crm-v1", icon: ChartBar },
          { id: "legacy-finance", title: "Finance V1", url: "/dashboard/finance-v1", icon: Banknote },
          { id: "legacy-analytics", title: "Analytics V1", url: "/dashboard/analytics-v1", icon: Gauge },
          {
            id: "crm",
            title: "CRM",
            url: "/dashboard/crm",
            icon: ChartBar,
          },
          {
            id: "finance",
            title: "Finance",
            url: "/dashboard/finance",
            icon: Banknote,
          },
          {
            id: "analytics",
            title: "Analytics",
            url: "/dashboard/analytics",
            icon: Gauge,
          },
          {
            id: "productivity",
            title: "Productivity",
            url: "/dashboard/productivity",
            icon: ListTodo,
          },
          {
            id: "ecommerce",
            title: "E-commerce",
            url: "/dashboard/ecommerce",
            icon: ShoppingBag,
          },
          {
            id: "academy",
            title: "Academy",
            url: "/dashboard/academy",
            icon: GraduationCap,
          },
          {
            id: "logistics",
            title: "Logistics",
            url: "/dashboard/logistics",
            icon: Forklift,
          },
          {
            id: "infrastructure",
            title: "Infrastructure",
            url: "/dashboard/infrastructure",
            icon: Server,
          },
          {
            id: "file-manager",
            title: "File Manager",
            url: "/dashboard/file-manager",
            icon: FolderOpen,
          },
          {
            id: "patient-monitoring",
            title: "Patient Monitoring",
            url: "/dashboard/patient-monitoring",
            icon: HeartPulse,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "Pages",
    items: [
      {
        id: "email",
        title: "Email",
        url: "/dashboard/mail",
        icon: Mail,
      },
      {
        id: "chat",
        title: "Chat",
        url: "/dashboard/chat",
        icon: MessageSquare,
      },
      {
        id: "calendar",
        title: "Calendar",
        url: "/dashboard/calendar",
        icon: Calendar,
      },
      {
        id: "kanban",
        title: "Kanban",
        url: "/dashboard/kanban",
        icon: Kanban,
      },
      {
        id: "tasks",
        title: "Tasks",
        url: "/dashboard/tasks",
        icon: CheckSquare,
      },
      {
        id: "invoice",
        title: "Invoice",
        url: "/dashboard/invoice",
        icon: ReceiptText,
      },
      {
        id: "profile",
        title: "Profile",
        url: "/dashboard/profile",
        icon: UserRound,
      },
      {
        id: "users",
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
      },
      {
        id: "roles",
        title: "Roles",
        url: "/dashboard/roles",
        icon: Lock,
      },
      // {
      //   id: "authentication",
      //   title: "Authentication",
      //   icon: Fingerprint,
      //   subItems: [
      //     { id: "auth-login-v1", title: "Login v1", url: "/auth/v1/login", newTab: true },
      //     { id: "auth-login-v2", title: "Login v2", url: "/auth/v2/login", newTab: true },
      //     { id: "auth-register-v1", title: "Register v1", url: "/auth/v1/register", newTab: true },
      //     { id: "auth-register-v2", title: "Register v2", url: "/auth/v2/register", newTab: true },
      //     { id: "auth-forgot-v1", title: "Forgot Password v1", url: "/auth/v1/forgot-password", newTab: true },
      //     { id: "auth-forgot-v2", title: "Forgot Password v2", url: "/auth/v2/forgot-password", newTab: true },
      //     { id: "auth-otp-v1", title: "OTP v1", url: "/auth/v1/otp", newTab: true },
      //     { id: "auth-otp-v2", title: "OTP v2", url: "/auth/v2/otp", newTab: true },
      //   ],
      // },
    ],
  },
];
