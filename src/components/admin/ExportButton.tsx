"use client";

import * as XLSX from "xlsx";
import { staffData, generateScheduleForMonth, getDaysInMonth } from "@/data/publicData";

interface ExportButtonProps {
  month: number;
  year: number;
}

export default function ExportButton({ month, year }: ExportButtonProps) {
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const dayNamesFull = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const dayNamesStartIndex = firstDayOfMonth % 7;

    // Helper function to get day name
    const getDayName = (day: number) => {
      const dayIndex = (dayNamesStartIndex + day - 1) % 7;
      return dayNamesFull[dayIndex];
    };

    // Helper to get shift counts for a day
    const getShiftCountsForDay = (day: number) => {
      const counts = { PAGI: 0, MIDDLE: 0, SIANG: 0, MALAM: 0, LIBUR: 0 };
      staffData.forEach((staff) => {
        const schedule = generateScheduleForMonth(staff.id, year, month);
        const shift = schedule[day - 1];
        if (shift === "P") counts.PAGI++;
        else if (shift === "MID") counts.MIDDLE++;
        else if (shift === "S") counts.SIANG++;
        else if (shift === "M") counts.MALAM++;
        else if (shift === "L") counts.LIBUR++;
      });
      return counts;
    };

    // Build data as array of arrays
    const data: (string | number)[][] = [];

    // Title
    data.push(["JADWAL APOTEK APOTEK KHASANAH HEALTH CARE"]);
    data.push([`Bulan : ${monthNames[month - 1]} ${year}`]);
    data.push([]);

    // ==================== DAILY STATISTICS TABLE ====================
    data.push(["STATISTIK SHIFT HARIAN"]);
    data.push(["Tgl", "Hari", "PAGI", "MIDDLE", "SIANG", "MALAM", "LIBUR"]);

    // Daily stats rows
    for (let day = 1; day <= daysInMonth; day++) {
      const counts = getShiftCountsForDay(day);
      const dayName = getDayName(day);
      data.push([day, dayName, counts.PAGI, counts.MIDDLE, counts.SIANG, counts.MALAM, counts.LIBUR]);
    }

    data.push([]);

    // ==================== MONTHLY SUMMARY ====================
    data.push(["RINGKASAN BULANAN"]);
    data.push(["Total Hari Kerja", "22 Hari"]);
    data.push(["Persentase Kehadiran", "98.5%"]);
    data.push(["Total Jam Lembur", "14 Jam"]);
    data.push(["Staff Standby", "4 Org"]);
    data.push([]);

    // ==================== MAIN SCHEDULE TABLE ====================
    data.push(["JADWAL SHIFT"]);

    // Header row
    const headerRow: (string | number)[] = ["NO", "NAMA", "NIP"];
    for (let day = 1; day <= daysInMonth; day++) {
      headerRow.push(day);
    }
    data.push(headerRow);

    // Staff rows
    staffData.forEach((staff, index) => {
      const schedule = generateScheduleForMonth(staff.id, year, month);
      const row: (string | number)[] = [index + 1, staff.name, staff.nip];
      schedule.forEach((shift) => row.push(shift));
      data.push(row);
    });

    // Create worksheet from array
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const cols: XLSX.ColInfo[] = [
      { wch: 5 },   // NO
      { wch: 40 },  // NAMA
      { wch: 20 },  // NIP
    ];

    for (let i = 0; i < daysInMonth; i++) {
      cols.push({ wch: 4 }); // Each day column
    }

    ws['!cols'] = cols;

    // Style specific cells using proper syntax
    const setCellStyle = (cellRef: string, style: XLSX.CellObject['s']) => {
      if (!ws[cellRef]) {
        ws[cellRef] = { t: "s", v: "" };
      }
      ws[cellRef].s = style;
    };

    // Title row
    setCellStyle('A1', { font: { bold: true, sz: 14 } });
    setCellStyle('A2', { font: { bold: true, sz: 11 } });
    setCellStyle('A4', { font: { bold: true }, alignment: { horizontal: "center" } });

    // Stats column headers
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5'].forEach((cell) => {
      setCellStyle(cell, {
        fill: { fgColor: { rgb: "4472C4" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" }
      });
    });

    // Summary header
    setCellStyle('A13', { font: { bold: true }, alignment: { horizontal: "center" } });

    // Schedule header
    setCellStyle('A20', { font: { bold: true, sz: 12 }, alignment: { horizontal: "center" } });

    // Schedule column headers
    setCellStyle('A21', {
      fill: { fgColor: { rgb: "4472C4" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center" }
    });
    setCellStyle('B21', {
      fill: { fgColor: { rgb: "4472C4" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center" }
    });
    setCellStyle('C21', {
      fill: { fgColor: { rgb: "4472C4" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center" }
    });

    // Date headers
    for (let day = 1; day <= daysInMonth; day++) {
      const col = day + 3;
      const cell = `${XLSX.utils.encode_col(col)}21`;
      setCellStyle(cell, {
        font: { bold: true, sz: 8 },
        alignment: { horizontal: "center" },
        fill: { fgColor: { rgb: "D9E2F3" } }
      });
    }

    // Color code shift cells
    const scheduleStartRow = 22;
    staffData.forEach((staff, staffIdx) => {
      const schedule = generateScheduleForMonth(staff.id, year, month);
      schedule.forEach((shift, dayIdx) => {
        const col = dayIdx + 4;
        const cell = `${XLSX.utils.encode_col(col)}${scheduleStartRow + staffIdx}`;

        let bgColor = "FFFFFF";
        let fontColor = "000000";
        switch (shift) {
          case "L":
            bgColor = "E2EFDA";
            fontColor = "375623";
            break;
          case "P":
            bgColor = "FFF2CC";
            fontColor = "806000";
            break;
          case "MID":
            bgColor = "FCE4D6";
            fontColor = "843C0C";
            break;
          case "S":
            bgColor = "DDEBF7";
            fontColor = "1F4E79";
            break;
          case "M":
            bgColor = "E4DFEC";
            fontColor = "4B3F6B";
            break;
          case "C":
            bgColor = "F4B084";
            fontColor = "843C0C";
            break;
          case "X":
            bgColor = "D6DCE4";
            fontColor = "333333";
            break;
        }

        setCellStyle(cell, {
          alignment: { horizontal: "center" },
          fill: { fgColor: { rgb: bgColor } },
          font: { color: { rgb: fontColor } }
        });
      });
    });

    // Add to workbook
    XLSX.utils.book_append_sheet(wb, ws, `Jadwal ${monthNames[month - 1]} ${year}`);

    // Generate filename
    const filename = `Jadwal_APOTEK_${monthNames[month - 1]}_${year}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
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