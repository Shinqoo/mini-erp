"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import api from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

interface Payment {
  id: number;
  orderId: number;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
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

    fetchPayments(token);
  }, [router]);

  async function fetchPayments(token: string) {
    try {
      const res = await api.get("/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(res.data);
    } catch (err: any) {
      console.error("Failed to fetch payments", err);
      toast.error(err.response?.data?.message || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Toaster position="top-right" />
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">💳 Payments Overview</h1>

        {loading ? (
          <p className="text-gray-400">Loading payments...</p>
        ) : payments.length === 0 ? (
          <p className="p-6 text-gray-400 bg-gray-900 border border-gray-800 rounded-xl">
            No payments found.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="p-3">Payment ID</th>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-gray-800 hover:bg-gray-800/50 transition"
                  >
                    <td className="p-3 font-mono text-sm text-gray-300">#{p.id}</td>
                    <td className="p-3">Order #{p.orderId}</td>
                    <td className="p-3">
                      {p.user?.name || "Unknown"} <br />
                      <span className="text-sm text-gray-400">{p.user?.email}</span>
                    </td>
                    <td className="p-3">${p.amount.toFixed(2)}</td>
                    <td className="p-3 text-gray-300">{p.method}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          p.status === "PAID"
                            ? "bg-green-700/30 text-green-400"
                            : p.status === "FAILED"
                            ? "bg-red-700/30 text-red-400"
                            : "bg-yellow-700/30 text-yellow-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
