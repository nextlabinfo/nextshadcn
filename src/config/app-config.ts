import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "NEXT Ventures FP&A",
  version: packageJson.version,
  copyright: `© ${currentYear}, NEXT Ventures FP&A.`,
  meta: {
    title: "NEXT Ventures FP&A: Financial Admin Dashboard with BI & Analytics",
    description:
      "A polished financial admin dashboard with business intelligence and analytics capabilities.",
  },
};
