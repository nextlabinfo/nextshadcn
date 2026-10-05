import type { getInfraKpis } from "@/server/infra-actions";

export type InfraKpis = Awaited<ReturnType<typeof getInfraKpis>>;
