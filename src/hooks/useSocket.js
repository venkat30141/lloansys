import { useContext } from 'react'
import { SocketContext } from '../contexts/SocketContext'

export default function useSocket() {
  return useContext(SocketContext)
}
import { useContext } from "react";
import { SocketContext } from "../contexts/SocketContext";

export function useSocket() {
  return useContext(SocketContext);
}
