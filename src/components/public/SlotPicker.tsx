"use client";

import { useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface SlotPickerProps {
  slots: string[];
  tz: string;
  onConfirm: (slotIso: string) => void;
  loading?: boolean;
}

export function SlotPicker({ slots, tz, onConfirm, loading }: SlotPickerProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center py-12">
        <p className="text-on-surface-variant text-sm">No available times</p>
      </div>
    );
  }

  const handleConfirm = () => {
    if (selectedSlot) {
      onConfirm(selectedSlot);
    }
  };

  return (
    <div className="flex flex-col gap-3 overflow-y-auto max-h-[480px] pr-2">
      {slots.map((slot) => {
        const isSelected = slot === selectedSlot;
        const displayTime = formatInTimeZone(new Date(slot), tz, "h:mm a");

        return (
          <div key={slot}>
            {isSelected ? (
              // Split button layout when selected
              <div className="flex gap-2">
                <button
                  className="flex-1 h-11 bg-on-surface-variant text-white font-bold rounded-lg"
                  disabled
                >
                  {displayTime}
                </button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirm}
                  loading={loading}
                  className="flex-1"
                >
                  Confirm
                </Button>
              </div>
            ) : (
              // Regular slot button
              <button
                onClick={() => setSelectedSlot(slot)}
                className={cn(
                  "w-full h-11 font-bold rounded-lg transition-all duration-200",
                  "border border-primary/20 bg-surface-container-lowest text-primary",
                  "hover:border-primary"
                )}
              >
                {displayTime}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
