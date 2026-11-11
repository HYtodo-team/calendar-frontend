// Forms submit minute-precision values with seconds set to 00.
export function isValidTimeRange(start?: string | null, end?: string | null): boolean {
  const minutes = (value?: string | null) => {
    if (!value || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) return NaN;
    return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  };
  return minutes(start) < minutes(end);
}
