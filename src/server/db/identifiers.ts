import { createHash } from "node:crypto";

export function stableUuid(value: string): string {
  const hex = createHash("sha256").update(`kent-navigator:${value}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = (8 + (Number.parseInt(hex[16]!, 16) % 4)).toString(16);
  const joined = hex.join("");
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}
