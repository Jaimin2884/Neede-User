export function formatRupee(value: number): string {
  const rounded = Math.round(value * 10) / 10;

  if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
    return `₹${Math.round(rounded)}`;
  }

  return `₹${rounded.toFixed(1)}`;
}

export function formatKm(km: number): string {
  if (km < 1) {
    return `${Math.max(1, Math.round(km * 1000))} m`;
  }

  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
