import { describe, expect, it } from "vitest";
import { parseTransactionCsv } from "../utils/csvImport";

describe("parseTransactionCsv", () => {
  it("parses valid rows with income and expense", () => {
    const csv = `date,description,amount,category,type
2025-01-10,Salary,2500,Income,income
2025-01-11,Groceries,-54.20,Food,expense`;

    const { rows, errors } = parseTransactionCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0].type).toBe("income");
    expect(rows[1].amount).toBe(54.2);
    expect(rows[1].type).toBe("expense");
  });

  it("reports invalid rows without importing them", () => {
    const csv = `date,description,amount
not-a-date,Bad,12`;

    const { rows, errors } = parseTransactionCsv(csv);
    expect(rows).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });
});
