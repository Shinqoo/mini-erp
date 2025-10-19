"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);

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
  }, [router]);

  if (!user)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        Loading dashboard...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">Welcome, Admin 👋</h1>
        <p className="text-gray-400 mb-6">
          Logged in as: <span className="font-semibold">{user.email}</span>
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">Admin Panel</h2>
          <ul className="space-y-2 text-gray-300">
            <li>📦 Manage Products</li>
            <li>🧾 Manage Orders</li>
            <li>💳 Manage Payments</li>
            <li>👥 Manage Users</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
