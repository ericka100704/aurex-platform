/** Convert Prisma Decimal/Date objects into plain JSON-safe values for Client Components */
export function serialize(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (val !== null && typeof val === "object" && typeof val.toNumber === "function") {
        return val.toNumber();
      }
      if (val instanceof Date) {
        return val.toISOString();
      }
      return val;
    })
  );
}

export function toNumber(value, fallback = 0) {
  if (value == null) return fallback;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || fallback;
  if (typeof value.toNumber === "function") return value.toNumber();
  return Number(value) || fallback;
}
