import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Deposit, Order, Quote } from "./types";

/**
 * Order store behind a small interface so Postgres can replace it later (M1).
 * MVP: an in-memory map mirrored to a JSON file. On Vercel only /tmp is writable and
 * instances don't share it, so data there is best-effort per instance (noted in README).
 */
export interface Store {
  putQuote(q: Quote): Promise<void>;
  getQuote(id: string): Promise<Quote | undefined>;
  putOrder(o: Order): Promise<void>;
  getOrder(id: string): Promise<Order | undefined>;
  findOrderByTxid(txid: string): Promise<Order | undefined>;
  listOrders(sender: string): Promise<Order[]>;
  putDeposit(d: Deposit): Promise<void>;
  getDeposit(id: string): Promise<Deposit | undefined>;
  listDeposits(sender: string): Promise<Deposit[]>;
}

type Data = { quotes: Record<string, Quote>; orders: Record<string, Order>; deposits: Record<string, Deposit> };

const FILE =
  process.env.RACK_STORE_FILE ?? (process.env.VERCEL ? "/tmp/rack-store.json" : path.join(process.cwd(), ".data", "store.json"));

const g = globalThis as unknown as { __rackData?: Data; __rackLoad?: Promise<Data> };

async function data(): Promise<Data> {
  if (g.__rackData) return g.__rackData;
  g.__rackLoad ??= fs
    .readFile(FILE, "utf8")
    .then((raw) => JSON.parse(raw) as Data)
    .catch(() => ({ quotes: {}, orders: {}, deposits: {} }))
    .then((d) => {
      d.deposits ??= {};
      g.__rackData = d;
      return d;
    });
  return g.__rackLoad;
}

let writing = Promise.resolve();
function persist(d: Data) {
  writing = writing
    .then(async () => {
      await fs.mkdir(path.dirname(FILE), { recursive: true });
      await fs.writeFile(FILE, JSON.stringify(d, null, 2));
    })
    .catch((e) => console.warn("store: could not write file, keeping in memory only", e));
  return writing;
}

const newestFirst = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);
const normTx = (t: string) => t.toLowerCase().replace(/^0x/, "");

export const store: Store = {
  async putQuote(q) {
    const d = await data();
    d.quotes[q.id] = q;
    await persist(d);
  },
  async getQuote(id) {
    return (await data()).quotes[id];
  },
  async putOrder(o) {
    const d = await data();
    d.orders[o.id] = o;
    await persist(d);
  },
  async getOrder(id) {
    return (await data()).orders[id];
  },
  async findOrderByTxid(txid) {
    const t = normTx(txid);
    return Object.values((await data()).orders).find((o) => normTx(o.txid) === t);
  },
  async listOrders(sender) {
    return Object.values((await data()).orders)
      .filter((o) => o.sender === sender)
      .sort(newestFirst);
  },
  async putDeposit(dep) {
    const d = await data();
    d.deposits[dep.id] = dep;
    await persist(d);
  },
  async getDeposit(id) {
    return (await data()).deposits[id];
  },
  async listDeposits(sender) {
    return Object.values((await data()).deposits)
      .filter((x) => x.sender === sender)
      .sort(newestFirst);
  },
};
