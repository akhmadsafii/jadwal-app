type ShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "SAKIT" | "TURUN";

export async function swapShiftAssignments(
  tx: any,
  userId: string,
  swapWithUserId: string,
  date: Date
) {
  const [sourceAssignment, targetAssignment] = await Promise.all([
    tx.shiftAssignment.findUnique({
      where: { userId_date: { userId, date } },
    }),
    tx.shiftAssignment.findUnique({
      where: { userId_date: { userId: swapWithUserId, date } },
    }),
  ]);

  const sourceShift: ShiftType = sourceAssignment?.shiftType || "LIBUR";
  const targetShift: ShiftType = targetAssignment?.shiftType || "LIBUR";

  await Promise.all([
    tx.shiftAssignment.upsert({
      where: { userId_date: { userId, date } },
      update: { shiftType: targetShift },
      create: { userId, date, shiftType: targetShift },
    }),
    tx.shiftAssignment.upsert({
      where: { userId_date: { userId: swapWithUserId, date } },
      update: { shiftType: sourceShift },
      create: { userId: swapWithUserId, date, shiftType: sourceShift },
    }),
  ]);
}
