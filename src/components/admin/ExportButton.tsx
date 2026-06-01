"use client";

import * as XLSX from "xlsx";
import { getDaysInMonth } from "@/data/publicData";

interface Employee {
  id: string;
  name: string;
  nip: string;
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

const shiftRows = [
  { key: "PAGI", code: "P", label: "Jumlah Pagi", bg: "FFF2CC", fg: "806000" },
  { key: "MIDDLE", code: "MID", label: "Jumlah Middle", bg: "FCE4D6", fg: "843C0C" },
  { key: "SIANG", code: "S", label: "Jumlah Siang", bg: "DDEBF7", fg: "1F4E79" },
  { key: "MALAM", code: "M", label: "Jumlah Malam", bg: "E4DFEC", fg: "4B3F6B" },
  { key: "LIBUR", code: "L", label: "Jumlah Libur", bg: "E2EFDA", fg: "375623" },
  { key: "CUTI", code: "C", label: "Jumlah Cuti", bg: "F4B084", fg: "843C0C" },
  { key: "TURUN", code: "X", label: "Jumlah Turun", bg: "D6DCE4", fg: "333333" },
];

function dateKeyToDay(dateKey: string) {
  return Number(dateKey.split("-")[2]);
}

function assignmentDay(assignment: Employee["schedule"][number]) {
  if (assignment.dateKey) return dateKeyToDay(assignment.dateKey);
  return new Date(assignment.date).getDate();
}

export default function ExportButton({ month, year, employees, monthlyStats }: ExportButtonProps) {
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();
    const daysInMonth = getDaysInMonth(year, month);

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

    const getShiftCountsForDay = (day: number) => {
      const counts: Record<string, number> = {
        PAGI: 0,
        MIDDLE: 0,
        SIANG: 0,
        MALAM: 0,
        LIBUR: 0,
        CUTI: 0,
        TURUN: 0,
      };

      employees.forEach((employee) => {
        const scheduleByDay = getScheduleByDay(employee);
        const shift = scheduleByDay.get(day) || "LIBUR";
        counts[shift] = (counts[shift] || 0) + 1;
      });

      return counts;
    };

    const data: (string | number)[][] = [];

    data.push(["LAPORAN JADWAL SHIFT APOTEK"]);
    data.push(["RS BUDI RAHAYU KOTA MAGELANG"]);
    data.push([`Periode: ${monthNames[month - 1]} ${year}`]);
    data.push([]);

    data.push(["JADWAL SHIFT"]);
    data.push(["NO", "NAMA", "NIP", ...Array.from({ length: daysInMonth }, (_, index) => getDayName(index + 1))]);
    data.push(["", "", "", ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]);

    employees.forEach((employee, index) => {
      const scheduleByDay = getScheduleByDay(employee);
      const row: (string | number)[] = [index + 1, employee.name, employee.nip];

      for (let day = 1; day <= daysInMonth; day++) {
        const shiftType = scheduleByDay.get(day) || "LIBUR";
        row.push(shiftTypeToCode[shiftType] || "L");
      }

      data.push(row);
    });

    data.push([]);
    data.push(["JUMLAH SHIFT PER TANGGAL"]);

    shiftRows.forEach((shift) => {
      const row: (string | number)[] = ["", shift.label, ""];
      for (let day = 1; day <= daysInMonth; day++) {
        row.push(getShiftCountsForDay(day)[shift.key] || 0);
      }
      data.push(row);
    });

    data.push([]);
    data.push(["RINGKASAN BULANAN"]);
    data.push(["Total Hari Kerja", `${monthlyStats?.totalWorkDays || 0} Hari`]);
    data.push(["Persentase Kehadiran", `${monthlyStats?.attendanceRate || 0}%`]);
    data.push(["Total Jam Lembur", `${monthlyStats?.overtimeHours || 0} Jam`]);
    data.push(["Total Staff", `${employees.length} Org`]);
    data.push([]);
    data.push(["KODE SHIFT"]);
    data.push(["P", "Pagi 07:00 - 14:00"]);
    data.push(["MID", "Middle 10:00 - 17:00"]);
    data.push(["S", "Siang 14:00 - 21:00"]);
    data.push(["M", "Malam 21:00 - 07:00"]);
    data.push(["L", "Libur"]);
    data.push(["C", "Cuti"]);
    data.push(["X", "Turun Jaga"]);

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 32 },
      { wch: 16 },
      ...Array.from({ length: daysInMonth }, () => ({ wch: 5 })),
    ];

    const setCellStyle = (cellRef: string, style: XLSX.CellObject["s"]) => {
      if (!worksheet[cellRef]) worksheet[cellRef] = { t: "s", v: "" };
      worksheet[cellRef].s = style;
    };

    const lastCol = XLSX.utils.encode_col(daysInMonth + 2);
    const border = {
      top: { style: "thin", color: { rgb: "B7C3D0" } },
      bottom: { style: "thin", color: { rgb: "B7C3D0" } },
      left: { style: "thin", color: { rgb: "B7C3D0" } },
      right: { style: "thin", color: { rgb: "B7C3D0" } },
    };
    const titleStyle = {
      fill: { fgColor: { rgb: "1F4E79" } },
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center" },
    };
    const subtitleStyle = {
      fill: { fgColor: { rgb: "D9EAF7" } },
      font: { bold: true, color: { rgb: "1F4E79" } },
      alignment: { horizontal: "center" },
    };
    const sectionStyle = {
      fill: { fgColor: { rgb: "244062" } },
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "left" },
    };
    const headerStyle = {
      fill: { fgColor: { rgb: "1F4E79" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center" },
      border,
    };
    const dateStyle = {
      fill: { fgColor: { rgb: "D9E2F3" } },
      font: { bold: true, sz: 8 },
      alignment: { horizontal: "center" },
      border,
    };

    setCellStyle("A1", titleStyle);
    setCellStyle("A2", subtitleStyle);
    setCellStyle("A3", subtitleStyle);
    setCellStyle("A5", sectionStyle);

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: daysInMonth + 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: daysInMonth + 2 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: daysInMonth + 2 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: daysInMonth + 2 } },
    ];
    worksheet["!rows"] = [
      { hpt: 24 },
      { hpt: 20 },
      { hpt: 20 },
      { hpt: 6 },
      { hpt: 22 },
      { hpt: 18 },
    ];
    worksheet["!freeze"] = { xSplit: 3, ySplit: 6, topLeftCell: "D7", activePane: "bottomRight", state: "frozen" } as any;
    worksheet["!autofilter"] = { ref: `A6:${lastCol}${7 + employees.length}` };

    const dayHeaderRow = 6;
    const dateHeaderRow = 7;
    const scheduleStartRow = 8;
    const totalTitleRow = scheduleStartRow + employees.length + 1;
    const totalStartRow = totalTitleRow + 1;
    const summaryTitleRow = totalStartRow + shiftRows.length + 1;
    const legendTitleRow = summaryTitleRow + 6;

    for (let col = 0; col < 3 + daysInMonth; col++) {
      setCellStyle(`${XLSX.utils.encode_col(col)}${dayHeaderRow}`, headerStyle);
      setCellStyle(`${XLSX.utils.encode_col(col)}${dateHeaderRow}`, col < 3 ? headerStyle : dateStyle);
    }

    employees.forEach((employee, employeeIndex) => {
      const row = scheduleStartRow + employeeIndex;
      const baseFill = employeeIndex % 2 === 0 ? "FFFFFF" : "F8FAFC";
      ["A", "B", "C"].forEach((col) => {
        setCellStyle(`${col}${row}`, {
          fill: { fgColor: { rgb: baseFill } },
          font: { bold: col === "B" },
          alignment: { horizontal: col === "A" ? "center" : "left" },
          border,
        });
      });
    });

    employees.forEach((employee, employeeIndex) => {
      const scheduleByDay = getScheduleByDay(employee);
      for (let day = 1; day <= daysInMonth; day++) {
        const shiftType = scheduleByDay.get(day) || "LIBUR";
        const code = shiftTypeToCode[shiftType] || "L";
        const cell = `${XLSX.utils.encode_col(day + 2)}${scheduleStartRow + employeeIndex}`;

        let bgColor = "FFFFFF";
        let fontColor = "000000";
        if (code === "P") {
          bgColor = "FFF2CC";
          fontColor = "806000";
        } else if (code === "MID") {
          bgColor = "FCE4D6";
          fontColor = "843C0C";
        } else if (code === "S") {
          bgColor = "DDEBF7";
          fontColor = "1F4E79";
        } else if (code === "M") {
          bgColor = "E4DFEC";
          fontColor = "4B3F6B";
        } else if (code === "L") {
          bgColor = "E2EFDA";
          fontColor = "375623";
        } else if (code === "C") {
          bgColor = "F4B084";
          fontColor = "843C0C";
        } else if (code === "X") {
          bgColor = "D6DCE4";
          fontColor = "333333";
        }

        setCellStyle(cell, {
          alignment: { horizontal: "center" },
          fill: { fgColor: { rgb: bgColor } },
          font: { bold: true, color: { rgb: fontColor } },
          border,
        });
      }
    });

    setCellStyle(`A${totalTitleRow}`, sectionStyle);
    worksheet["!merges"].push({ s: { r: totalTitleRow - 1, c: 0 }, e: { r: totalTitleRow - 1, c: daysInMonth + 2 } });
    for (let row = totalStartRow; row < totalStartRow + shiftRows.length; row++) {
      const shift = shiftRows[row - totalStartRow];
      setCellStyle(`B${row}`, {
        fill: { fgColor: { rgb: shift.bg } },
        font: { bold: true, color: { rgb: shift.fg } },
        border,
      });
      setCellStyle(`A${row}`, { fill: { fgColor: { rgb: shift.bg } }, border });
      setCellStyle(`C${row}`, { fill: { fgColor: { rgb: shift.bg } }, border });
      for (let col = 3; col < 3 + daysInMonth; col++) {
        setCellStyle(`${XLSX.utils.encode_col(col)}${row}`, {
          alignment: { horizontal: "center" },
          font: { bold: true },
          fill: { fgColor: { rgb: shift.bg } },
          border,
        });
      }
    }

    setCellStyle(`A${summaryTitleRow}`, sectionStyle);
    worksheet["!merges"].push({ s: { r: summaryTitleRow - 1, c: 0 }, e: { r: summaryTitleRow - 1, c: 2 } });
    for (let row = summaryTitleRow + 1; row <= summaryTitleRow + 4; row++) {
      setCellStyle(`A${row}`, {
        fill: { fgColor: { rgb: "F8FAFC" } },
        font: { bold: true },
        border,
      });
      setCellStyle(`B${row}`, {
        fill: { fgColor: { rgb: "FFFFFF" } },
        alignment: { horizontal: "right" },
        border,
      });
    }

    setCellStyle(`A${legendTitleRow}`, sectionStyle);
    worksheet["!merges"].push({ s: { r: legendTitleRow - 1, c: 0 }, e: { r: legendTitleRow - 1, c: 1 } });
    shiftRows.forEach((shift, index) => {
      const row = legendTitleRow + index + 1;
      setCellStyle(`A${row}`, {
        fill: { fgColor: { rgb: shift.bg } },
        font: { bold: true, color: { rgb: shift.fg } },
        alignment: { horizontal: "center" },
        border,
      });
      setCellStyle(`B${row}`, {
        fill: { fgColor: { rgb: shift.bg } },
        font: { color: { rgb: shift.fg } },
        border,
      });
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, `Jadwal ${monthNames[month - 1]} ${year}`);
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
