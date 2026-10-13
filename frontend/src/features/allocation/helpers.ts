export function indexById<T extends { id: string }>(
  items: T[]
): Record<string, T> {
  return Object.fromEntries(items.map((i) => [i.id, i]))
}

export function pairsToHours(pairs: number): number {
  return pairs * 1.5
}