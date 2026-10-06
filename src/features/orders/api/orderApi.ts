import { API_BASE_URL } from '@/constants/config';
import { ENDPOINTS } from '@/constants/endpoints';
import { api } from '@/services/api/client';
import type { ApiEnvelope } from '@/types/common';

export type CustomerOrderItem = {
  name: string;
  unitLabel: string;
  quantity: number;
  lineTotal: number;
};

export type CustomerOrderStore = {
  storeName: string;
  status: string;
  subtotal: number;
  items: CustomerOrderItem[];
};

export type CustomerOrder = {
  orderId: number;
  orderNumber: string;
  status: string;
  total: number;
  paymentMethod: string;
  addressLabel: string;
  addressLine: string;
  receiverName: string;
  itemCount: number;
  storeCount: number;
  deliveryPartnerName: string | null;
  stores: CustomerOrderStore[];
};

function ensureApiConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error('API address is not configured.');
  }
}

function readItem(value: unknown): CustomerOrderItem | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const name = String(row.name ?? '').trim();
  const quantity = Number(row.quantity);

  if (!name || !Number.isFinite(quantity)) {
    return null;
  }

  return {
    name,
    unitLabel: String(row.unit_label ?? '').trim(),
    quantity,
    lineTotal: Number(row.line_total ?? 0),
  };
}

export function readCustomerOrder(value: unknown): CustomerOrder | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const orderId = Number(row.order_id);
  const orderNumber = String(row.order_number ?? '').trim();

  if (!Number.isFinite(orderId) || orderId < 1 || !orderNumber) {
    return null;
  }

  const stores = Array.isArray(row.stores)
    ? row.stores.flatMap((store) => {
        if (!store || typeof store !== 'object' || Array.isArray(store)) {
          return [];
        }

        const storeRow = store as Record<string, unknown>;
        const items = Array.isArray(storeRow.items)
          ? storeRow.items.flatMap((item) => {
              const line = readItem(item);
              return line ? [line] : [];
            })
          : [];

        return [{
          storeName: String(storeRow.store_name ?? 'Store'),
          status: String(storeRow.status ?? 'pending'),
          subtotal: Number(storeRow.subtotal ?? 0),
          items,
        }];
      })
    : [];

  const partner = row.delivery_partner_name;
  const itemCount = Number(row.item_count);
  const storeCount = Number(row.store_count);

  return {
    orderId,
    orderNumber,
    status: String(row.status ?? 'placed'),
    total: Number(row.total ?? 0),
    paymentMethod: String(row.payment_method ?? ''),
    addressLabel: String(row.address_label ?? 'Home'),
    addressLine: String(row.address_line ?? ''),
    receiverName: String(row.receiver_name ?? ''),
    itemCount: Number.isFinite(itemCount)
      ? itemCount
      : stores.reduce((sum, store) => sum + store.items.reduce((qty, item) => qty + item.quantity, 0), 0),
    storeCount: Number.isFinite(storeCount) ? storeCount : stores.length,
    deliveryPartnerName: typeof partner === 'string' && partner.trim() ? partner : null,
    stores,
  };
}

async function readOrderResponse(response: { data: ApiEnvelope }): Promise<CustomerOrder> {
  const body = response.data;

  if (!body.success) {
    throw new Error(body.message || 'Could not load the order.');
  }

  const order = readCustomerOrder(body.data);
  if (!order) {
    throw new Error('Order response was incomplete.');
  }

  return order;
}

export async function placeCustomerOrder(paymentMethod: string): Promise<CustomerOrder> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope>(ENDPOINTS.USER_ORDER_PLACE, {
    payment_method: paymentMethod,
  });

  return readOrderResponse(response);
}

export async function fetchCustomerOrder(orderId: number): Promise<CustomerOrder> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope>(ENDPOINTS.USER_ORDER_SHOW, {
    order_id: orderId,
  });

  return readOrderResponse(response);
}
