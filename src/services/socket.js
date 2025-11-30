import { io } from 'socket.io-client'

export function createSocket() {
  const url = import.meta.env.VITE_SOCKET_URL
  const socket = io(url, {
    transports: ['websocket'],
    autoConnect: true
  })
  return socket
}
import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");
