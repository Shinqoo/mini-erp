"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";
import Navbar from "@/components/ui/Navbar";

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  user: { name: string; email: string };
  createdAt: string;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "ADMIN") {
      router.push("/dashboard/customer");
      return;
    }

    fetchOrders(token);
  }, [router]);

  async function fetchOrders(token: string) {
    try {
      const res = await api.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err: any) {
      toast.error("Failed to load orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: number, newStatus: string) {
    const token = localStorage.getItem("token");
    try {
      await api.patch(
        `/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Order #${orderId} updated to ${newStatus}`);
      fetchOrders(token!);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update order");
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        Loading orders...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Toaster position="top-right" />

      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📦 Manage Orders</h1>

        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-gray-800 hover:bg-gray-800/50 transition"
                >
                  <td className="p-3 font-mono text-sm">#{order.id}</td>
                  <td className="p-3">{order.user?.email}</td>
                  <td className="p-3">${Number(order.totalAmount).toFixed(2)}</td>
                  <td className="p-3">{order.status}</td>
                  <td className="p-3">{order.paymentStatus}</td>
                  <td className="p-3 text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 flex gap-2">
                    {["PENDING", "SHIPPED", "COMPLETED"].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateOrderStatus(order.id, s)}
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.status === s
                            ? "bg-green-700/40 text-green-300"
                            : "bg-gray-700/40 hover:bg-gray-600"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
