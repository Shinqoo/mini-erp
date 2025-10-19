"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center text-white">
      <div className="text-lg font-semibold">Mini ERP</div>

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-400">
            {user.email} ({user.role})
          </span>
        )}
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm font-semibold"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
