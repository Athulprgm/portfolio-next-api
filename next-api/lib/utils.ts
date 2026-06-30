export function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  if (typeof data === "bigint") {
    return data.toString();
  }
  if (data instanceof Date) {
    return data.toISOString();
  }
  if (Array.isArray(data)) {
    return data.map((item) => serializeData(item));
  }
  if (typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, serializeData(value)])
    );
  }
  return data;
}
