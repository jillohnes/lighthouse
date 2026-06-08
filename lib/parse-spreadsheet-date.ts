import * as XLSX from "xlsx";

export function parseSpreadsheetDate(value: unknown): string {
  if (value instanceof Date) {
    return formatYmd(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return formatYmd(date.y, date.m, date.d);
  }

  const str = String(value).trim();

  const dmy4 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy4) {
    return formatYmd(Number(dmy4[3]), Number(dmy4[2]), Number(dmy4[1]));
  }

  const mdy2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (mdy2) {
    const year = 2000 + Number(mdy2[3]);
    return formatYmd(year, Number(mdy2[1]), Number(mdy2[2]));
  }

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return formatYmd(
      parsed.getFullYear(),
      parsed.getMonth() + 1,
      parsed.getDate(),
    );
  }

  throw new Error(`Could not parse date: ${value}`);
}

function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
