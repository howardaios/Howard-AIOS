export function now(): Date {
  return new Date();
}

export function toISOString(date: Date): string {
  return date.toISOString();
}

export function fromISO(dateStr: string): Date {
  return new Date(dateStr);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function diffInDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
