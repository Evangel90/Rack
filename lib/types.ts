export type Network = "mtn" | "airtel" | "glo" | "9mobile";

export type Quote = {
  id: string;
  sender: string;
  category: "airtime";
  network: Network;
  phone: string;
  amountNgn: number;
  amountSats: number;
  btcNgn: number;
  recipient: string;
  expiresAt: string;
  createdAt: string;
};

export type OrderStatus = "awaiting_payment" | "paid" | "fulfilled" | "failed" | "refund_needed";

export type Order = {
  id: string;
  quoteId: string;
  sender: string;
  category: "airtime";
  network: Network;
  phone: string;
  amountNgn: number;
  amountSats: number;
  txid: string;
  status: OrderStatus;
  reference?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type DepositStatus = "sent" | "confirming" | "minting" | "done" | "failed";

export type Deposit = {
  id: string;
  sender: string;
  btcTxid: string;
  amountSats: number;
  depositAddress: string;
  depositScript: string;
  reclaimScript: string;
  /** Output index of the deposit in the BTC tx, once known. */
  vout?: number;
  /** True once the sBTC API (Emily) has been told about the deposit. */
  notified: boolean;
  statusMessage?: string;
  status: DepositStatus;
  createdAt: string;
  updatedAt: string;
};

export type Price = { btcNgn: number; btcUsd: number; updatedAt: string; stale?: boolean };
