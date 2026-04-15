"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { formatLocalDate } from "@/lib/time";

interface MonthCalendarProps {
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  availableDates?: Set<string>;
  month: Date;
  onMonthChange: (direction: "prev" | "next") => void;
}

export function MonthCalendar({
  value,
  onChange,
  minDate,
  availableDates,
  month,
  onMonthChange,
}: MonthCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());

  const cells: (Date | null)[] = [];
  const current = new Date(startDate);
  while (current <= monthEnd) {
    cells.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Pad to 42 cells (6 rows x 7 cols)
  while (cells.length < 42) {
    cells.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const isDateDisabled = (date: Date): boolean => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (minDate) {
      const minDateOnly = new Date(minDate);
      minDateOnly.setHours(0, 0, 0, 0);
      if (dateOnly < minDateOnly) return true;
    }

    if (availableDates) {
      // availableDates is keyed on LOCAL YYYY-MM-DD, so match it the same way.
      const dateStr = formatLocalDate(dateOnly);
      return !availableDates.has(dateStr);
    }

    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!value) return false;
    const valueOnly = new Date(value);
    valueOnly.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return valueOnly.getTime() === dateOnly.getTime();
  };

  const isDateInCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
  };

  const monthName = month.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      {/* Header with month/year and nav buttons */}
      <div className="flex items-center justify-between">
        <h3 className="text-on-surface font-bold text-lg">{monthName}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => onMonthChange("prev")}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
            aria-label="Previous month"
          >
            <Icon name="chevron_left" />
          </button>
          <button
            onClick={() => onMonthChange("next")}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
            aria-label="Next month"
          >
            <Icon name="chevron_right" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} />;

          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const inMonth = isDateInCurrentMonth(date);
          const isToday = date.getTime() === today.getTime();

          return (
            <button
              key={idx}
              onClick={() => !disabled && onChange(date)}
              disabled={disabled}
              className={cn(
                "h-11 flex items-center justify-center text-sm font-semibold rounded-full transition-colors",
                // Disabled state
                disabled && "text-on-surface-variant/40 cursor-not-allowed opacity-40",
                // Out of month state
                !inMonth && "text-on-surface-variant/30",
                // In month, not selected
                inMonth && !selected && !disabled && "text-primary bg-surface-container-low hover:bg-primary-container/10",
                // Selected state
                selected && "bg-primary text-on-primary shadow-md shadow-primary/20",
                // Today ring (if in month and not selected)
                isToday && !selected && inMonth && "ring-2 ring-primary"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
