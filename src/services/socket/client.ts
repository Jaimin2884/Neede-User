import { io, type Socket } from 'socket.io-client';

import { SOCKET_URL } from '@/constants/config';
import { getAuthToken } from '@/services/storage';

export type SocketRole = 'user' | 'vendor' | 'delivery';

let socket: Socket | null = null;
let generation = 0;

export async function connectOrderSocket(role: SocketRole): Promise<Socket | null> {
  if (!SOCKET_URL) {
    return null;
  }

  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  const currentRole = (socket?.auth as { role?: string } | undefined)?.role;
  if (socket?.connected && currentRole === role) {
    return socket;
  }

  const attempt = ++generation;
  socket?.removeAllListeners();
  socket?.disconnect();

  const next = io(SOCKET_URL, {
    auth: { token, role },
    autoConnect: true,
    reconnection: true,
  });

  if (attempt !== generation) {
    next.disconnect();
    return socket;
  }

  socket = next;
  return socket;
}

export function disconnectOrderSocket(): void {
  generation += 1;
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}
