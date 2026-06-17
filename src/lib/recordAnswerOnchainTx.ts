import { addGameTransaction } from "@/lib/gameTransactions";

type OnchainAnswerResponse = {
  onchain?: { transactionHash?: string } | null;
} | null | undefined;

export function recordAnswerOnchainTx(
  response: OnchainAnswerResponse,
  mode: string
): void {
  const txHash = response?.onchain?.transactionHash;
  if (txHash) {
    addGameTransaction(txHash, mode);
  }
}
