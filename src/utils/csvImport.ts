export interface CsvTransactionRow {
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
}

export interface CsvImportResult {
  rows: CsvTransactionRow[];
  errors: string[];
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "").replace(/[()]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function inferType(amount: number, explicit?: string): "income" | "expense" {
  const t = explicit?.trim().toLowerCase();
  if (t === "income" || t === "credit" || t === "deposit") return "income";
  if (t === "expense" || t === "debit" || t === "withdrawal") return "expense";
  return amount < 0 ? "expense" : "income";
}

function parseDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const iso = new Date(trimmed);
  if (!Number.isNaN(iso.getTime())) return iso.toISOString().slice(0, 10);
  const mdy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (mdy) {
    const year =
      mdy[3].length === 2 ? 2000 + Number(mdy[3]) : Number(mdy[3]);
    const d = new Date(year, Number(mdy[1]) - 1, Number(mdy[2]));
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * Parse bank-export style CSV into normalized transaction rows.
 * Expected headers (flexible): date, description, amount, category, type
 */
export function parseTransactionCsv(text: string): CsvImportResult {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const errors: string[] = [];
  const rows: CsvTransactionRow[] = [];

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must include a header row and one data row."] };
  }

  const headers = lines[0].split(",").map(normalizeHeader);
  const idx = {
    date: headers.findIndex((h) => ["date", "transactiondate", "posted"].includes(h)),
    description: headers.findIndex((h) =>
      ["description", "memo", "name", "payee", "details"].includes(h),
    ),
    amount: headers.findIndex((h) =>
      ["amount", "value", "debit", "credit"].includes(h),
    ),
    category: headers.findIndex((h) =>
      ["category", "classification"].includes(h),
    ),
    type: headers.findIndex((h) =>
      ["type", "transactiontype", "incomeexpense"].includes(h),
    ),
  };

  if (idx.date === -1 || idx.amount === -1) {
    return {
      rows: [],
      errors: ["CSV must include date and amount columns."],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const dateRaw = cols[idx.date] ?? "";
    const date = parseDate(dateRaw);
    const amountRaw = cols[idx.amount] ?? "0";
    const amount = parseAmount(amountRaw);

    if (!date) {
      errors.push(`Row ${i + 1}: invalid date "${dateRaw}"`);
      continue;
    }
    if (amount === null) {
      errors.push(`Row ${i + 1}: invalid amount "${amountRaw}"`);
      continue;
    }

    const absAmount = Math.abs(amount);
    const typeCol = idx.type >= 0 ? cols[idx.type] : undefined;
    const type = inferType(amount, typeCol);
    const description =
      (idx.description >= 0 ? cols[idx.description] : "") || "Imported transaction";
    const category =
      idx.category >= 0 && cols[idx.category]
        ? cols[idx.category]
        : type === "income"
          ? "Income"
          : "Uncategorized";

    rows.push({ date, description, amount: absAmount, category, type });
  }

  return { rows, errors };
}
