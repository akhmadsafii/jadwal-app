"use client";

import * as XLSX from "xlsx";

interface ExportButtonProps {
  data: {
    name: string;
    nip: string;
    schedule: string;
  }[];
  month: number;
  year: number;
}

export default function ExportButton({ data, month, year }: ExportButtonProps) {
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const handleExport = () => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Header row
    const header = ["Nama", "NIP", "Jadwal"];

    // Data rows
    const rows = data.map((item) => [
      item.name,
      item.nip,
      item.schedule,
    ]);

    // Combine header and data
    const wsData = [header, ...rows];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 40 }, // Nama
      { wch: 20 }, // NIP
      { wch: 100 }, // Jadwal
    ];

    // Add to workbook
    XLSX.utils.book_append_sheet(wb, ws, `Jadwal ${monthNames[month - 1]} ${year}`);

    // Generate filename
    const filename = `Jadwal_Admin_${monthNames[month - 1]}_${year}.xlsx`;

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