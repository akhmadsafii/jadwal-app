"use client";

import * as XLSX from "xlsx-js-style";
import { getDaysInMonth } from "@/data/publicData";

interface Employee {
  id: string;
  name: string;
  nip: string;
  position?: string | null;
  sortOrder?: number | null;
  schedule: { date: string; dateKey?: string; shiftType: string }[];
}

interface MonthlyStats {
  totalWorkDays: number;
  attendanceRate: number;
  overtimeHours: number;
}

interface ExportButtonProps {
  month: number;
  year: number;
  employees: Employee[];
  monthlyStats?: MonthlyStats;
}

const shiftTypeToCode: Record<string, string> = {
  PAGI: "P",
  MIDDLE: "MID",
  SIANG: "S",
  MALAM: "M",
  LIBUR: "L",
  CUTI: "C",
  TURUN: "X",
};

const totalColumns = [
  { code: "P", label: "P" },
  { code: "S", label: "S" },
  { code: "MID", label: "Mid" },
  { code: "M", label: "M" },
  { code: "L", label: "L" },
  { code: "X", label: "X" },
  { code: "C", label: "C" },
];

const legendRows = [
  ["P", "Pagi 07:00 - 14:00"],
  ["MID", "Middle 10:00 - 17:00"],
  ["S", "Siang 14:00 - 21:00"],
  ["M", "Malam 21:00 - 07:00"],
  ["L", "Libur"],
  ["C", "Cuti"],
  ["X", "Turun Jaga"],
];

function dateKeyToDay(dateKey: string) {
  return Number(dateKey.split("-")[2]);
}

function assignmentDay(assignment: Employee["schedule"][number]) {
  if (assignment.dateKey) return dateKeyToDay(assignment.dateKey);
  return new Date(assignment.date).getDate();
}

function setCellStyle(worksheet: XLSX.WorkSheet, cellRef: string, style: XLSX.CellObject["s"]) {
  if (!worksheet[cellRef]) worksheet[cellRef] = { t: "s", v: "" };
  worksheet[cellRef].s = style;
}

export default function ExportButton({ month, year, employees, monthlyStats }: ExportButtonProps) {
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const englishMonthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];
  const dayNames = ["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"];

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();
    const daysInMonth = getDaysInMonth(year, month);
    const sortedEmployees = [...employees].sort((a, b) => {
      const sortA = a.sortOrder ?? 0;
      const sortB = b.sortOrder ?? 0;
      if (sortA !== sortB) return sortA - sortB;
      return a.name.localeCompare(b.name);
    });

    const getDayName = (day: number) => {
      return dayNames[new Date(year, month - 1, day).getDay()];
    };

    const getScheduleByDay = (employee: Employee) => {
      return new Map(
        employee.schedule.map((assignment) => [
          assignmentDay(assignment),
          assignment.shiftType,
        ])
      );
    };

    const data: (string | number | null)[][] = [];
    const dayHeaders = Array.from({ length: daysInMonth }, (_, index) => getDayName(index + 1));
    const dateHeaders = Array.from({ length: daysInMonth }, (_, index) => index + 1);

    data.push(["JADWAL DINAS FARMASI"]);
    data.push(["RSUD BUDI RAHAYU KOTA MAGELANG"]);
    data.push(["Jl. Urip Sumoharjo No. 15, Wates, Magelang Utara, Kota Magelang"]);
    data.push([]);
    data.push([]);
    data.push([month, `${englishMonthNames[month - 1]} ${year}`, ...Array(daysInMonth).fill(null), null, "Total"]);
    data.push(["NO", "NAMA", "KET", ...dayHeaders, "", ...totalColumns.map((item) => item.label)]);
    data.push(["", "", "", ...dateHeaders, "", ...totalColumns.map((item) => item.label)]);

    sortedEmployees.forEach((employee, index) => {
      const scheduleByDay = getScheduleByDay(employee);
      const scheduleRow: (string | number | null)[] = [
        index + 1,
        employee.name,
        employee.position || "",
      ];

      for (let day = 1; day <= daysInMonth; day++) {
        const shiftType = scheduleByDay.get(day) || "LIBUR";
        scheduleRow.push(shiftTypeToCode[shiftType] || "L");
      }

      scheduleRow.push("");
      scheduleRow.push(...Array(totalColumns.length).fill(null));
      data.push(scheduleRow);
      data.push(["", employee.nip ? `NIP. ${employee.nip}` : "", "", ...Array(daysInMonth + 1 + totalColumns.length).fill(null)]);
    });

    data.push([]);
    data.push(["JUMLAH ORANG PER TANGGAL"]);
    totalColumns.forEach((shift) => {
      data.push(["", shift.label, "", ...Array(daysInMonth).fill(null), "", ...Array(totalColumns.length).fill(null)]);
    });

    data.push([]);
    data.push(["RINGKASAN"]);
    data.push(["Total Staff", `${sortedEmployees.length} orang`]);
    data.push(["Total Hari Kerja", `${monthlyStats?.totalWorkDays || 0} hari`]);
    data.push(["Persentase Kehadiran", `${monthlyStats?.attendanceRate || 0}%`]);
    data.push(["Total Jam Lembur", `${monthlyStats?.overtimeHours || 0} jam`]);
    data.push([]);
    data.push(["KODE SHIFT"]);
    legendRows.forEach((row) => data.push(row));
    data.push([]);
    data.push([]);
    data.push([]);
    data.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Magelang, " + daysInMonth + " " + monthNames[month - 1] + " " + year]);
    data.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Kepala Instalasi Farmasi"]);
    data.push([]);
    data.push([]);
    data.push([]);
    data.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "(....................................)"]);

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const dayStartCol = 3;
    const dayEndCol = dayStartCol + daysInMonth - 1;
    const spacerCol = dayEndCol + 1;
    const totalStartCol = spacerCol + 1;
    const lastColIndex = totalStartCol + totalColumns.length - 1;
    const lastCol = XLSX.utils.encode_col(lastColIndex);
    const scheduleStartRow = 9;
    const scheduleEndRow = scheduleStartRow + sortedEmployees.length * 2 - 1;
    const countTitleRow = scheduleEndRow + 2;
    const countStartRow = countTitleRow + 1;
    const summaryTitleRow = countStartRow + totalColumns.length + 1;
    const legendTitleRow = summaryTitleRow + 6;
    const signatureStartRow = legendTitleRow + legendRows.length + 4;

    sortedEmployees.forEach((employee, index) => {
      const excelRow = scheduleStartRow + index * 2;
      const dayStart = XLSX.utils.encode_cell({ r: excelRow - 1, c: dayStartCol });
      const dayEnd = XLSX.utils.encode_cell({ r: excelRow - 1, c: dayEndCol });

      totalColumns.forEach((shift, shiftIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: excelRow - 1, c: totalStartCol + shiftIndex });
        worksheet[cellRef] = { t: "n", f: `COUNTIF(${dayStart}:${dayEnd},"${shift.code}")` };
      });
    });

    totalColumns.forEach((shift, shiftIndex) => {
      const excelRow = countStartRow + shiftIndex;
      for (let day = 1; day <= daysInMonth; day++) {
        const colIndex = dayStartCol + day - 1;
        const col = XLSX.utils.encode_col(colIndex);
        const cellRef = XLSX.utils.encode_cell({ r: excelRow - 1, c: colIndex });
        worksheet[cellRef] = { t: "n", f: `COUNTIF(${col}${scheduleStartRow}:${col}${scheduleEndRow},"${shift.code}")` };
      }
    });

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 36 },
      { wch: 7, hidden: true },
      ...Array.from({ length: daysInMonth }, () => ({ wch: 4 })),
      { wch: 4, hidden: true },
      ...Array.from({ length: totalColumns.length }, (_, index) => ({ wch: index === 2 ? 6 : 4 })),
    ];

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: dayEndCol } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: dayEndCol } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: dayEndCol } },
      { s: { r: 5, c: 1 }, e: { r: 5, c: dayEndCol } },
      { s: { r: 5, c: totalStartCol }, e: { r: 5, c: lastColIndex } },
      { s: { r: 6, c: 0 }, e: { r: 7, c: 0 } },
      { s: { r: 6, c: 1 }, e: { r: 7, c: 1 } },
      { s: { r: 6, c: 2 }, e: { r: 7, c: 2 } },
      { s: { r: countTitleRow - 1, c: 0 }, e: { r: countTitleRow - 1, c: dayEndCol } },
      { s: { r: summaryTitleRow - 1, c: 0 }, e: { r: summaryTitleRow - 1, c: 2 } },
      { s: { r: legendTitleRow - 1, c: 0 }, e: { r: legendTitleRow - 1, c: 1 } },
      { s: { r: signatureStartRow - 1, c: 21 }, e: { r: signatureStartRow - 1, c: Math.min(31, lastColIndex) } },
      { s: { r: signatureStartRow, c: 21 }, e: { r: signatureStartRow, c: Math.min(31, lastColIndex) } },
      { s: { r: signatureStartRow + 4, c: 21 }, e: { r: signatureStartRow + 4, c: Math.min(31, lastColIndex) } },
    ];

    sortedEmployees.forEach((_, index) => {
      const nipRow = scheduleStartRow + index * 2 + 1;
      worksheet["!merges"]!.push({ s: { r: nipRow - 1, c: 1 }, e: { r: nipRow - 1, c: 2 } });
    });

    worksheet["!rows"] = [
      { hpt: 24 },
      { hpt: 20 },
      { hpt: 18 },
      { hpt: 8 },
      { hpt: 8 },
      { hpt: 22 },
      { hpt: 18 },
      { hpt: 18 },
      ...Array.from({ length: sortedEmployees.length * 2 }, (_, index) => ({ hpt: index % 2 === 0 ? 20 : 16 })),
    ];
    worksheet["!freeze"] = { xSplit: 3, ySplit: 8, topLeftCell: "D9", activePane: "bottomRight", state: "frozen" } as any;
    const colors = {
      green: "3F7548",
      lightGreen: "D4E8D7",
      mediumGreen: "7EBA88",
      magenta: "FF66FF",
      grid: "808080",
      white: "FFFFFF",
    };
    const baseFont = { name: "Arial", sz: 9, color: { rgb: "000000" } };
    const border = {
      top: { style: "thin", color: { rgb: colors.grid } },
      bottom: { style: "thin", color: { rgb: colors.grid } },
      left: { style: "thin", color: { rgb: colors.grid } },
      right: { style: "thin", color: { rgb: colors.grid } },
    };
    const headerStyle = {
      fill: { patternType: "solid", fgColor: { rgb: colors.lightGreen } },
      font: { ...baseFont, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border,
    };
    const dateStyle = {
      fill: { patternType: "solid", fgColor: { rgb: colors.white } },
      font: { ...baseFont, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border,
    };
    const specialDateStyle = {
      fill: { patternType: "solid", fgColor: { rgb: colors.magenta } },
      font: { ...baseFont, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border,
    };
    const sectionStyle = {
      fill: { patternType: "solid", fgColor: { rgb: colors.green } },
      font: { ...baseFont, bold: true, color: { rgb: colors.white } },
      alignment: { horizontal: "center", vertical: "center" },
      border,
    };
    const titleStyle = {
      font: { name: "Arial", bold: true, sz: 13 },
      alignment: { horizontal: "center" },
    };
    const subtitleStyle = {
      font: { name: "Arial", bold: true, sz: 10 },
      alignment: { horizontal: "center" },
    };
    const totalStyle = {
      fill: { patternType: "solid", fgColor: { rgb: colors.lightGreen } },
      font: { ...baseFont, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border,
    };

    setCellStyle(worksheet, "A1", titleStyle);
    setCellStyle(worksheet, "A2", subtitleStyle);
    setCellStyle(worksheet, "A3", subtitleStyle);
    setCellStyle(worksheet, "A6", sectionStyle);
    setCellStyle(worksheet, "B6", sectionStyle);
    setCellStyle(worksheet, `${XLSX.utils.encode_col(totalStartCol)}6`, headerStyle);
    setCellStyle(worksheet, `A${countTitleRow}`, sectionStyle);
    setCellStyle(worksheet, `A${summaryTitleRow}`, sectionStyle);
    setCellStyle(worksheet, `A${legendTitleRow}`, sectionStyle);

    for (let col = 0; col <= lastColIndex; col++) {
      const dayNumber = col - dayStartCol + 1;
      const isSpecialDate = dayNumber === 1 || (dayNumber >= 1 && dayNumber <= daysInMonth && new Date(year, month - 1, dayNumber).getDay() === 0);
      const colName = XLSX.utils.encode_col(col);
      const headerForCol = col >= totalStartCol ? totalStyle : headerStyle;
      setCellStyle(worksheet, `${colName}7`, col >= dayStartCol && col <= dayEndCol && isSpecialDate ? specialDateStyle : headerForCol);
      setCellStyle(worksheet, `${colName}8`, col >= dayStartCol && col <= dayEndCol ? (isSpecialDate ? specialDateStyle : dateStyle) : headerForCol);
    }

    sortedEmployees.forEach((employee, employeeIndex) => {
      const row = scheduleStartRow + employeeIndex * 2;
      const nipRow = row + 1;

      for (let col = 0; col <= lastColIndex; col++) {
        const colName = XLSX.utils.encode_col(col);
        setCellStyle(worksheet, `${colName}${row}`, {
          fill: { patternType: "solid", fgColor: { rgb: col >= totalStartCol ? colors.lightGreen : colors.white } },
          font: { ...baseFont, bold: col === 1 },
          alignment: { horizontal: col === 0 || col >= dayStartCol ? "center" : "left", vertical: "center" },
          border,
        });
        setCellStyle(worksheet, `${colName}${nipRow}`, {
          fill: { patternType: "solid", fgColor: { rgb: colors.white } },
          font: { name: "Arial", italic: true, sz: 9, color: { rgb: "000000" } },
          alignment: { horizontal: col === 1 ? "left" : "center", vertical: "center" },
          border,
        });
      }

      const scheduleByDay = getScheduleByDay(employee);
      for (let day = 1; day <= daysInMonth; day++) {
        const shiftType = scheduleByDay.get(day) || "LIBUR";
        const code = shiftTypeToCode[shiftType] || "L";
        const isSpecialDate = day === 1 || new Date(year, month - 1, day).getDay() === 0;
        setCellStyle(worksheet, `${XLSX.utils.encode_col(dayStartCol + day - 1)}${row}`, {
          alignment: { horizontal: "center", vertical: "center" },
          fill: { patternType: "solid", fgColor: { rgb: isSpecialDate ? colors.magenta : colors.white } },
          font: { ...baseFont, bold: true },
          border,
        });
      }

      totalColumns.forEach((shift, shiftIndex) => {
        setCellStyle(worksheet, `${XLSX.utils.encode_col(totalStartCol + shiftIndex)}${row}`, {
          alignment: { horizontal: "center", vertical: "center" },
          fill: { patternType: "solid", fgColor: { rgb: colors.lightGreen } },
          font: { ...baseFont, bold: true },
          border,
        });
      });
    });

    totalColumns.forEach((shift, shiftIndex) => {
      const row = countStartRow + shiftIndex;
      setCellStyle(worksheet, `B${row}`, {
        fill: { patternType: "solid", fgColor: { rgb: colors.lightGreen } },
        font: { ...baseFont, bold: true },
        alignment: { horizontal: "center" },
        border,
      });
      for (let col = 0; col <= lastColIndex; col++) {
        const cell = `${XLSX.utils.encode_col(col)}${row}`;
        setCellStyle(worksheet, cell, {
          fill: { patternType: "solid", fgColor: { rgb: colors.lightGreen } },
          font: { ...baseFont, bold: true },
          alignment: { horizontal: "center" },
          border,
        });
      }
    });

    for (let row = summaryTitleRow + 1; row <= summaryTitleRow + 4; row++) {
      setCellStyle(worksheet, `A${row}`, {
        fill: { patternType: "solid", fgColor: { rgb: colors.lightGreen } },
        font: { ...baseFont, bold: true },
        border,
      });
      setCellStyle(worksheet, `B${row}`, {
        fill: { patternType: "solid", fgColor: { rgb: colors.white } },
        font: baseFont,
        alignment: { horizontal: "right" },
        border,
      });
    }

    legendRows.forEach((legend, index) => {
      const row = legendTitleRow + index + 1;
      setCellStyle(worksheet, `A${row}`, {
        fill: { patternType: "solid", fgColor: { rgb: colors.lightGreen } },
        font: { ...baseFont, bold: true },
        alignment: { horizontal: "center" },
        border,
      });
      setCellStyle(worksheet, `B${row}`, {
        fill: { patternType: "solid", fgColor: { rgb: colors.white } },
        font: baseFont,
        border,
      });
    });

    for (let row = signatureStartRow; row <= signatureStartRow + 4; row++) {
      for (let col = 21; col <= Math.min(31, lastColIndex); col++) {
        setCellStyle(worksheet, `${XLSX.utils.encode_col(col)}${row}`, {
          font: baseFont,
          alignment: { horizontal: "center", vertical: "center" },
        });
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, `${monthNames[month - 1]} ${year}`);
    XLSX.writeFile(workbook, `Jadwal_APOTEK_${monthNames[month - 1]}_${year}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
    >
      <span className="material-symbols-outlined text-lg">download</span>
      Export Excel
    </button>
  );
}
