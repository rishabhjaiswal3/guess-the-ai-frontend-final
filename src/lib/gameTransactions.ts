export type GameTransactionRecord = {
  hash: string;
  mode: string;
  createdAt: string;
};

const STORAGE_KEY = "gta:game-transactions";
const MAX_TRANSACTIONS = 20;

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const getGameTransactions = (): GameTransactionRecord[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is GameTransactionRecord => (
      item &&
      typeof item.hash === "string" &&
      typeof item.mode === "string" &&
      typeof item.createdAt === "string"
    ));
  } catch {
    return [];
  }
};

export const addGameTransaction = (hash: string, mode: string): void => {
  if (!canUseStorage() || !hash) return;

  try {
    const current = getGameTransactions();
    const withoutDuplicate = current.filter((tx) => tx.hash !== hash);
    const next: GameTransactionRecord[] = [
      { hash, mode, createdAt: new Date().toISOString() },
      ...withoutDuplicate,
    ].slice(0, MAX_TRANSACTIONS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage write failures to avoid interrupting gameplay.
  }
};
