export function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function getDateKeyFromApi(value: string) {
  if (!value.includes("T")) return value;
  return getLocalDateKey(new Date(value));
}

export function dateKeyToLocalDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions
) {
  return dateKeyToLocalDate(dateKey).toLocaleDateString("id-ID", options);
}
