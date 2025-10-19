"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { FiBox, FiFileText } from "react-icons/fi";
import api from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";
import { getSocket } from "@/lib/socket";

interface Order {
  id: number;
  user: { name: string; email: string };
  totalAmount: number;
  status: string;
  payment?: { status: string };
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrders, setShowOrders] = useState(false); // toggle order table

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

    setUser(parsedUser);
    fetchOrders();

    // 🔔 Listen for realtime updates
    const socket = getSocket();
    socket.on("paymentUpdate", fetchOrders);
    socket.on("orderUpdate", fetchOrders);
    socket.on("refundUpdate", fetchOrders);

    return () => {
      socket.off("paymentUpdate");
      socket.off("orderUpdate");
      socket.off("refundUpdate");
    };
  }, [router]);

  async function fetchOrders() {
    const token = localStorage.getItem("token");
    try {
      const res = await api.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: number, newStatus: string) {
    const token = localStorage.getItem("token");
    try {
      await api.patch(
        `/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Order #${orderId} updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error("Failed to update order status");
    }
  }

  if (!user)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        Loading dashboard...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Toaster position="top-right" />
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Welcome, Admin 👋</h1>
        <p className="text-gray-400 mb-6">
          Logged in as: <span className="font-semibold">{user.email}</span>
        </p>

        {/* Control Panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg mb-10">
          <h2 className="text-2xl font-semibold mb-6">Admin Control Panel</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => router.push("/dashboard/admin/products")}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 p-4 rounded-lg text-left transition transform hover:scale-105"
            >
              <FiBox size={24} />
              <div>
                <p className="font-semibold text-lg">Manage Products</p>
                <p className="text-gray-300 text-sm">Add, edit, and remove products.</p>
              </div>
            </button>

            <button
              onClick={() => setShowOrders(!showOrders)}
              className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 p-4 rounded-lg text-left transition transform hover:scale-105"
            >
              <FiFileText size={24} />
              <div>
                <p className="font-semibold text-lg">Manage Orders</p>
                <p className="text-gray-300 text-sm">Track and update customer orders.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Orders Table Section */}
        {showOrders && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">📦 Orders Overview</h2>
            {loading ? (
              <p className="text-gray-400">Loading orders...</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer</th>
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
                        <td className="p-3">
                          {order.user?.name || "Unknown"} <br />
                          <span className="text-gray-500 text-xs">{order.user?.email}</span>
                        </td>
                        <td className="p-3">${Number(order.totalAmount).toFixed(2)}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-700/30 text-gray-300">
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              order.payment?.status === "SUCCEEDED"
                                ? "bg-green-700/30 text-green-400"
                                : order.payment?.status === "FAILED"
                                ? "bg-red-700/30 text-red-400"
                                : "bg-gray-700/30 text-gray-400"
                            }`}
                          >
                            {order.payment?.status || "PENDING"}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 space-x-2">
                          {["PENDING", "SHIPPED"].includes(order.status) && (
                            <button
                              onClick={() =>
                                updateStatus(
                                  order.id,
                                  order.status === "PENDING" ? "SHIPPED" : "COMPLETED"
                                )
                              }
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                            >
                              Next Status
                            </button>
                          )}
                          {order.status !== "CANCELLED" && (
                            <button
                              onClick={() => updateStatus(order.id, "CANCELLED")}
                              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
