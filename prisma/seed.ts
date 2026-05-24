import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Create connection pool
const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "mac",
  password: "1234",
  database: "jadwal_db",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.shiftAssignment.deleteMany();
  await prisma.shiftRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.user.deleteMany();
  await prisma.monthlyStats.deleteMany();

  // Create Admin
  const hashedAdminPassword = await bcrypt.hash("12345678", 10);
  const admin = await prisma.user.create({
    data: {
      nip: "admin",
      name: "Administrator",
      email: "admin@shiftmaster.pro",
      password: hashedAdminPassword,
      role: "ADMIN",
      position: "System Administrator",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxsX7rz7Ujgt5P7b9hIe_yvV84u51p6N4jfkelVa8OLOXrThDwxJyMitmtv-MbeQLstWGL5bc4qyh1bsYYYOlpbR0fWdZ8jFBO8lVKDqIz9EBeBud5IAp9Y_c7srfwCFTK2z1AYu8OeaiINOTg1gNz0LxgqNF5I7JsZ1nMBwYuhYyDicuZZ7coOKZmOpm0YgGB9pLtIV7RpasiezJG303e29HOVJiuaK6ECEFEzR0cfNJ2UYKngvg2AXO8irzHobKjp_eLXhvj2Q",
      isActive: true,
    },
  });
  console.log("✅ Created admin:", admin.name, "(NIP: admin)");

  // Create Employees
  const employees = [
    { nip: "SM-88219", name: "Aditya Pratama", email: "aditya.pratama@company.com", position: "Staff Farmasi", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC44EPpZNlQ460OFoxogQ1GN-aoFY6_y2gZ8_uph43oO3sRGBT6anvd11BoIjTufjk-g8uvvLdraXd5Ux1UKEZ5ZepecgbtGVCW6CTQnfFTIrB7HKypN3NtcoJ1QHuddB_NicmHAykUhL_C4gkIVSWs0ze365cn3Qr7Jz-1n-NXafXrRxb_wXfndtwVtWeE3_yFmcCb8K3LyxoFhR_eSTxk7Npra4dLdwcdoRGdLxfA1K8NGqbH5_mSiykwArS-pkq5j6_qFaLPPA" },
    { nip: "SM-88220", name: "Siti Aminah", email: "siti.aminah@company.com", position: "Apoteker", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPz2Vy_PAMY1-9w1Q8IODjxZ6h45dblBFCJL0qpeDJNn3Z8U-zeS-sFJJf2GEY-gskjaGNCYFcwwepGBs1rYWenobFhrr_xTuK2gnGM-2Kuz_SwXmgHjZPh89_FJRS2CMZfNuGHrDVrwZ3ap5cdxtu6PjCdGj4AxmIUyxoAtwnhjjjZF0RMuDVcUnzdKtsJGajamsaaachKXIEByfln7JMZLeqcZ8nHJCw3VcKbPmwzRCOtDdecG9k_IdMxB59_Ynkq7_EHuLtEQ" },
    { nip: "SM-88221", name: "Budi Santoso", email: "budi.santoso@company.com", position: "Staff Gudang", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs2Xo8Vi9dhPV8kpSg5p0K7peVVFEbUGtCSUQ6lvsI_YavfwcmxGXWryqyUWBpVi91kJiso8lTUADnneU6xk4_zECFLGXlkljh4Vulbd_m4kWXcCOG1oU5cAmYY-MzKBkm-ggw-lzXsobwo4rbB2JdeUlO5t9HVlHJuNuCCkIqK3gru0ohAYx8cUHqZ9cuv8wf3m47f-W0fkkKERm4et-BNHHq_jKAVk2BnOPfNz4c5cFrrjy58mkeB5snPGwNoTPUg9vm-4gzLw" },
    { nip: "SM-88222", name: "Dewi Lestari", email: "dewi.lestari@company.com", position: "Kasir Farmasi", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhV9B8BXx9cfFoWmIvLtleZoXUiXIXx9o_IzksYgjupZhpqyYT_V6QtKYNtl_uTrApJL156FxW3aCnCs4MLJXBrHjA2it1SV60Bh6wy70R9Nbd6J5WHDthWWeo77nuzRBioTnn3FDWVQMxJv4Ul1OXGFRKg44cccOWtIK7wfqK92ufSwvsMSQhhA7e7n5V5ba2-d09jS6t79_UEOSngaPO5lZONqB7_DU34i7OqNhxp3cHJW6wKdHMlc4yv93yMvaz0gXAp8XULg" },
    { nip: "SM-88223", name: "Eko Wijaya", email: "eko.wijaya@company.com", position: "Staff Farmasi", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAmUT5moqkWBWSeGzOeH3hx_C0DOIgaZKiTX2yph53ewUsko75BgEf8Lw46fBNrZeAHQfCcfB3P4ApgiJiiRX-U2g1br5Ot4Nfu0X1aHkK0PBmyCntzYpwOzT-Vf3iA7kL5o364ZkFSvDMjm0OhGZRcTedNVo52QDtrwrr3ap_BlJTpwCqiB4cBiblKMl0ug2hwr352y_b4r8AcwZNuL6-QUaas5i6LxCCskiEJYQqiAKXZf3tC2iNO9t6FgJCjKn6V4H-EzRpGA" },
    { nip: "SM-88230", name: "Rinawaty, S.Farm.", email: "rinawaty@company.com", position: "Apoteker Supervisor", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhV9B8BXx9cfFoWmIvLtleZoXUiXIXx9o_IzksYgjupZhpqyYT_V6QtKYNtl_uTrApJL156FxW3aCnCs4MLJXBrHjA2it1SV60Bh6wy70R9Nbd6J5WHDthWWeo77nuzRBioTnn3FDWVQMxJv4Ul1OXGFRKg44cccOWtIK7wfqK92ufSwvsMSQhhA7e7n5V5ba2-d09jS6t79_UEOSngaPO5lZONqB7_DU34i7OqNhxp3cHJW6wKdHMlc4yv93yMvaz0gXAp8XULg" },
  ];

  const hashedPassword = await bcrypt.hash("12345678", 10);
  const createdEmployees: any[] = [];

  for (const emp of employees) {
    const user = await prisma.user.create({
      data: {
        nip: emp.nip,
        name: emp.name,
        email: emp.email,
        password: hashedPassword,
        role: "EMPLOYEE",
        position: emp.position,
        avatarUrl: emp.avatarUrl,
        isActive: true,
        leaveBalance: {
          create: { annualLeave: 12, sickLeave: 5, compensation: 2 },
        },
      },
    });
    createdEmployees.push(user);
    console.log(`✅ Created employee: ${user.name} (NIP: ${user.nip})`);
  }

  // Create Shift Assignments for May 2026
  console.log("\n📅 Creating shift assignments for May 2026...");
  const schedules = [
    { nip: "SM-88219", schedule: ["L", "P", "L", "P", "P", "P", "P", "P", "L", "P", "P", "L", "L", "P", "L", "OFF", "P", "P", "P", "P", "L", "P", "OFF", "L", "L", "P", "P", "L", "S", "S", "L"] },
    { nip: "SM-88220", schedule: ["P", "L", "L", "P", "P", "P", "P", "P", "L", "P", "P", "L", "L", "P", "P", "P", "P", "P", "L", "L", "L", "OFF", "P", "L", "P", "P", "P", "L", "M", "M", "P"] },
    { nip: "SM-88221", schedule: ["L", "P", "P", "S", "L", "S", "OFF", "OFF", "L", "L", "S", "P", "OFF", "P", "L", "OFF", "L", "L", "S", "OFF", "OFF", "P", "OFF", "L", "S", "P", "S", "L", "P", "P", "S"] },
  ];

  // Shift types mapping
const shiftMap: Record<string, "LIBUR" | "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "CUTI" | "TURUN"> = {
  P: "PAGI",      // 07:00 - 14:00
  MID: "MIDDLE",  // 10:00 - 17:00
  S: "SIANG",     // 14:00 - 21:00
  M: "MALAM",     // 21:00 - 07:00
  L: "LIBUR",
  C: "CUTI",
  X: "TURUN",
};

  let assignmentsCreated = 0;
  for (const sched of schedules) {
    const emp = createdEmployees.find((e: any) => e.nip === sched.nip);
    if (!emp) continue;
    for (let day = 1; day <= 31; day++) {
      const shiftCode = sched.schedule[day - 1];
      const shiftType = shiftMap[shiftCode] || "PAGI";
      await prisma.shiftAssignment.create({
        data: { userId: emp.id, date: new Date(2026, 4, day), shiftType },
      });
      assignmentsCreated++;
    }
  }
  console.log(`✅ Created ${assignmentsCreated} shift assignments`);

  // Create sample requests
  console.log("\n📝 Creating sample requests...");
  await prisma.shiftRequest.create({
    data: { userId: createdEmployees[5].id, type: "SHIFT_PAGI", startDate: new Date(2026, 4, 20), endDate: new Date(2026, 4, 21), description: "Permintaan shift pagi untuk tanggal 20-21 Mei 2026", status: "PENDING" },
  });
  console.log("✅ Created request: SHIFT_PAGI (Rinawaty) - PENDING");

  await prisma.shiftRequest.create({
    data: { userId: createdEmployees[0].id, type: "CUTI_TAHUNAN", startDate: new Date(2026, 4, 15), endDate: new Date(2026, 4, 16), description: "Cuti tahunan 2 hari", status: "APPROVED" },
  });
  console.log("✅ Created request: CUTI_TAHUNAN (Aditya) - APPROVED");

  await prisma.shiftRequest.create({
    data: { userId: createdEmployees[2].id, type: "TUKAR_SHIFT", startDate: new Date(2026, 4, 10), description: "Tukar shift dengan rekan", status: "PENDING" },
  });
  console.log("✅ Created request: TUKAR_SHIFT (Budi) - PENDING");

  // Create Monthly Stats
  await prisma.monthlyStats.create({
    data: { month: 5, year: 2026, totalWorkDays: 22, attendanceRate: 98.5, overtimeHours: 14, morningCount: 9, afternoonCount: 6, nightCount: 5 },
  });
  console.log("✅ Created monthly stats for May 2026");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n==================================================");
  console.log("📋 LOGIN CREDENTIALS");
  console.log("==================================================");
  console.log("\n👤 Admin:");
  console.log("   Username: admin");
  console.log("   Password: 12345678");
  console.log("\n👥 Pegawai (password: 12345678):");
  for (const emp of employees) console.log(`   NIP: ${emp.nip} - ${emp.name}`);
  console.log("\n==================================================");
}

main()
  .catch((e) => { console.error("❌ Seeding failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });