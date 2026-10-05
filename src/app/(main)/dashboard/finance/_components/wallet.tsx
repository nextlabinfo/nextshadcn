import { CreditCard } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PfWallet } from "@/lib/dashboards/types";
import { formatCurrency } from "@/lib/utils";

export function Wallet({ wallets }: { wallets: PfWallet[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Wallet</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm leading-none">
                    {wallet.name}
                    {wallet.last4 ? ` • **** ${wallet.last4}` : ""}
                  </span>
                </div>
                <span className="font-normal text-muted-foreground text-xs">{formatCurrency(wallet.balance)}</span>
              </div>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
                <CreditCard className="size-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[10px] text-muted-foreground">
              Physical Vault: <span className="text-foreground">Ledger Nano X</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="font-bold text-[9px] text-green-500 uppercase tracking-widest">Air-Gapped</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
