"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import api from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";
import StripeCheckoutModal from "@/components/payments/StripeCheckoutModal";


interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  paymentStatus: string;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id?: number; name?: string; email?: string; role?: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "CUSTOMER") {
      router.push("/dashboard/admin");
      return;
    }

    setUser(parsedUser);
    fetchOrders(parsedUser.id);
  }, [router]);

  async function fetchOrders(userId: number) {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    try {
      const res = await api.get(`/orders/customer/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedOrders: Order[] = res.data.map((order: any) => ({
        id: order.id,
        total: Number(order.totalAmount),
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      }));

      setOrders(formattedOrders);
    } catch (err: any) {
      console.error("Failed to fetch orders", err);
      toast.error(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Refresh orders after payment success
  const handlePaymentSuccess = async () => {
    toast.success("Payment successful!");
    if (user?.id) await fetchOrders(user.id);
    setSelectedOrder(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Toaster position="top-right" />

      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Welcome back 👋</h1>
        <p className="text-gray-400 mb-8">
          Logged in as: <span className="font-semibold">{user?.email}</span>
        </p>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">🧾 Your Orders</h2>
          <button
            onClick={() => router.push("/shop")}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium"
          >
            🛍️ Go Shopping
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-gray-400 bg-gray-900 border border-gray-800 rounded-xl">
            You haven’t placed any orders yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-gray-800 hover:bg-gray-800/50 transition"
                  >
                    <td className="p-3 font-mono text-sm text-gray-300">#{order.id}</td>
                    <td className="p-3">${Number(order.total).toFixed(2)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.status === "CANCELLED"
                            ? "bg-red-700/30 text-red-400"
                            : order.status === "SHIPPED"
                            ? "bg-blue-700/30 text-blue-400"
                            : "bg-yellow-700/30 text-yellow-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.paymentStatus === "PAID"
                            ? "bg-green-700/30 text-green-400"
                            : order.paymentStatus === "FAILED"
                            ? "bg-red-700/30 text-red-400"
                            : "bg-gray-700/30 text-gray-400"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {order.paymentStatus === "PENDING" && (
                        <button
                          onClick={() => setSelectedOrder(order.id)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                        >
                          💳 Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedOrder && (
          <StripeCheckoutModal
            orderId={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}

        
      </div>
    </div>
  );
}
