export type DateRangeInput = {
  start?: string | null;
  end?: string | null;
};

function normalizeDateValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const isoPrefix = parsed.toISOString().slice(0, 10);
  return isoPrefix === value ? value : null;
}

export function normalizeDateRange({ start, end }: DateRangeInput) {
  const normalizedStart = normalizeDateValue(start);
  const normalizedEnd = normalizeDateValue(end);
  const isValidRange = !normalizedStart || !normalizedEnd || normalizedStart <= normalizedEnd;

  return {
    start: normalizedStart,
    end: normalizedEnd,
    isValidRange,
  };
}
