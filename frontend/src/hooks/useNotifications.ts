import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

export default function useNotifications(onEvent) {
  useEffect(() => {
    const socket = getSocket();
    socket.on("orderUpdate", (data) => onEvent("orderUpdate", data));
    socket.on("paymentUpdate", (data) => onEvent("paymentUpdate", data));
    socket.on("refundUpdate", (data) => onEvent("refundUpdate", data));
    return () => {
      socket.off("orderUpdate");
      socket.off("paymentUpdate");
      socket.off("refundUpdate");
    };
  }, []);
}