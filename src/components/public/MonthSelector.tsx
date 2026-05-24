"use client";

import { useState, useEffect, useRef } from "react";
import { getCurrentMonthInfo } from "@/data/publicData";

interface MonthSelectorProps {
  onMonthChange?: (month: number, year: number) => void;
  selectedMonth?: number;
  selectedYear?: number;
}

export default function MonthSelector({ onMonthChange, selectedMonth, selectedYear }: MonthSelectorProps) {
  // Use external state if provided, otherwise use internal state
  const initialDate = selectedMonth && selectedYear
    ? new Date(selectedYear, selectedMonth - 1, 1)
    : new Date();

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [monthInfo, setMonthInfo] = useState(getCurrentMonthInfo(initialDate));
  const onMonthChangeRef = useRef(onMonthChange);
  const hasInitialized = useRef(false);

  // Keep ref updated
  useEffect(() => {
    onMonthChangeRef.current = onMonthChange;
  }, [onMonthChange]);

  // Sync with external state changes
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      const newDate = new Date(selectedYear, selectedMonth - 1, 1);
      if (newDate.getTime() !== currentDate.getTime()) {
        setCurrentDate(newDate);
        setMonthInfo(getCurrentMonthInfo(newDate));
      }
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    setMonthInfo(getCurrentMonthInfo(currentDate));
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      onMonthChangeRef.current?.(currentDate.getMonth() + 1, currentDate.getFullYear());
    }
  }, [currentDate]);

  const goToPrevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      setMonthInfo(getCurrentMonthInfo(newDate));
      onMonthChangeRef.current?.(newDate.getMonth() + 1, newDate.getFullYear());
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      setMonthInfo(getCurrentMonthInfo(newDate));
      onMonthChangeRef.current?.(newDate.getMonth() + 1, newDate.getFullYear());
      return newDate;
    });
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentDate(now);
    setMonthInfo(getCurrentMonthInfo(now));
    onMonthChangeRef.current?.(now.getMonth() + 1, now.getFullYear());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return (
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getFullYear() === now.getFullYear()
    );
  };

  return (
    <section className="bg-surface-container-lowest px-container-margin py-4 border-b border-outline-variant flex items-center justify-between">
      <button
        onClick={goToPrevMonth}
        className="material-symbols-outlined text-secondary hover:bg-surface-container-low p-2 rounded-lg active:scale-90 transition-all"
        aria-label="Previous month"
      >
        chevron_left
      </button>
      <div className="text-center min-w-40">
        <h1 className="text-lg font-semibold text-on-surface">
          {monthInfo.name} {monthInfo.year}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <p className="text-xs text-outline uppercase tracking-wider">
            {monthInfo.subtitle}
          </p>
          {!isCurrentMonth() && (
            <button
              onClick={goToCurrentMonth}
              className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
            >
              Bulan ini
            </button>
          )}
        </div>
      </div>
      <button
        onClick={goToNextMonth}
        className="material-symbols-outlined text-secondary hover:bg-surface-container-low p-2 rounded-lg active:scale-90 transition-all"
        aria-label="Next month"
      >
        chevron_right
      </button>
    </section>
  );
}