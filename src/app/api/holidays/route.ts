import { NextResponse } from "next/server";
import Holidays from "date-holidays";

function toDateKey(value: string) {
  return value.slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const currentYear = new Date().getFullYear();
  const year = yearParam ? Number(yearParam) : currentYear;

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json(
      { error: "Tahun tidak valid" },
      { status: 400 }
    );
  }

  const holidays = new Holidays("ID");
  const items = holidays.getHolidays(year).map((holiday) => ({
    dateKey: toDateKey(holiday.date),
    name: holiday.name,
    type: holiday.type,
  }));

  return NextResponse.json({
    success: true,
    year,
    holidays: items,
  });
}
