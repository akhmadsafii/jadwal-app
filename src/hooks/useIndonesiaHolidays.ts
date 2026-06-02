"use client";

import { useEffect, useMemo, useState } from "react";

export interface IndonesiaHoliday {
  dateKey: string;
  name: string;
  type: string;
}

export function useIndonesiaHolidays(year: number) {
  const [holidays, setHolidays] = useState<IndonesiaHoliday[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/holidays?year=${year}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled) {
          setHolidays(data?.holidays || []);
        }
      })
      .catch(() => {
        if (!cancelled) setHolidays([]);
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  return useMemo(() => {
    return new Map(holidays.map((holiday) => [holiday.dateKey, holiday]));
  }, [holidays]);
}
