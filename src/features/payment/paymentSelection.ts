const allowedMethods = new Set(['Google Pay', 'PhonePe', 'Paytm', 'COD']);

let selectedPaymentMethod: string | null = null;

export function getPaymentMethod() {
  return selectedPaymentMethod && allowedMethods.has(selectedPaymentMethod) ? selectedPaymentMethod : null;
}

export function setPaymentMethod(method: string | null) {
  selectedPaymentMethod = method && allowedMethods.has(method) ? method : null;
}
