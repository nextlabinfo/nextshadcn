"use client";

import * as React from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Shipment } from "@/lib/dashboards/types";

import { ShipmentDetails } from "./shipment-details";
import { ShipmentList } from "./shipment-list";
import { toShipmentView } from "./shipment-view";

type LogisticsProps = {
  shipments: Shipment[];
};

export function Logistics({ shipments }: LogisticsProps) {
  const shipmentViews = React.useMemo(() => shipments.map(toShipmentView), [shipments]);

  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = React.useState<string | null>(shipmentViews[0]?.id ?? null);
  const selectedShipment =
    shipmentViews.find((shipment) => shipment.id === selectedShipmentId) ?? shipmentViews[0] ?? null;

  function handleSelectShipment(shipmentId: string) {
    setSelectedShipmentId(shipmentId);

    if (window.innerWidth < 1024) {
      setDetailsOpen(true);
    }
  }

  return (
    <>
      <div
        data-content-padding="false"
        className="grid h-[calc(100dvh-var(--dashboard-header-height))] overflow-hidden lg:grid-cols-[400px_minmax(0,1fr)] lg:divide-x"
      >
        <div className="h-full overflow-hidden">
          <ShipmentList
            shipments={shipmentViews}
            selectedShipmentId={selectedShipmentId}
            onSelectShipment={handleSelectShipment}
          />
        </div>
        <div className="hidden h-full overflow-hidden lg:block">
          <ShipmentDetails shipment={selectedShipment} />
        </div>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side="right"
          className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:md:w-3/4"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>
              {selectedShipment ? `Shipment ${selectedShipment.trackingNo}` : "Shipment details"}
            </SheetTitle>
            <SheetDescription>Selected shipment details and route map.</SheetDescription>
          </SheetHeader>
          <ShipmentDetails shipment={selectedShipment} />
        </SheetContent>
      </Sheet>
    </>
  );
}
