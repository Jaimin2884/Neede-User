export function digitsOnly(value: string, maxLength = 10): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export function isIndianMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value);
}
