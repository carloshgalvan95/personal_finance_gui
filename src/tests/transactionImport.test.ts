import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionService } from "../services/transactionService";
import { LocalStorageService, STORAGE_KEYS } from "../services/localStorage";

describe("TransactionService.importRows", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      },
      key: () => null,
      length: 0,
    });
    LocalStorageService.set(STORAGE_KEYS.TRANSACTIONS, []);
  });

  it("persists parsed CSV rows for the user", () => {
    const count = TransactionService.importRows("user-1", [
      {
        date: "2025-01-10",
        description: "Coffee",
        amount: 4.5,
        category: "Food",
        type: "expense",
      },
    ]);

    expect(count).toBe(1);
    const saved = TransactionService.getTransactions("user-1");
    expect(saved).toHaveLength(1);
    expect(saved[0].description).toBe("Coffee");
    expect(saved[0].amount).toBe(4.5);
  });
});
