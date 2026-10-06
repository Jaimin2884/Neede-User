import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { fetchCustomerOrder, readCustomerOrder, type CustomerOrder } from '@/features/orders/api/orderApi';
import { getApiErrorMessage } from '@/services/api/errors';
import { connectOrderSocket } from '@/services/socket/client';

export function useCustomerOrder(orderId: number) {
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(orderId) || orderId < 1) {
      setLoading(false);
      setError('Order not found.');
      return;
    }

    let active = true;
    let socketRef: Socket | null = null;

    const onUpdate = (payload: unknown) => {
      const next = readCustomerOrder(payload);
      if (next?.orderId === orderId) {
        setOrder(next);
      }
    };

    void fetchCustomerOrder(orderId)
      .then((next) => {
        if (active) {
          setOrder(next);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(getApiErrorMessage(loadError, 'Could not load the order.'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    void connectOrderSocket('user').then((socket) => {
      if (!active || !socket) {
        return;
      }

      socketRef = socket;
      socket.on('order.updated', onUpdate);
    });

    return () => {
      active = false;
      socketRef?.off('order.updated', onUpdate);
    };
  }, [orderId]);

  return { order, loading, error };
}
