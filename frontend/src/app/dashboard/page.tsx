"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // simulate user data (replace with your API fetch later)
    const storedUser = localStorage.getItem("user");
    if (!storedUser) router.push("/auth/login");
    else setUser(JSON.parse(storedUser));
  }, [router]);

  if (!user) return <p className="text-center mt-10 text-gray-500">Loading dashboard...</p>;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-[90%] max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome, {user.username || "User"}!</h1>
        <p className="text-gray-500 mb-8">
          This is your dashboard. In the future, you’ll see your products, orders, and payments here.
        </p>

        <button
          onClick={() => {
            localStorage.removeItem("user");
            router.push("/auth/login");
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
